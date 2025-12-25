
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

/**
 * Creates a fresh AI instance. 
 * Per guidelines, we must create a new instance right before the call 
 * to ensure we use the latest injected process.env.API_KEY.
 */
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  
  // Checking for common "missing key" strings that might come from bundlers or environments
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.length < 10) {
    throw new Error("API_KEY_MISSING");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const evaluateEssay = async (submission: WritingSubmission): Promise<IELTSEvaluation> => {
  try {
    const ai = getAIInstance();
    const prompt = `You are a certified Senior IELTS Examiner. Evaluate this Academic Writing ${submission.taskType}.
    
    OFFICIAL PROMPT: ${submission.prompt}
    STUDENT ESSAY: ${submission.essay}
    
    Criteria: Task Response, Cohesion, Lexical Resource, Grammar.
    Return JSON format only with fields: overallBand, taskResponse, coherenceCohesion, lexicalResource, grammaticalRange, detailedAnalysis, improvedVersion, wordCount.`;

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
    if (!text) throw new Error("EMPTY_RESPONSE");
    
    return JSON.parse(cleanJson(text)) as IELTSEvaluation;
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    if (error.message?.includes("API key not valid")) throw new Error("API_KEY_INVALID");
    
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "EVALUATION_FAILED");
  }
};

// Fix: Added missing quickScanEssay function
export const quickScanEssay = async (essay: string): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quickly review this IELTS essay and provide a one-sentence high-level feedback: "${essay}"`,
    });
    return response.text || "Scan failed.";
  } catch (err) {
    console.error("Quick Scan Error:", err);
    throw err;
  }
};

// Fix: Added missing getAudioFeedback function using the dedicated TTS model
export const getAudioFeedback = async (text: string): Promise<string> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say in a professional examiner voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio feedback generated");
    return base64Audio;
  } catch (err) {
    console.error("Audio Feedback Error:", err);
    throw err;
  }
};

// Fix: Added missing chatWithExaminer function to enable interaction with the results
export const chatWithExaminer = async (history: any[], message: string): Promise<string> => {
  try {
    const ai = getAIInstance();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: 'You are an IELTS examiner assisting a student with their writing feedback. Be academic, precise, and encouraging.',
      }
    });
    const response = await chat.sendMessage({ message });
    return response.text || "I am unable to formulate a response at this moment.";
  } catch (err) {
    console.error("Examiner Chat Error:", err);
    throw err;
  }
};

export const transmuteVocabulary = async (word: string): Promise<{ band7: string; band8: string; band9: string }> => {
  try {
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
  } catch (err: any) {
    throw err;
  }
};

export const transformSentence = async (sentence: string): Promise<{ band7: string; band8: string; band9: string }> => {
  try {
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
  } catch (err: any) {
    throw err;
  }
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
