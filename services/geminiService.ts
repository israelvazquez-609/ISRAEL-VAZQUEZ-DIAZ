
import { GoogleGenAI } from "@google/genai";
import { Product, Employee, Area } from "../types";

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export const generateInventoryResponse = async (
  query: string,
  products: Product[],
  employees: Employee[],
  areas: Area[]
): Promise<AIResponse> => {
  if (!process.env.API_KEY) {
    return { text: "Error: API Key no configurada (process.env.API_KEY).", sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a context string from the current state
  const inventoryContext = `
    DATOS DEL INVENTARIO ACTUAL:
    
    PRODUCTOS:
    ${products.map(p => `- ${p.nombre} (${p.marca}): ${p.stock_actual} ${p.unidad} (Mín: ${p.stock_minimo}) - Ubic: ${p.clasificacion}`).join('\n')}
    
    EMPLEADOS:
    ${employees.map(e => `- ${e.nombre}: Áreas ${e.areas_asignadas.join(', ')}`).join('\n')}
    
    AREAS:
    ${areas.map(a => `- ${a.nombre}`).join(', ')}
  `;

  try {
    /* Using gemini-3-flash-preview for basic text tasks and search grounding as per guidelines */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Eres un asistente de IA experto en control de inventario para una preparatoria.
        Tienes acceso a los siguientes datos en tiempo real:
        ${inventoryContext}
        
        Responde a la siguiente consulta del usuario de manera concisa y útil.
        Si la pregunta requiere información externa (ej. "mejor desinfectante"), usa la herramienta de búsqueda.
        Consulta del usuario: "${query}"
      `,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres un asistente útil y profesional para el administrador de mantenimiento.",
      },
    });

    /* Directly accessing the .text property of the response */
    const text = response.text || "No pude generar una respuesta.";
    const sources: { title: string; uri: string }[] = [];

    /* Extracting website URLs from groundingChunks as required when using googleSearch */
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Fuente Externa",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Lo siento, hubo un error al consultar el servicio de IA.", sources: [] };
  }
};
