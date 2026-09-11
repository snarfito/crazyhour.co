import "server-only";
import { getSettings } from "@/lib/settings";
import * as gemini from "@/lib/gemini/enhance";
import * as openai from "@/lib/openai/enhance";

async function selectProvider() {
  const { imageProvider } = await getSettings();
  return imageProvider === "openai" ? openai : gemini;
}

export async function enhanceImage(
  args: Parameters<typeof gemini.enhanceImage>[0]
): ReturnType<typeof gemini.enhanceImage> {
  const provider = await selectProvider();
  return provider.enhanceImage(args);
}

export async function generateCoverImage(
  args: Parameters<typeof gemini.generateCoverImage>[0]
): ReturnType<typeof gemini.generateCoverImage> {
  const provider = await selectProvider();
  return provider.generateCoverImage(args);
}
