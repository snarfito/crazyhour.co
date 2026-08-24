import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const ORIGINAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://pqyunubwmchftefnqgvi.supabase.co";

vi.mock("server-only", () => ({}));

const mockRequirePermission = vi.fn();
vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

const mockSingle = vi.fn();
const mockUpload = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "product_images") {
        return {
          select: () => ({ eq: () => ({ single: mockSingle }) }),
          update: () => ({ eq: mockUpdate }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: () => ({ data: { publicUrl: "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/products/p1/x-enhanced.png" } }),
      }),
    },
  }),
}));

const mockEnhanceImage = vi.fn();
vi.mock("@/lib/gemini/enhance", () => ({
  enhanceImage: (...args: unknown[]) => mockEnhanceImage(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("enhanceProductImage", () => {
  beforeEach(() => {
    mockRequirePermission.mockReset().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co" });
    mockSingle.mockReset();
    mockUpload.mockReset().mockResolvedValue({ error: null });
    mockUpdate.mockReset().mockResolvedValue({ error: null });
    mockEnhanceImage.mockReset().mockResolvedValue({ imageBytes: Buffer.from("fake"), mimeType: "image/png" });
    mockFetch.mockReset().mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(4),
      headers: new Headers({ "content-type": "image/jpeg" }),
    });
  });

  it("requires the productos permission, not just a generic session", async () => {
    const { enhanceProductImage } = await import("./enhance-action");
    mockSingle.mockResolvedValue({ data: { id: "img-1", product_id: "p1", original_url: "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/products/p1/x.jpg" } });

    await enhanceProductImage("img-1", "make it pop");

    expect(mockRequirePermission).toHaveBeenCalledWith("productos");
  });

  it("fetches the original image when its URL is a real catalog-images object", async () => {
    const { enhanceProductImage } = await import("./enhance-action");
    const url = "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/products/p1/x.jpg";
    mockSingle.mockResolvedValue({ data: { id: "img-1", product_id: "p1", original_url: url } });

    await enhanceProductImage("img-1", "make it pop");

    expect(mockFetch).toHaveBeenCalledWith(url);
  });

  it("rejects an original_url pointing outside the catalog-images bucket (SSRF)", async () => {
    const { enhanceProductImage } = await import("./enhance-action");
    mockSingle.mockResolvedValue({
      data: { id: "img-1", product_id: "p1", original_url: "http://169.254.169.254/latest/meta-data/" },
    });

    await expect(enhanceProductImage("img-1", "make it pop")).rejects.toThrow("URL de imagen no válida.");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_SUPABASE_URL;
  });
});
