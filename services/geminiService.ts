
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

// Используем gemini-3-flash-preview для всех задач, так как у нее самые высокие бесплатные лимиты
const DEFAULT_MODEL = 'gemini-3-flash-preview';

export const evaluateEssay = async (submission: WritingSubmission): Promise<IELTSEvaluation> => {
  const ai = getAIClient();
  
  const promptText = `ACT AS THE CHIEF GLOBAL IELTS EXAMINER. 
  EVALUATE ACCORDING TO THE STRICT 2025 OFFICIAL BAND DESCRIPTORS.

  STRICT CALIBRATION RULES:
  - Band 4.5-5.0: Frequent errors, limited range, repetitive.
  - Band 7.0-8.0: High precision, rare errors, complex structures.
  - Band 9.0: Expert user, effortless precision.

  TASK: ${submission.taskType}
  PROMPT: ${submission.prompt}
  ESSAY: ${submission.essay}

  Return valid JSON.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL, 
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallBand: { type: Type.NUMBER },
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
          detailedAnalysis: { type: Type.STRING },
          improvedVersion: { type: Type.STRING },
          wordCount: { type: Type.NUMBER }
        },
        required: ["overallBand", "taskResponse", "coherenceCohesion", "lexicalResource", "grammaticalRange", "detailedAnalysis", "improvedVersion", "wordCount"]
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
    contents: [{ parts: [{ text: `Examiner Report: ${text.slice(0, 500)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const quickScanEssay = async (essay: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [{ parts: [{ text: `Identify 3 high-level Band 9.0 adjustments for: "${essay}"` }] }],
  });
  return response.text?.trim() || "Analysis complete.";
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [{ parts: [{ text: `IELTS synonyms for "${word}" for bands 7, 8, 9.` }] }],
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
    model: DEFAULT_MODEL,
    contents: [{ parts: [{ text: `Syntactic upgrade for: "${sentence}"` }] }],
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
    model: DEFAULT_MODEL,
    contents: [{ parts: [{ text: `Generate a 2025 IELTS ${type} topic.` }] }],
  });
  return response.text?.trim() || "Topic generation failed.";
};

export const brainstormIdeas = async (promptText: string, taskType: TaskType) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [{ parts: [{ text: `Brainstorm Band 9.0 ideas for: "${promptText}"` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: DEFAULT_MODEL,
    config: { systemInstruction: 'You are an IELTS Examiner. Provide critical academic feedback.' },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
