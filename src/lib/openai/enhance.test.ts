import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEdit = vi.fn();
const mockGenerate = vi.fn();
const mockToFile = vi.fn();

vi.mock("server-only", () => ({}));

// mockImplementation must use a `function` (not an arrow function) here — same
// reason as src/lib/gemini/enhance.test.ts: `new OpenAI(...)` needs a
// constructible mock under this project's Vitest 4 (tinyspy-based mocks).
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function () {
    return { images: { edit: mockEdit, generate: mockGenerate } };
  }),
  toFile: (...args: unknown[]) => mockToFile(...args),
}));

describe("enhanceImage", () => {
  beforeEach(() => {
    mockEdit.mockReset();
    mockToFile.mockReset().mockResolvedValue("mock-file");
  });

  it("wraps the original image into a file and sends it with the prompt", async () => {
    mockEdit.mockResolvedValue({ data: [{ b64_json: Buffer.from("edited-bytes").toString("base64") }] });
    const { enhanceImage } = await import("./enhance");

    const result = await enhanceImage({
      imageBytes: Buffer.from("original-bytes"),
      mimeType: "image/jpeg",
      prompt: "un prompt de prueba",
    });

    expect(mockToFile).toHaveBeenCalledWith(
      Buffer.from("original-bytes"),
      expect.any(String),
      { type: "image/jpeg" }
    );
    expect(mockEdit).toHaveBeenCalledWith({
      image: "mock-file",
      prompt: "un prompt de prueba",
      model: "gpt-image-1",
    });
    expect(result.mimeType).toBe("image/png");
    expect(result.imageBytes.toString()).toBe("edited-bytes");
  });

  it("throws a clear error when OpenAI returns no image", async () => {
    mockEdit.mockResolvedValue({ data: [] });
    const { enhanceImage } = await import("./enhance");

    await expect(
      enhanceImage({ imageBytes: Buffer.from("x"), mimeType: "image/jpeg", prompt: "p" })
    ).rejects.toThrow("ChatGPT no retornó ninguna imagen");
  });

  it("rejects with a clear error when OpenAI hangs past the 60s timeout", async () => {
    vi.useFakeTimers();
    try {
      mockEdit.mockImplementation(() => new Promise(() => {}));
      const { enhanceImage } = await import("./enhance");

      const resultPromise = enhanceImage({
        imageBytes: Buffer.from("x"),
        mimeType: "image/jpeg",
        prompt: "p",
      });
      const assertion = expect(resultPromise).rejects.toThrow(
        "ChatGPT no respondió a tiempo. Intenta de nuevo."
      );

      await vi.advanceTimersByTimeAsync(60_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("generateCoverImage", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
  });

  it("sends only the prompt and returns the generated image bytes", async () => {
    mockGenerate.mockResolvedValue({ data: [{ b64_json: Buffer.from("cover-bytes").toString("base64") }] });
    const { generateCoverImage } = await import("./enhance");

    const result = await generateCoverImage({ prompt: "una portada de prueba" });

    expect(mockGenerate).toHaveBeenCalledWith({
      prompt: "una portada de prueba",
      model: "gpt-image-1",
    });
    expect(result.mimeType).toBe("image/png");
    expect(result.imageBytes.toString()).toBe("cover-bytes");
  });

  it("throws a clear error when OpenAI returns no image", async () => {
    mockGenerate.mockResolvedValue({ data: [] });
    const { generateCoverImage } = await import("./enhance");

    await expect(generateCoverImage({ prompt: "p" })).rejects.toThrow(
      "ChatGPT no retornó ninguna imagen"
    );
  });

  it("rejects with a clear error when OpenAI hangs past the 60s timeout", async () => {
    vi.useFakeTimers();
    try {
      mockGenerate.mockImplementation(() => new Promise(() => {}));
      const { generateCoverImage } = await import("./enhance");

      const resultPromise = generateCoverImage({ prompt: "p" });
      const assertion = expect(resultPromise).rejects.toThrow(
        "ChatGPT no respondió a tiempo. Intenta de nuevo."
      );

      await vi.advanceTimersByTimeAsync(60_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
