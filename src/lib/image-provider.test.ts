import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSettings = vi.fn();
vi.mock("@/lib/settings", () => ({
  getSettings: (...args: unknown[]) => mockGetSettings(...args),
}));

const mockGeminiEnhance = vi.fn();
const mockGeminiCover = vi.fn();
vi.mock("@/lib/gemini/enhance", () => ({
  enhanceImage: (...args: unknown[]) => mockGeminiEnhance(...args),
  generateCoverImage: (...args: unknown[]) => mockGeminiCover(...args),
}));

const mockOpenaiEnhance = vi.fn();
const mockOpenaiCover = vi.fn();
vi.mock("@/lib/openai/enhance", () => ({
  enhanceImage: (...args: unknown[]) => mockOpenaiEnhance(...args),
  generateCoverImage: (...args: unknown[]) => mockOpenaiCover(...args),
}));

describe("image-provider dispatcher", () => {
  beforeEach(() => {
    mockGetSettings.mockReset();
    mockGeminiEnhance.mockReset().mockResolvedValue({ imageBytes: Buffer.from("g"), mimeType: "image/png" });
    mockGeminiCover.mockReset().mockResolvedValue({ imageBytes: Buffer.from("g"), mimeType: "image/png" });
    mockOpenaiEnhance.mockReset().mockResolvedValue({ imageBytes: Buffer.from("o"), mimeType: "image/png" });
    mockOpenaiCover.mockReset().mockResolvedValue({ imageBytes: Buffer.from("o"), mimeType: "image/png" });
  });

  it("routes enhanceImage to Gemini when settings.imageProvider is gemini", async () => {
    mockGetSettings.mockResolvedValue({ imageProvider: "gemini" });
    const { enhanceImage } = await import("./image-provider");

    const args = { imageBytes: Buffer.from("x"), mimeType: "image/jpeg", prompt: "p" };
    await enhanceImage(args);

    expect(mockGeminiEnhance).toHaveBeenCalledWith(args);
    expect(mockOpenaiEnhance).not.toHaveBeenCalled();
  });

  it("routes enhanceImage to OpenAI when settings.imageProvider is openai", async () => {
    mockGetSettings.mockResolvedValue({ imageProvider: "openai" });
    const { enhanceImage } = await import("./image-provider");

    const args = { imageBytes: Buffer.from("x"), mimeType: "image/jpeg", prompt: "p" };
    await enhanceImage(args);

    expect(mockOpenaiEnhance).toHaveBeenCalledWith(args);
    expect(mockGeminiEnhance).not.toHaveBeenCalled();
  });

  it("routes generateCoverImage to the configured provider", async () => {
    mockGetSettings.mockResolvedValue({ imageProvider: "openai" });
    const { generateCoverImage } = await import("./image-provider");

    await generateCoverImage({ prompt: "p" });

    expect(mockOpenaiCover).toHaveBeenCalledWith({ prompt: "p" });
    expect(mockGeminiCover).not.toHaveBeenCalled();
  });
});
