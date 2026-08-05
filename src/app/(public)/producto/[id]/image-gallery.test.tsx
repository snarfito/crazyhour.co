import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGallery } from "./image-gallery";

describe("ImageGallery", () => {
  it("shows the first image as the main image and a brand placeholder if there are none", () => {
    render(<ImageGallery images={[]} productName="Piñata estrella" />);
    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
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
});
