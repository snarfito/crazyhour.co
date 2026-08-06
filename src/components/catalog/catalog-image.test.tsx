import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogImage } from "./catalog-image";

describe("CatalogImage", () => {
  it("renders the real photo and overlays the label as visible text", () => {
    render(<CatalogImage src="https://example.com/photo.jpg" seed="p1" label="Piñata estrella" />);
    const img = screen.getByAltText("");
    expect(img).toHaveAttribute("src", expect.stringContaining("example.com"));
    // The photo itself is decorative (alt="") — the overlay text is the
    // single accessible name for the card, avoiding a doubled announcement.
    expect(img).toHaveAttribute("alt", "");
    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
  });

  it("renders the brand placeholder and overlays the label when src is null", () => {
    render(<CatalogImage src={null} seed="p1" label="Piñata estrella" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
  });
});
