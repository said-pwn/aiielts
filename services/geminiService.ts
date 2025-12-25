
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
  
  // Advanced prompt calibrated for 2025 official descriptors
  const promptText = `ACT AS AN ELITE SENIOR IELTS EXAMINER (CHIEF EXAMINER STATUS).
  
  EVALUATION CONTEXT: Official IELTS Writing Descriptors (Updated for 2025).
  
  GOAL: Provide a high-precision, objective evaluation. DO NOT be overly conservative. 
  If the essay demonstrates:
  - "Full flexibility and precise control" -> Band 9.0
  - "Sophisticated use of vocabulary with only rare minor slips" -> Band 8.5-9.0
  - "Seamless cohesion and sophisticated paragraphing" -> Band 9.0
  
  MATHEMATICAL RULES:
  1. Calculate Task Response (TR), Coherence and Cohesion (CC), Lexical Resource (LR), and Grammatical Range and Accuracy (GRA).
  2. Overall Band is the arithmetic mean of the four, rounded to the nearest 0.5.
  
  INPUT DATA:
  - TASK TYPE: ${submission.taskType}
  - PROMPT: ${submission.prompt}
  - STUDENT ESSAY: ${submission.essay}
  
  JSON STRUCTURE REQUIRED (ONLY):
  {
    "overallBand": number,
    "taskResponse": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "coherenceCohesion": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "lexicalResource": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "grammaticalRange": {"score": number, "feedback": "string", "strengths": ["string"], "weaknesses": ["string"]},
    "detailedAnalysis": "Professional structural analysis for 2025 standards.",
    "improvedVersion": "A true Band 9.0 polished version.",
    "wordCount": number
  }`;

  // Using Gemini 3 Flash with high thinking budget for maximum scoring accuracy
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.1, // Minimum randomness for consistent expert grading
      thinkingConfig: {
        thinkingBudget: 24000 // Max budget to ensure the model "thinks" through the rubric thoroughly
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
    contents: [{ parts: [{ text: `Senior Examiner Summary: ${text.slice(0, 600)}` }] }],
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
    contents: [{ parts: [{ text: `Identify exactly 3 elite-level stylistic refinements to transform this text into a Band 9.0 masterpiece: "${essay}"` }] }],
  });
  return response.text?.trim() || "Ready for analysis.";
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Official 2025 academic synonyms for "${word}" across IELTS bands 7, 8, and 9.` }] }],
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
    contents: [{ parts: [{ text: `Syntactic restructuring for "${sentence}" according to IELTS 2025 grammatical range standards (Bands 7, 8, 9).` }] }],
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
    contents: [{ parts: [{ text: `Generate a high-difficulty IELTS Writing ${type} prompt based on 2025 global academic trends.` }] }],
  });
  return response.text?.trim() || "Topic generation offline.";
};

export const brainstormIdeas = async (promptText: string, taskType: TaskType) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Brainstorm a Band 9.0 conceptual framework for this topic: "${promptText}"` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(cleanJson(response.text || "{}"));
};

export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { 
      systemInstruction: 'You are a Senior IELTS Examiner (2025 Standard). Your goal is to provide precise, academic advice on reaching Band 9.0.' 
    },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
