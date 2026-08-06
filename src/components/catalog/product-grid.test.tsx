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
    // Each product name appears once in the card text; placeholders are now purely decorative (text moved to CatalogImage overlay in Task 3)
    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByText("Set de globos")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
