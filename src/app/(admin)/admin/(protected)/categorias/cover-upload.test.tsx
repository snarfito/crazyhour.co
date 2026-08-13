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
const mockGenerateCategoryCoverImage = vi.fn().mockResolvedValue(undefined);
vi.mock("./actions", () => ({
  setCategoryCoverImage: (...args: unknown[]) => mockSetCategoryCoverImage(...args),
  generateCategoryCoverImage: (...args: unknown[]) => mockGenerateCategoryCoverImage(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("CoverUpload", () => {
  it("uploads the selected file to the correct Storage path", async () => {
    render(<CoverUpload categoryId="cat-1" categoryName="Piñatas" currentUrl={null} />);
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
    render(<CoverUpload categoryId="cat-1" categoryName="Piñatas" currentUrl="https://example.com/cover.jpg" />);
    expect(screen.getByAltText(/portada actual/i)).toHaveAttribute(
      "src",
      "https://example.com/cover.jpg"
    );
  });

  it("persists the cover URL via the setCategoryCoverImage Server Action, not a direct client write", async () => {
    render(<CoverUpload categoryId="cat-1" categoryName="Piñatas" currentUrl={null} />);
    const file = new File(["fake-image-bytes"], "portada.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/subir portada/i);

    await userEvent.upload(input, file);

    expect(mockSetCategoryCoverImage).toHaveBeenCalledWith(
      "cat-1",
      "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/categories/cat-1/cover.jpg"
    );
  });

  it("prefills the AI prompt with the category name and generates a cover", async () => {
    render(<CoverUpload categoryId="cat-1" categoryName="Piñatas" currentUrl={null} />);

    await userEvent.click(screen.getByRole("button", { name: /generar portada con ia/i }));

    const textarea = screen.getByRole("textbox", { name: /prompt/i }) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Piñatas");

    await userEvent.click(screen.getByRole("button", { name: /^generar$/i }));

    expect(mockGenerateCategoryCoverImage).toHaveBeenCalledWith(
      "cat-1",
      expect.stringContaining("Piñatas")
    );
  });

  it("shows an error and keeps the panel open when generation fails", async () => {
    mockGenerateCategoryCoverImage.mockRejectedValueOnce(new Error("boom"));
    render(<CoverUpload categoryId="cat-1" categoryName="Piñatas" currentUrl={null} />);

    await userEvent.click(screen.getByRole("button", { name: /generar portada con ia/i }));
    await userEvent.click(screen.getByRole("button", { name: /^generar$/i }));

    expect(await screen.findByText(/no se pudo generar/i)).toBeInTheDocument();
  });
});
