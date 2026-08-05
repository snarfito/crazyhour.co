import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverUpload } from "./cover-upload";

const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/categories/cat-1/cover.jpg" },
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }),
    },
  }),
}));

const mockSetCategoryCoverImage = vi.fn().mockResolvedValue(undefined);
vi.mock("./actions", () => ({
  setCategoryCoverImage: (...args: unknown[]) => mockSetCategoryCoverImage(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("CoverUpload", () => {
  it("uploads the selected file to the correct Storage path", async () => {
    render(<CoverUpload categoryId="cat-1" currentUrl={null} />);
    const file = new File(["fake-image-bytes"], "portada.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir portada/i);

    await userEvent.upload(input, file);

    expect(mockUpload).toHaveBeenCalledWith(
      "categories/cat-1/cover.jpg",
      file,
      { upsert: true }
    );
  });

  it("shows the current cover image when one exists", () => {
    render(<CoverUpload categoryId="cat-1" currentUrl="https://example.com/cover.jpg" />);
    expect(screen.getByAltText(/portada actual/i)).toHaveAttribute(
      "src",
      "https://example.com/cover.jpg"
    );
  });

  it("persists the cover URL via the setCategoryCoverImage Server Action, not a direct client write", async () => {
    render(<CoverUpload categoryId="cat-1" currentUrl={null} />);
    const file = new File(["fake-image-bytes"], "portada.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir portada/i);

    await userEvent.upload(input, file);

    expect(mockSetCategoryCoverImage).toHaveBeenCalledWith(
      "cat-1",
      "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/categories/cat-1/cover.jpg"
    );
  });
});
