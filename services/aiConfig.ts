
import { GoogleGenAI } from "@google/genai";

/**
 * Инициализация клиента Gemini.
 * Использует API_KEY из окружения (process.env.API_KEY).
 */
export const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    console.warn("AI API Key is missing in environment variables.");
  }
  
  return new GoogleGenAI({ apiKey: apiKey || "" });
};
