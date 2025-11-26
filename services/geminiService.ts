import { GoogleGenAI, Type } from "@google/genai";
import { Channel } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRecommendations = async (
  userQuery: string,
  channels: Channel[]
): Promise<{ text: string; channelIds: string[] }> => {
  try {
    const channelContext = channels.map(c => 
      `ID: ${c.id}, Name: ${c.name}, Category: ${c.category}, Desc: ${c.description}`
    ).join('\n');

    const prompt = `
      Sei un esperto assistente TV per un'app di streaming italiana.
      L'utente vuole sapere cosa guardare.
      Ecco la lista dei canali disponibili:
      ${channelContext}

      Domanda utente: "${userQuery}"

      Rispondi in italiano. Sii amichevole e breve.
      Suggerisci 1-3 canali dalla lista fornita che meglio si adattano alla richiesta.
      Se la richiesta non è chiara, suggerisci canali popolari (News o Musica).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            responseText: {
              type: Type.STRING,
              description: 'Il testo della risposta da mostrare all\'utente.'
            },
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array degli ID dei canali raccomandati.'
            }
          },
          required: ['responseText', 'recommendedIds']
        }
      }
    });

    const json = JSON.parse(response.text || '{}');
    
    return {
      text: json.responseText || "Non sono riuscito a trovare un suggerimento specifico, ma ecco la lista dei canali!",
      channelIds: json.recommendedIds || []
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "Mi dispiace, al momento non riesco a connettermi al cervello digitale. Ecco tutti i canali.",
      channelIds: []
    };
  }
};
