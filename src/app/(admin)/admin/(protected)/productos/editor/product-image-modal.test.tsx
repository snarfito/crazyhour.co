import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductImageModal } from "./product-image-modal";

// image-upload.tsx renders EnhanceButton, which imports enhance-action.ts,
// which transitively imports server-only modules — same fix needed here as
// in image-upload.test.tsx.
vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockImagesQuery = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: (...args: unknown[]) => mockImagesQuery(...args),
      }),
    }),
    storage: { from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn() }) },
  }),
}));

describe("ProductImageModal", () => {
  beforeEach(() => {
    mockImagesQuery.mockReset().mockResolvedValue({
      data: [{ id: "img-1", original_url: "https://example.com/a.jpg", enhanced_url: null }],
    });
  });

  it("fetches and shows the product's images when opened", async () => {
    const user = userEvent.setup();
    render(<ProductImageModal productId="p-1" productName="Piñata estrella" />);

    await user.click(screen.getByRole("button", { name: /editar imagen/i }));

    expect(await screen.findByText("Fotos de Piñata estrella")).toBeInTheDocument();
    expect(mockImagesQuery).toHaveBeenCalledWith("product_id", "p-1");
    expect(await screen.findByAltText(/foto original/i)).toBeInTheDocument();
  });

  it("does not fetch images before the modal is opened", () => {
    render(<ProductImageModal productId="p-1" productName="Piñata estrella" />);
    expect(mockImagesQuery).not.toHaveBeenCalled();
  });
});
