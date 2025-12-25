
import { GoogleGenAI } from "@google/genai";

/**
 * Инициализация клиента Gemini.
 * ВАЖНО: На Vercel вы должны добавить API_KEY в Settings -> Environment Variables.
 */
export const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    throw new Error("API Key is missing. Please set 'API_KEY' in your Vercel Project Settings (Environment Variables).");
  }
  
  return new GoogleGenAI({ apiKey });
};
