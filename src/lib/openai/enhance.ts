import "server-only";
import OpenAI, { toFile } from "openai";

const TIMEOUT_MS = 60_000;
const MODEL = "gpt-image-1";
// "auto" (the default) resolves to "high" for edits — ~$0.17/image, roughly
// 4x Gemini's cost for the same shot. "medium" matches Gemini's price while
// staying sharp enough for catalog photos.
const QUALITY = "medium";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("ChatGPT no respondió a tiempo. Intenta de nuevo.")), ms)
    ),
  ]);
}

function extractImage(response: OpenAI.Images.ImagesResponse): { imageBytes: Buffer; mimeType: string } {
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("ChatGPT no retornó ninguna imagen. Intenta de nuevo o ajusta el prompt.");
  }
  // GPT image models always return base64 PNG (see ImagesResponse.output_format docs).
  return { imageBytes: Buffer.from(b64, "base64"), mimeType: "image/png" };
}

export async function enhanceImage({
  imageBytes,
  mimeType,
  prompt,
}: {
  imageBytes: Buffer;
  mimeType: string;
  prompt: string;
}): Promise<{ imageBytes: Buffer; mimeType: string }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const file = await toFile(imageBytes, "original", { type: mimeType });

  const response = await withTimeout(
    client.images.edit({ image: file, prompt, model: MODEL, quality: QUALITY }),
    TIMEOUT_MS
  );

  return extractImage(response);
}

export async function generateCoverImage({
  prompt,
}: {
  prompt: string;
}): Promise<{ imageBytes: Buffer; mimeType: string }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await withTimeout(
    client.images.generate({ prompt, model: MODEL, quality: QUALITY }),
    TIMEOUT_MS
  );

  return extractImage(response);
}
