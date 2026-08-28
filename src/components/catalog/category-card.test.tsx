import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryCard } from "./category-card";

describe("CategoryCard", () => {
  it("links to the category's URL and shows its name once, overlaid", () => {
    render(
      <CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={false} index={0} productCount={12} />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pinatas");
    // CatalogImage (Task 3 of the Fase 2 refresh) owns the name overlay — no
    // separate caption below the tile, so the name appears exactly once.
    expect(screen.getAllByText("Piñatas")).toHaveLength(1);
  });

  it("spans two grid columns when wide", () => {
    render(
      <CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={true} index={4} productCount={12} />
    );
    expect(screen.getByRole("link")).toHaveClass("col-span-2");
  });

  it("shows a 1-indexed position badge and the product count", () => {
    render(
      <CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={false} index={2} productCount={7} />
    );
    expect(screen.getByText("Nº 03")).toBeInTheDocument();
    expect(screen.getByText("7 productos")).toBeInTheDocument();
  });

  it("uses singular 'producto' for a count of exactly 1", () => {
    render(
      <CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={false} index={0} productCount={1} />
    );
    expect(screen.getByText("1 producto")).toBeInTheDocument();
  });

  it("alternates the Nº badge between pink and green by index parity", () => {
    const { rerender } = render(
      <CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={false} index={0} productCount={1} />
    );
    expect(screen.getByText("Nº 01")).toHaveClass("bg-brand-pink");

    rerender(
      <CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} wide={false} index={1} productCount={1} />
    );
    expect(screen.getByText("Nº 02")).toHaveClass("bg-brand-green");
  });
});
