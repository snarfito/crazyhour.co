import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "./product-grid";

describe("ProductGrid", () => {
  it("renders one card per product, each name shown once", () => {
    render(
      <ProductGrid
        products={[
          { id: "p1", name: "Piñata estrella", price_cop: 45000, imageUrl: null, isNew: false },
          { id: "p2", name: "Set de globos", price_cop: 22000, imageUrl: null, isNew: true },
        ]}
      />
    );
    expect(screen.getAllByText("Piñata estrella")).toHaveLength(1);
    expect(screen.getAllByText("Set de globos")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("¡nuevo!")).toBeInTheDocument();
  });
});
