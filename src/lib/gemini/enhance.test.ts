import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();

// enhance.ts imports "server-only", which throws when loaded outside a real
// Next.js server render (e.g. under Vitest's jsdom environment). Same fix as
// src/lib/supabase/dal.test.ts for the identical issue.
vi.mock("server-only", () => ({}));

// mockImplementation must use a `function` (not an arrow function) here:
// enhance.ts calls `new GoogleGenAI(...)`, and this project's installed
// Vitest 4 (tinyspy-based mocks) throws "is not a constructor" if the mock
// implementation is an arrow function, since arrow functions cannot be used
// as constructors in JS.
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return { models: { generateContent: mockGenerateContent } };
  }),
}));

describe("enhanceImage", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it("sends the image and prompt, and returns the edited image bytes", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { text: "Listo" },
              { inlineData: { mimeType: "image/png", data: Buffer.from("edited-bytes").toString("base64") } },
            ],
          },
        },
      ],
    });
    const { enhanceImage } = await import("./enhance");

    const result = await enhanceImage({
      imageBytes: Buffer.from("original-bytes"),
      mimeType: "image/jpeg",
      prompt: "un prompt de prueba",
    });

    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: "gemini-2.5-flash-image",
      contents: [
        { inlineData: { data: Buffer.from("original-bytes").toString("base64"), mimeType: "image/jpeg" } },
        { text: "un prompt de prueba" },
      ],
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });
    expect(result.mimeType).toBe("image/png");
    expect(result.imageBytes.toString()).toBe("edited-bytes");
  });

  it("throws a clear error when Gemini returns no image", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: "No pude procesar la imagen" }] } }],
    });
    const { enhanceImage } = await import("./enhance");

    await expect(
      enhanceImage({ imageBytes: Buffer.from("x"), mimeType: "image/jpeg", prompt: "p" })
    ).rejects.toThrow("Gemini no retornó ninguna imagen");
  });
});
