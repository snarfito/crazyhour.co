import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShapeImagesUpload } from "./shape-images-upload";

const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/event-shapes/carnaval/shape.png" },
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }),
    },
  }),
}));

const mockAdd = vi.fn().mockResolvedValue(undefined);
const mockRemove = vi.fn().mockResolvedValue(undefined);
vi.mock("./actions", () => ({
  addThemeShapeImageAction: (...args: unknown[]) => mockAdd(...args),
  removeThemeShapeImageAction: (...args: unknown[]) => mockRemove(...args),
}));

describe("ShapeImagesUpload", () => {
  it("uploads to the theme's storage path, saves via the Server Action, and reports the new list", async () => {
    const onChange = vi.fn();
    render(<ShapeImagesUpload theme="carnaval" urls={[]} onChange={onChange} />);
    const file = new File(["fake-image-bytes"], "estrella.png", { type: "image/png" });

    await userEvent.upload(screen.getByLabelText(/subir figura/i), file);

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^event-shapes\/carnaval\//),
      file,
      { upsert: true }
    );
    expect(mockAdd).toHaveBeenCalledWith(
      "carnaval",
      "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/event-shapes/carnaval/shape.png"
    );
    expect(onChange).toHaveBeenCalledWith([
      "https://pqyunubwmchftefnqgvi.supabase.co/storage/v1/object/public/catalog-images/event-shapes/carnaval/shape.png",
    ]);
  });

  it("shows a thumbnail per existing URL and removes one via the Server Action", async () => {
    const onChange = vi.fn();
    render(
      <ShapeImagesUpload
        theme="carnaval"
        urls={["https://example.com/a.png", "https://example.com/b.png"]}
        onChange={onChange}
      />
    );

    expect(screen.getAllByRole("img")).toHaveLength(2);

    await userEvent.click(screen.getAllByRole("button", { name: /quitar figura/i })[0]);

    expect(mockRemove).toHaveBeenCalledWith("carnaval", "https://example.com/a.png");
    expect(onChange).toHaveBeenCalledWith(["https://example.com/b.png"]);
  });
});
