
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WritingSubmission, IELTSEvaluation, TaskType } from "../types";

// Вспомогательная функция для очистки JSON-ответа от AI
const cleanJson = (text: string): string => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : text.trim();
  } catch (e) {
    return text.trim();
  }
};

const EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallBand: { type: Type.NUMBER, description: "Final IELTS band score (0-9, increments of 0.5)" },
    taskResponse: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "feedback", "strengths", "weaknesses"]
    },
    coherenceCohesion: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "feedback", "strengths", "weaknesses"]
    },
    lexicalResource: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "feedback", "strengths", "weaknesses"]
    },
    grammaticalRange: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "feedback", "strengths", "weaknesses"]
    },
    detailedAnalysis: { type: Type.STRING, description: "A comprehensive analysis of the essay" },
    improvedVersion: { type: Type.STRING, description: "A rewritten Band 9 version of the essay" },
    wordCount: { type: Type.INTEGER }
  },
  required: ["overallBand", "taskResponse", "coherenceCohesion", "lexicalResource", "grammaticalRange", "detailedAnalysis", "improvedVersion", "wordCount"]
};

// Full IELTS assessment with scoring and improvement prototype
export const evaluateEssay = async (submission: WritingSubmission): Promise<IELTSEvaluation> => {
  // Создаем экземпляр прямо перед вызовом для безопасности
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `You are a certified Senior IELTS Examiner. Evaluate this Academic Writing ${submission.taskType}.
  
  OFFICIAL PROMPT: ${submission.prompt}
  STUDENT ESSAY: ${submission.essay}
  
  Strictly apply IELTS assessment criteria. Return result in JSON format only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: EVALUATION_SCHEMA,
        temperature: 0.1,
        // Использование Thinking Config для глубокого анализа
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(cleanJson(text)) as IELTSEvaluation;
  } catch (error) {
    console.error("Evaluation Error:", error);
    throw error;
  }
};

/**
 * Quick scan of an essay for immediate grammar and coherence feedback.
 */
export const quickScanEssay = async (essay: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Perform a quick academic scan of this IELTS essay. Focus on identifying major grammar issues or coherence gaps. Keep feedback very brief (1-2 sentences).

  ESSAY: ${essay}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.5 }
    });
    return response.text?.trim() || "No feedback available.";
  } catch (err) {
    console.error("Quick Scan Error:", err);
    throw err;
  }
};

// Generates a new IELTS writing topic
export const generateWritingTopic = async (type: TaskType): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate a realistic and current IELTS Academic Writing ${type} prompt. Return only the prompt text.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.8 }
    });
    return response.text?.trim() || "Topic generation failed.";
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Brainstorms ideas, vocabulary, and structure for a given prompt
export const brainstormIdeas = async (promptText: string, taskType: TaskType): Promise<{ ideas: string[], vocab: string[], structure: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Provide brainstorming for this IELTS ${taskType} prompt: "${promptText}". Return JSON with ideas, vocab (Band 9), and structure.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: { type: Type.ARRAY, items: { type: Type.STRING } },
            vocab: { type: Type.ARRAY, items: { type: Type.STRING } },
            structure: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["ideas", "vocab", "structure"]
        }
      }
    });

    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (error) {
    console.error("Brainstorm Error:", error);
    throw error;
  }
};

// Suggests higher band-score vocabulary alternatives
export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Provide 3 academic synonyms for "${word}" at IELTS Band 7, 8, and 9 levels. Return as JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            band7: { type: Type.STRING },
            band8: { type: Type.STRING },
            band9: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Rewrites a sentence into complex academic structures
export const transformSentence = async (sentence: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Rewrite this sentence into academic IELTS structures at Band 7, 8, and 9: "${sentence}". Return as JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            band7: { type: Type.STRING },
            band8: { type: Type.STRING },
            band9: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Brief chat interaction with an IELTS tutor persona
export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { 
      systemInstruction: 'You are a helpful IELTS tutor. Keep answers brief (max 3 sentences).' 
    },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

// Generates TTS audio for examiner feedback
export const getAudioFeedback = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Examiner feedback summary: ${text.slice(0, 400)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
