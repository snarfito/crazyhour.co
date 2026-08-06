import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "./product-grid";

describe("ProductGrid", () => {
  it("renders one card per product", () => {
    render(
      <ProductGrid
        products={[
          { id: "p1", name: "Piñata estrella", price_cop: 45000, imageUrl: null },
          { id: "p2", name: "Set de globos", price_cop: 22000, imageUrl: null },
        ]}
      />
    );
    // Product names appear in both the overlay (via CatalogImage) and card text below
    expect(screen.getAllByText("Piñata estrella").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Set de globos").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
