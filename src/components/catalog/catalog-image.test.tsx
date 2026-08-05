import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogImage } from "./catalog-image";

describe("CatalogImage", () => {
  it("renders the real photo when src is provided", () => {
    render(
      <CatalogImage src="https://example.com/photo.jpg" alt="Piñata estrella" label="Piñata estrella" seed="p1" />
    );
    expect(screen.getByAltText("Piñata estrella")).toHaveAttribute(
      "src",
      expect.stringContaining("example.com")
    );
  });

  it("renders the brand placeholder when src is null", () => {
    render(<CatalogImage src={null} alt="Piñata estrella" label="Piñata estrella" seed="p1" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
  });
});
