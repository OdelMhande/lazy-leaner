import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, UserGoals } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize client once
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateResponse = async (
  prompt: string, 
  goals: UserGoals
): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing.");

  const systemInstruction = `You are an expert study companion. 
  Your goal is to help the user learn efficiently.
  
  User's Learning Objectives: ${goals.objectives || "General learning"}
  User's Knowledge Base/Context: ${goals.knowledgeBase || "None provided"}

  Provide clear, concise, and engaging responses. 
  Use Markdown for formatting (bold key terms, use lists for steps).
  If the user asks to read text, simply confirm you will read it and then repeat the text formatted for reading.
  Keep responses under 300 words unless asked for more detail.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated.");
    return text;
  } catch (error) {
    console.error("Text Gen Error:", error);
    throw error;
  }
};

export const generateSpeechFromText = async (text: string, voice: VoiceName): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing.");

  // Clean markdown for speech (simple regex to remove common markdown symbols for smoother reading if needed, 
  // though Gemini TTS is generally smart enough to ignore asterisks).
  // A simple cleanup might be beneficial.
  const cleanText = text.replace(/[*#_`]/g, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data received from Gemini.");
    }
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
