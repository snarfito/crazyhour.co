import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryGrid } from "./category-grid";

describe("CategoryGrid", () => {
  it("renders one card per category", () => {
    render(
      <CategoryGrid
        categories={[
          { id: "c1", name: "Piñatas", slug: "pinatas", cover_image_url: null },
          { id: "c2", name: "Globos", slug: "globos", cover_image_url: null },
        ]}
      />
    );
    // Names appear in both the overlay (via CatalogImage) and card text below
    expect(screen.getAllByText("Piñatas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Globos").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
