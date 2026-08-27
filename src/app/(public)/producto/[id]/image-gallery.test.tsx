import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGallery } from "./image-gallery";

const MANY_IMAGES = Array.from({ length: 18 }, (_, i) => ({ url: `https://example.com/${i}.jpg`, alt: `Foto ${i}` }));

describe("ImageGallery", () => {
  it("shows the first image as the main image and a brand placeholder if there are none", () => {
    const { container } = render(<ImageGallery images={[]} productName="Piñata estrella" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows the first image as main and switches on thumbnail click", async () => {
    render(
      <ImageGallery
        images={[
          { url: "https://example.com/1.jpg", alt: "Foto 1" },
          { url: "https://example.com/2.jpg", alt: "Foto 2" },
        ]}
        productName="Piñata estrella"
      />
    );

    const main = screen.getByTestId("gallery-main-image");
    expect(main).toHaveAttribute("src", expect.stringContaining("example.com"));

    const thumbnails = screen.getAllByTestId("gallery-thumbnail");
    expect(thumbnails).toHaveLength(2);

    await userEvent.click(thumbnails[1]);

    expect(screen.getByTestId("gallery-main-image").getAttribute("src")).toContain("2.jpg");
  });

  it("visually marks which thumbnail is active — pressed state, ring, and a checkmark badge, none of it just a subtle border", async () => {
    render(
      <ImageGallery
        images={[
          { url: "https://example.com/1.jpg", alt: "Foto 1" },
          { url: "https://example.com/2.jpg", alt: "Foto 2" },
        ]}
        productName="Piñata estrella"
      />
    );
    const [first, second] = screen.getAllByTestId("gallery-thumbnail");

    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first.className).toContain("ring-primary");
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(second.className).not.toContain("ring-primary");
    expect(first.querySelector("svg")).toBeInTheDocument(); // checkmark badge
    expect(second.querySelector("svg")).not.toBeInTheDocument();

    await userEvent.click(second);

    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(second.querySelector("svg")).toBeInTheDocument();
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(first.querySelector("svg")).not.toBeInTheDocument();
  });

  describe("with a long strip (many colors)", () => {
    beforeEach(() => {
      vi.mocked(Element.prototype.scrollIntoView).mockClear();
    });

    it("never shrinks a thumbnail below its fixed size — the strip scrolls instead", () => {
      render(<ImageGallery images={MANY_IMAGES} productName="Globo metalizado cromado" />);

      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      expect(thumbnails).toHaveLength(18);
      thumbnails.forEach((t) => expect(t.className).toContain("shrink-0"));
      expect(thumbnails[0].parentElement?.className).toContain("overflow-x-auto");
    });

    it("centers the newly active thumbnail in the strip on click", async () => {
      render(<ImageGallery images={MANY_IMAGES} productName="Globo metalizado cromado" />);
      const thumbnails = screen.getAllByTestId("gallery-thumbnail");

      await userEvent.click(thumbnails[12]);

      expect(thumbnails[12].scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ inline: "center", behavior: "auto" })
      );
    });

    it("centers the thumbnail for the color picked externally (selectedUrl), not just manual clicks", () => {
      const { rerender } = render(<ImageGallery images={MANY_IMAGES} productName="Globo metalizado cromado" />);

      rerender(<ImageGallery images={MANY_IMAGES} productName="Globo metalizado cromado" selectedUrl={MANY_IMAGES[9].url} />);

      const thumbnails = screen.getAllByTestId("gallery-thumbnail");
      expect(thumbnails[9].scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ inline: "center" }));
    });
  });
});
