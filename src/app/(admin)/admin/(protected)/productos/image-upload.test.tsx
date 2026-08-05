import { describe, it, expect, vi } from "vitest";
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
const mockInsert = vi.fn().mockReturnValue({
  select: () => ({ single: () => Promise.resolve({ data: { id: "img-1" }, error: null }) }),
});
// handleUpload also calls supabase.from("product_images").update(...).eq(...)
// after the upload succeeds, to persist the public URL — without this, the
// insert-only mock leaves that call undefined and produces an unhandled
// promise rejection during the test run (Vitest still reports the assertions
// as passing, but flags it). Same pattern cover-upload.test.tsx (Task 6)
// uses for its update-only case.
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: { from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }) },
    from: () => ({ insert: mockInsert, update: () => ({ eq: mockUpdateEq }) }),
  }),
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

describe("ImageUpload", () => {
  it("uploads a new photo and shows it in the list", async () => {
    render(<ImageUpload productId="p-1" images={[]} />);
    const file = new File(["fake-bytes"], "foto.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir foto/i);

    await userEvent.upload(input, file);

    expect(mockUpload).toHaveBeenCalled();
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
});
