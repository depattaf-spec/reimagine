import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ChatResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to remove data URL prefix
const stripBase64Prefix = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

/**
 * Generates a new room design based on an input image and a style prompt.
 * Uses a fallback strategy to handle potential 403 Permission Denied errors on specific models.
 */
export const generateRoomDesign = async (base64Image: string, prompt: string, isRefinement: boolean = false): Promise<string> => {
  const cleanBase64 = stripBase64Prefix(base64Image);
  
  // Quality boosters
  const qualityBoosters = "photorealistic, 8k resolution, highly detailed, professional interior design photography, magazine quality, sharp focus, perfectly lit, ultra-realistic textures.";
  
  let textPrompt = "";
  if (isRefinement) {
      textPrompt = `Edit this image precisely based on this instruction: "${prompt}". 
      IMPORTANT: Be seamless. If removing objects, reconstruct the background (floor/wall) realistically to match the surrounding area. 
      Maintain the original perspective, lighting, and unedited structural elements exactly. ${qualityBoosters}`;
  } else {
      textPrompt = `Redesign this entire room ${prompt}. 
      Keep the structural layout (walls, windows, doors, perspective) exactly the same. 
      Produce a photorealistic, high-quality image suitable for professional presentation. ${qualityBoosters}`;
  }

  const parts = [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64,
      },
    },
    { text: textPrompt }
  ];

  // Attempt with primary model, fallback to secondary if permission denied
  const modelsToTry = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];
  
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
      });

      // Extract image
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      // If it's the last model to try, throw the error
      if (modelName === modelsToTry[modelsToTry.length - 1]) {
        throw error;
      }
      // Otherwise loop to try next model
    }
  }
  
  throw new Error("Generazione immagine fallita con tutti i modelli disponibili.");
};

/**
 * Chat with the model about the design.
 * Handles Design Refinement (via Function Calling).
 * Note: googleSearch removed to avoid 'PERMISSION_DENIED' due to tool conflicts.
 */
export const sendChatMessage = async (
  message: string, 
  currentImageBase64: string | null
): Promise<ChatResponse> => {
  try {
    const refineDesignTool: FunctionDeclaration = {
      name: "refine_design",
      parameters: {
        type: Type.OBJECT,
        description: "Chiama questo strumento quando l'utente chiede esplicitamente di modificare, cambiare, rimuovere o aggiungere elementi visivi nel design. Non usarlo per domande generiche.",
        properties: {
          instructions: {
            type: Type.STRING,
            description: "Istruzioni visive dettagliate per il generatore di immagini in INGLESE. È CRUCIALE convertire la richiesta dell'utente in una descrizione visiva precisa. Esempio: 'togli la sedia' -> 'remove the chair and show the empty wooden floor and wall skirting behind it'.",
          },
        },
        required: ["instructions"],
      },
    };

    // STRICT: Only use functionDeclarations. Mixing with googleSearch often causes 403 errors.
    const tools: any[] = [
      { functionDeclarations: [refineDesignTool] }
    ];

    const parts: any[] = [{ text: message }];
    
    if (currentImageBase64) {
        parts.unshift({
            inlineData: {
                mimeType: 'image/jpeg',
                data: stripBase64Prefix(currentImageBase64)
            }
        });
        parts.unshift({
            text: "Ecco il design attuale della stanza di cui stiamo discutendo."
        });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        tools: tools,
        systemInstruction: `Sei un esperto Consulente di Interior Design italiano.
        
        Obiettivi:
        1. Aiutare l'utente a perfezionare il design.
        2. Se l'utente chiede modifiche visive (es. "cambia il colore", "togli questo mobile"), usa SEMPRE lo strumento 'refine_design'.
        3. Quando usi 'refine_design', scrivi istruzioni in INGLESE molto dettagliate per l'IA visiva.
        4. Se l'utente chiede dove comprare oggetti, suggerisci brand generici o stili di ricerca, poiché lo strumento di ricerca live è disabilitato per stabilità.
        
        Rispondi sempre in ITALIANO.`,
      },
    });

    const candidate = response.candidates?.[0];
    const content = candidate?.content;

    // Check for tool calls
    const functionCall = content?.parts?.find(p => p.functionCall)?.functionCall;
    
    if (functionCall) {
       return {
         text: "Certamente! Sto rielaborando il design seguendo le tue indicazioni...",
         toolCall: {
           name: functionCall.name,
           args: functionCall.args as Record<string, any>
         }
       };
    }

    return {
      text: response.text || "Mi dispiace, non ho capito. Puoi riformulare?",
    };

  } catch (error) {
    console.error("Chat failed:", error);
    return { text: "Scusa, si è verificato un errore momentaneo. Riprova tra poco." };
  }
};