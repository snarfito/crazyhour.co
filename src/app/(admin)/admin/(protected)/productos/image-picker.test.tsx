import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImagePicker } from "./image-picker";

const IMAGES = [
  { id: "img-1", url: "https://example.com/1.jpg" },
  { id: "img-2", url: "https://example.com/2.jpg" },
];

describe("ImagePicker", () => {
  it("renders nothing when the product has no images", () => {
    const { container } = render(<ImagePicker images={[]} value="" onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("marks 'sin foto' as pressed when value is empty", () => {
    render(<ImagePicker images={IMAGES} value="" onChange={vi.fn()} />);
    expect(screen.getByTitle("Sin foto propia")).toHaveAttribute("aria-pressed", "true");
  });

  it("marks the matching thumbnail as pressed", () => {
    render(<ImagePicker images={IMAGES} value="img-2" onChange={vi.fn()} />);
    const thumbnails = screen.getAllByTitle("Usar esta foto");
    expect(thumbnails[0]).toHaveAttribute("aria-pressed", "false");
    expect(thumbnails[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange with the image id when a thumbnail is clicked, and empty string for 'sin foto'", async () => {
    const onChange = vi.fn();
    render(<ImagePicker images={IMAGES} value="img-1" onChange={onChange} />);

    await userEvent.click(screen.getAllByTitle("Usar esta foto")[1]);
    expect(onChange).toHaveBeenCalledWith("img-2");

    await userEvent.click(screen.getByTitle("Sin foto propia"));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
