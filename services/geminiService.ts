
import { Type, Modality } from "@google/genai";
import { getAIClient } from "./aiConfig";
import { WritingSubmission, IELTSEvaluation, TaskType } from "../types";

const cleanJson = (text: string): string => {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    return text.trim();
  } catch (e) {
    return text.trim();
  }
};

export const evaluateEssay = async (submission: WritingSubmission): Promise<IELTSEvaluation> => {
  const ai = getAIClient();
  
  const promptText = `ACT AS THE CHIEF IELTS EXAMINER. 
  EVALUATE ACCORDING TO THE OFFICIAL 2025 IELTS WRITING BAND DESCRIPTORS.
  
  STRICT SCORING GUIDELINES:
  1. DO NOT be conservative. If the essay shows "full flexibility", "sophisticated control", and "seamless cohesion", you MUST award Band 9.0.
  2. Band 9.0 is NOT a "perfect" score, it is a score for "Expert User" who uses English as a precise tool.
  3. Evaluate each criterion:
     - Task Response: Full addressing of all parts? Depth of ideas?
     - Coherence & Cohesion: Seamless transitions? Skillful paragraphing?
     - Lexical Resource: Sophisticated and natural use of rare items?
     - Grammatical Range & Accuracy: Full range of structures with only very rare 'slips'?
  
  TASK: ${submission.taskType}
  PROMPT: ${submission.prompt}
  ESSAY: ${submission.essay}
  
  RETURN JSON ONLY:
  {
    "overallBand": number,
    "taskResponse": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "coherenceCohesion": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "lexicalResource": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "grammaticalRange": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "detailedAnalysis": "string (Deep analysis based on 2025 descriptors)",
    "improvedVersion": "string (The Band 9.0 Masterpiece version)",
    "wordCount": number
  }`;

  // Используем Gemini 3 Flash для максимальной скорости и точности с Thinking Budget
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1, // Для максимальной объективности
      thinkingConfig: {
        thinkingBudget: 24000 // Максимальный бюджет для "обдумывания" дескрипторов 2025
      }
    },
  });

  const text = response.text;
  if (!text) throw new Error("EMPTY_AI_RESPONSE");
  return JSON.parse(cleanJson(text)) as IELTSEvaluation;
};

export const getAudioFeedback = async (text: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Official Examiner Feedback: ${text.slice(0, 600)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const quickScanEssay = async (essay: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Quickly identify 3 core changes to elevate this text to Band 9.0: "${essay}"` }] }],
  });
  return response.text?.trim() || "Analysis ready.";
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Academic synonyms for "${word}" (2025 Standards) for bands 7, 8, 9.` }] }],
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
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Re-architect this sentence for IELTS 2025 Band 9.0 precision: "${sentence}"` }] }],
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

export const generateWritingTopic = async (type: TaskType): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Generate a sophisticated IELTS Writing ${type} topic (2025 Exam Style).` }] }],
  });
  return response.text?.trim() || "Failed to generate topic.";
};

export const brainstormIdeas = async (promptText: string, taskType: TaskType) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Provide Band 9.0 ideas for: "${promptText}"` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: 'You are a Senior IELTS Examiner (2025). Provide high-level academic advice on reaching Band 9.0.' },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
