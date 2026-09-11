import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUpload } from "./image-upload";

// ImageUpload renders EnhanceButton, which imports enhance-action.ts, which
// transitively imports server-only modules (dal.ts, gemini/enhance.ts).
// Vitest doesn't apply Next's "use server" RSC boundary transform, so those
// modules get evaluated for real here; "server-only" throws outside a Next
// server render unless mocked. Same fix as dal.test.ts / gemini/enhance.test.ts.
vi.mock("server-only", () => ({}));

const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/products/p-1/img-1-original.jpg" },
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: { from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }) },
  }),
}));

// The DB writes (insert placeholder / persist URL / delete on failure) now
// go through Server Actions instead of direct browser-side Supabase calls
// (Fix 3: the orphaned-row bug — a failed Storage upload used to leave a
// permanent unrenderable product_images row behind).
const mockCreateProductImagePlaceholder = vi.fn().mockResolvedValue({ id: "img-1" });
const mockSetProductImageUrl = vi.fn().mockResolvedValue(undefined);
const mockDeleteProductImage = vi.fn().mockResolvedValue(undefined);

vi.mock("./actions", () => ({
  createProductImagePlaceholder: (...args: unknown[]) => mockCreateProductImagePlaceholder(...args),
  setProductImageUrl: (...args: unknown[]) => mockSetProductImageUrl(...args),
  deleteProductImage: (...args: unknown[]) => mockDeleteProductImage(...args),
}));

// Same pattern as categorias/cover-upload.test.tsx: ImageUpload calls
// router.refresh() after a successful upload, and useRouter() throws
// "invariant expected app router to be mounted" outside a real Next router
// context.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// A real crop UI (drag/zoom canvas via react-easy-crop) can't run in jsdom.
// The modal's own logic (crop math, canvas->File) is covered by
// crop-image.test.ts; here we stub it down to its two outcomes so we can
// test how ImageUpload reacts to each.
vi.mock("./crop-modal", () => ({
  CropModal: ({ onCropped, onCancel }: { onCropped: (file: File) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onCropped(new File(["cropped-bytes"], "recortada.jpg", { type: "image/jpeg" }))}>
        Confirmar recorte
      </button>
      <button onClick={onCancel}>Cancelar recorte</button>
    </div>
  ),
}));

describe("ImageUpload", () => {
  beforeEach(() => {
    mockUpload.mockReset().mockResolvedValue({ error: null });
    mockCreateProductImagePlaceholder.mockReset().mockResolvedValue({ id: "img-1" });
    mockSetProductImageUrl.mockReset().mockResolvedValue(undefined);
    mockDeleteProductImage.mockReset().mockResolvedValue(undefined);
    // jsdom doesn't implement these; patch only the two static methods so
    // `URL` stays the real constructor everywhere else (vi.stubGlobal("URL", ...)
    // replaced the whole constructor and broke `new URL(...)` in every other
    // test file sharing this worker).
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
  });

  it("opens a crop step before uploading, and only uploads once the crop is confirmed", async () => {
    render(<ImageUpload productId="p-1" images={[]} />);
    const file = new File(["fake-bytes"], "foto.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir foto/i);

    await userEvent.upload(input, file);
    expect(mockUpload).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText(/confirmar recorte/i));

    expect(mockUpload).toHaveBeenCalled();
  });

  it("does not upload when the crop step is cancelled", async () => {
    render(<ImageUpload productId="p-1" images={[]} />);
    const file = new File(["fake-bytes"], "foto.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir foto/i);

    await userEvent.upload(input, file);
    await userEvent.click(screen.getByText(/cancelar recorte/i));

    expect(mockUpload).not.toHaveBeenCalled();
    expect(screen.queryByText(/confirmar recorte/i)).not.toBeInTheDocument();
  });

  it("re-crops an existing photo in place and clears its stale enhanced version", async () => {
    render(
      <ImageUpload
        productId="p-1"
        images={[
          {
            id: "img-1",
            original_url: "https://example.com/products/p-1/img-1-original.jpg",
            enhanced_url: "https://example.com/products/p-1/img-1-enhanced.png",
          },
        ]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /recortar/i }));
    await userEvent.click(screen.getByText(/confirmar recorte/i));

    expect(mockUpload).toHaveBeenCalled();
    expect(mockSetProductImageUrl).toHaveBeenCalledWith(
      "img-1",
      expect.any(String),
      expect.objectContaining({ clearEnhanced: true })
    );
    // Re-cropping an existing photo reuses its row — no new placeholder row created.
    expect(mockCreateProductImagePlaceholder).not.toHaveBeenCalled();
  });

  it("renders existing images with a 'Mejorar imagen' action each", () => {
    render(
      <ImageUpload
        productId="p-1"
        images={[{ id: "img-1", original_url: "https://example.com/a.jpg", enhanced_url: null }]}
      />
    );
    expect(screen.getByAltText(/foto original/i)).toBeInTheDocument();
    expect(screen.getByText(/mejorar imagen/i)).toBeInTheDocument();
  });

  it("shows the enhanced version alongside the original when it exists", () => {
    render(
      <ImageUpload
        productId="p-1"
        images={[
          {
            id: "img-1",
            original_url: "https://example.com/a.jpg",
            enhanced_url: "https://example.com/a-enhanced.png",
          },
        ]}
      />
    );
    expect(screen.getByAltText(/foto mejorada/i)).toHaveAttribute(
      "src",
      "https://example.com/a-enhanced.png"
    );
  });

  it("deletes the placeholder row when the Storage upload fails", async () => {
    mockUpload.mockResolvedValue({ error: { message: "Storage is down" } });

    render(<ImageUpload productId="p-1" images={[]} />);
    const file = new File(["fake-bytes"], "foto.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir foto/i);

    await userEvent.upload(input, file);
    await userEvent.click(screen.getByText(/confirmar recorte/i));

    expect(mockCreateProductImagePlaceholder).toHaveBeenCalledWith("p-1");
    expect(mockDeleteProductImage).toHaveBeenCalledWith("img-1");
    expect(mockSetProductImageUrl).not.toHaveBeenCalled();
    expect(await screen.findByText(/no se pudo subir la imagen/i)).toBeInTheDocument();
  });

  it("deletes an image after confirming, so unwanted photos stop showing on the site", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <ImageUpload
        productId="p-1"
        images={[{ id: "img-1", original_url: "https://example.com/a.jpg", enhanced_url: null }]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(mockDeleteProductImage).toHaveBeenCalledWith("img-1");
  });

  it("keeps the image when deletion is not confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <ImageUpload
        productId="p-1"
        images={[{ id: "img-1", original_url: "https://example.com/a.jpg", enhanced_url: null }]}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(mockDeleteProductImage).not.toHaveBeenCalled();
  });
});
