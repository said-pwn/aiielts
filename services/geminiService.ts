
import { GoogleGenAI, Type } from "@google/genai";
import { IELTSFeedback, TaskType } from "../types";

export const gradeIELTSWriting = async (
  taskType: TaskType,
  question: string,
  userText: string,
  taskImage?: string,
  submissionImage?: string
): Promise<IELTSFeedback> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Switched to Flash model to avoid 'Resource Exhausted' (429) errors.
  // Flash has significantly higher rate limits on the Free tier.
  const ai = new GoogleGenAI({ apiKey });
  
  const wordCount = userText.trim() ? userText.trim().split(/\s+/).length : 0;
  const minWords = taskType === TaskType.TASK_2_ESSAY ? 250 : 150;

  const prompt = `
    ACT AS: Senior IELTS Examiner. 
    GOAL: High-precision assessment. 
    
    SCORING RULES:
    1. Score TR, CC, LR, GRA (0-9). 
    2. BAND 9 is for expert usage; minor slips allowed.
    3. PENALTY: If words (${wordCount}) < ${minWords}, cap Task Response at 5.0.
    4. MATH: (TR+CC+LR+GRA)/4. 
       - .125 -> .0
       - .25/.375/.5/.625 -> .5
       - .75/.875 -> next whole.

    OUTPUT: Detailed feedback, corrected Band 9 version, and grammar audit.

    INPUT:
    - Task: ${taskType}
    - Question: "${question}"
    - Essay: "${userText}"
  `;

  const contents: any = { 
    parts: [
      { text: prompt },
      ...(taskImage ? [{ inlineData: { mimeType: "image/jpeg", data: taskImage.split(',')[1] } }] : []),
      ...(submissionImage ? [{ inlineData: { mimeType: "image/jpeg", data: submissionImage.split(',')[1] } }] : [])
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Faster model with better quota
      contents,
      config: {
        temperature: 0.1,
        seed: 42,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for Flash to save tokens/time
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            cefrLevel: { type: Type.STRING },
            mentorNote: { type: Type.STRING },
            taskResponse: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } },
              required: ["score", "feedback"]
            },
            coherenceCohesion: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } },
              required: ["score", "feedback"]
            },
            lexicalResource: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } },
              required: ["score", "feedback"]
            },
            grammaticalRange: {
              type: Type.OBJECT,
              properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } },
              required: ["score", "feedback"]
            },
            correctedText: { type: Type.STRING },
            keyImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            vocabularyHighlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["word", "suggestion", "reason"]
              }
            },
            detailedErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["original", "correction", "explanation", "type"]
              }
            }
          },
          required: [
            "overallScore", "cefrLevel", "mentorNote", "taskResponse", "coherenceCohesion", 
            "lexicalResource", "grammaticalRange", "correctedText", 
            "keyImprovements", "vocabularyHighlights", "detailedErrors"
          ]
        }
      }
    });

    return JSON.parse(response.text) as IELTSFeedback;
  } catch (err: any) {
    if (err.message?.includes('429')) {
      throw new Error("QUOTA_EXHAUSTED: Лимит запросов исчерпан. Пожалуйста, подождите 60 секунд и попробуйте снова.");
    }
    throw err;
  }
};
