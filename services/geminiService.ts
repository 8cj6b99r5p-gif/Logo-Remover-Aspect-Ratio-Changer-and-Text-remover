import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const getBase64Data = (base64Image: string) => {
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));
  return { base64Data, mimeType };
};

export const cleanImage = async (base64Image: string): Promise<string> => {
  try {
    const { base64Data, mimeType } = getBase64Data(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Edit this image. Detect and remove any logos, brand icons, watermarks, or corporate branding text found in this image. Inpaint the area where the logo was removed to seamlessly match the surrounding background pattern, texture, and lighting. Output the clean image."
          }
        ]
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Image Cleaning Error:", error);
    throw error;
  }
};

export const convertImageToVertical = async (base64Image: string): Promise<string> => {
  try {
    const { base64Data, mimeType } = getBase64Data(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Reformat this landscape image into a 9:16 vertical aspect ratio (portrait). Preserve all the original text and main visual elements exactly as they are, but rearrange the layout to fit a vertical mobile screen seamlessly. Do not summarize text, keep it identical."
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Image Conversion Error:", error);
    throw error;
  }
};

export const removeTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const { base64Data, mimeType } = getBase64Data(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Edit this image. Identify and remove all visible text content from the image. Inpaint the areas where text was removed to blend naturally with the background textures and colors. Preserve all other visual elements, objects, and artistic style, only remove the text."
          }
        ]
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Text Removal Error:", error);
    throw error;
  }
};

export const customizeTextInImage = async (base64Image: string, instruction: string): Promise<string> => {
  try {
    const { base64Data, mimeType } = getBase64Data(base64Image);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Edit this image. ${instruction}. When modifying or replacing text, it is CRITICAL to strictly match the original font family, weight, style, color, and size of the surrounding or replaced text. The change should look indistinguishable from the original design.`
          }
        ]
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Text Customization Error:", error);
    throw error;
  }
};

const extractImageFromResponse = (response: any): string => {
  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    const parts = candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image generated in response");
};