
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
  
  const promptText = `ACT AS THE CHIEF GLOBAL IELTS EXAMINER. 
  EVALUATE ACCORDING TO THE STRICT 2025 IELTS WRITING BAND DESCRIPTORS.

  SCORING ACCURACY MANDATE:
  1. DO NOT OVERESTIMATE LOW SCORES: If the essay has frequent grammatical errors, limited range, or repetitive structures, it CANNOT exceed Band 5.0. 
     - A 4.5 score is characterized by "limited control" and "errors distorting meaning". 
     - A 5.5 score requires "reasonably relevant" content and "some control" of grammar.
  2. DO NOT UNDERESTIMATE HIGH SCORES: If the writing is "seamless", "natural", and uses "sophisticated vocabulary with precise control", award Band 9.0. 
     - Band 9.0 is for "Expert Users", not "Perfect Gods". Very rare slips are allowed if they are non-systemic.
  3. CALCULATION: 
     - Assign 0-9 for: Task Response (TR), Coherence/Cohesion (CC), Lexical Resource (LR), Grammar (GRA).
     - Overall = Average of 4 (round to nearest 0.5).

  TASK TYPE: ${submission.taskType}
  PROMPT: ${submission.prompt}
  STUDENT ESSAY: ${submission.essay}

  OUTPUT JSON ONLY:
  {
    "overallBand": number,
    "taskResponse": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "coherenceCohesion": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "lexicalResource": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "grammaticalRange": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "detailedAnalysis": "string (Explain EXACTLY why it's not a half-band higher or lower)",
    "improvedVersion": "string (A definitive Band 9.0 version)",
    "wordCount": number
  }`;

  // Используем gemini-3-flash-preview для глубокого логического анализа дескрипторов
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0, // Убираем вариативность для точности оценки
      thinkingConfig: {
        thinkingBudget: 24576 // Максимальный бюджет для устранения математических ошибок в оценке
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
    contents: [{ parts: [{ text: `List 3 elite-level corrections to push this text toward Band 9.0: "${essay}"` }] }],
  });
  return response.text?.trim() || "Analysis offline.";
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Academic upgrade for "${word}" (2025 Standards).` }] }],
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
    contents: [{ parts: [{ text: `Rewrite for Band 9.0 precision: "${sentence}"` }] }],
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
    contents: [{ parts: [{ text: `Generate a difficult 2025 IELTS ${type} topic.` }] }],
  });
  return response.text?.trim() || "Topic generation error.";
};

export const brainstormIdeas = async (promptText: string, taskType: TaskType) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Brainstorm high-level Band 9.0 ideas for: "${promptText}"` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction: 'You are a Senior IELTS Examiner 2025. Be critical, academic, and precise.' },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
