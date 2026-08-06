import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryCard } from "./category-card";

describe("CategoryCard", () => {
  it("links to the category's URL and shows its name once, overlaid", () => {
    render(<CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={false} index={0} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pinatas");
    // CatalogImage (Task 3) now owns the name overlay — no separate caption
    // below the tile, so the name appears exactly once.
    expect(screen.getAllByText("Piñatas")).toHaveLength(1);
  });

  it("spans two grid columns when wide", () => {
    render(<CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={true} index={4} />);
    expect(screen.getByRole("link")).toHaveClass("col-span-2");
  });
});
