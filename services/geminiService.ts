
import { Type, Modality } from "@google/genai";
import { getAIClient } from "./aiConfig";
import { WritingSubmission, IELTSEvaluation, TaskType } from "../types";

/**
 * Очистка и извлечение чистого JSON из ответа модели.
 */
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
  
  // Усиленный промпт для разграничения пограничных баллов
  const promptText = `ACT AS THE CHIEF IELTS EXAMINER. 
  EVALUATE ACCORDING TO THE STRICT 2025 IELTS WRITING BAND DESCRIPTORS.

  SCORING ACCURACY MANDATE (VERY IMPORTANT):
  - BAND 4.5 vs 5.5: 
    * 4.5: Limited control, errors often distort meaning, repetitive vocabulary, many punctuation errors.
    * 5.5: Some control, reasonably relevant, attempts complex structures but with frequent errors.
    * If the text is barely readable or has systemic grammar failures, it MUST BE 4.5 or lower.
  - BAND 8.5 vs 9.0:
    * 8.5: Only rare minor slips, sophisticated but perhaps one or two slight inappropriate lexical choices.
    * 9.0: Expert user, full functional command, seamless transitions, precise vocabulary. 
    * 9.0 is achievable if the text is natural and academically flawless, even with 1 tiny slip.

  TASK: ${submission.taskType}
  PROMPT: ${submission.prompt}
  ESSAY: ${submission.essay}

  CRITICAL: Return only valid JSON matching the provided schema. Do not add markdown or extra text.`;

  // Используем Gemini 3 Flash с responseSchema для исключения ошибок парсинга
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0, // Исключаем "фантазию" для точности оценок
      thinkingConfig: {
        thinkingBudget: 24000 // Модель сначала "продумывает" критерии 2025 года
      },
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
  
  try {
    return JSON.parse(cleanJson(text)) as IELTSEvaluation;
  } catch (err) {
    console.error("JSON Parsing failed after cleanJson:", text);
    throw new Error("FAILED_TO_PARSE_EXAMINER_REPORT");
  }
};

export const getAudioFeedback = async (text: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `IELTS Examiner Feedback: ${text.slice(0, 500)}` }] }],
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
    contents: [{ parts: [{ text: `Briefly identify 3 essential high-level improvements for this IELTS writing to reach Band 9.0: "${essay}"` }] }],
  });
  return response.text?.trim() || "Ready for analysis.";
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Advanced academic synonyms for "${word}" across IELTS bands 7, 8, and 9.` }] }],
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
    contents: [{ parts: [{ text: `Syntactic restructuring of "${sentence}" for IELTS Bands 7, 8, and 9.` }] }],
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
    contents: [{ parts: [{ text: `Generate a sophisticated academic IELTS Writing ${type} prompt.` }] }],
  });
  return response.text?.trim() || "Topic generation unavailable.";
};

export const brainstormIdeas = async (promptText: string, taskType: TaskType) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: `Brainstorm high-level Band 9.0 conceptual frameworks for this topic: "${promptText}"` }] }],
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
};

export const chatWithExaminer = async (history: any[], newMessage: string) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { 
      systemInstruction: 'You are an Elite Senior IELTS Examiner (2025 Standard). Provide technical, academic, and direct guidance for reaching Band 9.0.' 
    },
  });
  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};
