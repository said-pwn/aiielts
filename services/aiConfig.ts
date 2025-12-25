
import { GoogleGenAI } from "@google/genai";

/**
 * Инициализация клиента Gemini.
 * Переменная process.env.API_KEY должна быть настроена в Dashboard Vercel.
 */
export const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    // Этот лог поможет вам понять, что Vercel не видит переменную.
    // Проверьте настройки проекта на Vercel (Project Settings -> Environment Variables).
    console.error("CRITICAL: AI API Key (process.env.API_KEY) is missing. Check Vercel project settings.");
  }
  
  return new GoogleGenAI({ apiKey: apiKey || "" });
};
