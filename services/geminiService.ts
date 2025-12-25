
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WritingSubmission, IELTSEvaluation, TaskType } from "../types";

const cleanJson = (text: string): string => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : text.trim();
  } catch (e) {
    return text.trim();
  }
};

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    throw new Error("CRITICAL: API_KEY is not configured in environment variables. Please add it to your project settings.");
  }
  return new GoogleGenAI({ apiKey });
};

export const evaluateEssay = async (submission: WritingSubmission): Promise<IELTSEvaluation> => {
  try {
    const ai = getAIInstance();
    const prompt = `You are a certified Senior IELTS Examiner. Evaluate this Academic Writing ${submission.taskType}.
    
    OFFICIAL PROMPT: ${submission.prompt}
    STUDENT ESSAY: ${submission.essay}
    
    Strictly apply IELTS assessment criteria. Return result in JSON format only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");
    
    return JSON.parse(cleanJson(text)) as IELTSEvaluation;
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    throw new Error(error.message || "Evaluation failed due to an internal AI error.");
  }
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide 3 academic synonyms for "${word}" at IELTS Band 7, 8, and 9 levels. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          band7: { type: Type.STRING },
          band8: { type: Type.STRING },
          band9: { type: Type.STRING }
        },
        required: ["band7", "band8", "band9"]
      }
    }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const transformSentence = async (sentence: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Rewrite this sentence into academic IELTS structures at Band 7, 8, and 9: "${sentence}". Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          band7: { type: Type.STRING },
          band8: { type: Type.STRING },
          band9: { type: Type.STRING }
        },
        required: ["band7", "band8", "band9"]
      }
    }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const quickScanEssay = async (essay: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Perform a quick academic scan of this IELTS essay. Focus on identifying major grammar issues. Keep feedback brief. ESSAY: ${essay}`,
  });
  return response.text?.trim() || "No feedback available.";
};

export const generateWritingTopic = async (type: TaskType): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a realistic IELTS Academic Writing ${type} prompt.`,
  });
  return response.text?.trim() || "Topic generation failed.";
};

export const brainstormIdeas = async (promptText: string, taskType: TaskType) => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide brainstorming for this IELTS ${taskType} prompt: "${promptText}". Return JSON with ideas, vocab, and structure.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = getAIInstance();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: 'You are a helpful IELTS tutor. Keep answers brief (max 3 sentences).' },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

export const getAudioFeedback = async (text: string): Promise<string> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Feedback summary: ${text.slice(0, 400)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
