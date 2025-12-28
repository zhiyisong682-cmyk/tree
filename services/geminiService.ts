import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHolidayGreeting = async (theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, poetic, and cinematic 2-sentence Christmas greeting inspired by a ${theme} visual style. The tone should be magical and heartwarming. Do not use quotes.`,
      config: {
        maxOutputTokens: 100,
        temperature: 0.8,
      }
    });
    
    return response.text || "Merry Christmas and a Happy New Year!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Wishing you a season filled with light and wonder.";
  }
};