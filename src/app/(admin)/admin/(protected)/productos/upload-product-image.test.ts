import { describe, it, expect, vi, beforeEach } from "vitest";
import { recropProductImage } from "./upload-product-image";

const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/products/p-1/img-1-original.jpg" },
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: { from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }) },
  }),
}));

const mockSetProductImageUrl = vi.fn().mockResolvedValue(undefined);

vi.mock("./actions", () => ({
  createProductImagePlaceholder: vi.fn(),
  setProductImageUrl: (...args: unknown[]) => mockSetProductImageUrl(...args),
  deleteProductImage: vi.fn(),
}));

describe("recropProductImage", () => {
  beforeEach(() => {
    mockUpload.mockClear();
    mockSetProductImageUrl.mockClear();
  });

  it("uploads to a fresh path (not the previous one), so the new photo isn't stuck behind a stale CDN/Image-Optimization cache for the old URL", async () => {
    const file = new File(["cropped-bytes"], "recortada.jpg", { type: "image/jpeg" });

    await recropProductImage("p-1", "img-1", file);

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^products\/p-1\/img-1-original-\d+\.jpg$/),
      file,
      { upsert: true }
    );
    expect(mockUpload.mock.calls[0][0]).not.toBe("products/p-1/img-1-original.jpg");
    expect(mockSetProductImageUrl).toHaveBeenCalledWith(
      "img-1",
      expect.any(String),
      { clearEnhanced: true }
    );
  });

  it("throws a friendly error when the Storage upload fails", async () => {
    mockUpload.mockResolvedValueOnce({ error: { message: "Storage is down" } });
    const file = new File(["cropped-bytes"], "recortada.jpg", { type: "image/jpeg" });

    await expect(recropProductImage("p-1", "img-1", file)).rejects.toThrow(/no se pudo recortar/i);
    expect(mockSetProductImageUrl).not.toHaveBeenCalled();
  });
});
