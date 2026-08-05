import "server-only";
import { GoogleGenAI } from "@google/genai";

export async function enhanceImage({
  imageBytes,
  mimeType,
  prompt,
}: {
  imageBytes: Buffer;
  mimeType: string;
  prompt: string;
}): Promise<{ imageBytes: Buffer; mimeType: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      { inlineData: { data: imageBytes.toString("base64"), mimeType } },
      { text: prompt },
    ],
    config: { responseModalities: ["IMAGE", "TEXT"] },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { mimeType?: string } }) => p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini no retornó ninguna imagen. Intenta de nuevo o ajusta el prompt.");
  }

  return {
    imageBytes: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType!,
  };
}
