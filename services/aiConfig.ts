
import { GoogleGenAI } from "@google/genai";

/**
 * Инициализация клиента Gemini.
 * Переменная окружения 'API_KEY' должна быть настроена в панели Vercel.
 */
export const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    // Выбрасываем ошибку, чтобы WritingPanel мог её поймать и показать пользователю
    throw new Error("API Key is missing. Please add 'API_KEY' to your Vercel Environment Variables.");
  }
  
  return new GoogleGenAI({ apiKey });
};
