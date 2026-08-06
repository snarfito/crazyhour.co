import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";

describe("ProductCard", () => {
  it("links to the product page, shows the name once and the formatted price", () => {
    render(
      <ProductCard id="p1" name="Piñata estrella" priceCop={45000} imageUrl={null} isNew={false} index={0} />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/producto/p1");
    // CatalogImage (Task 3) owns the name overlay — no separate caption.
    expect(screen.getAllByText("Piñata estrella")).toHaveLength(1);
    expect(screen.getByText("$ 45.000")).toBeInTheDocument();
  });

  it("shows a nuevo badge only when isNew is true", () => {
    const { rerender } = render(
      <ProductCard id="p1" name="Piñata estrella" priceCop={45000} imageUrl={null} isNew={false} index={0} />
    );
    expect(screen.queryByText("¡nuevo!")).not.toBeInTheDocument();

    rerender(
      <ProductCard id="p1" name="Piñata estrella" priceCop={45000} imageUrl={null} isNew={true} index={0} />
    );
    expect(screen.getByText("¡nuevo!")).toBeInTheDocument();
  });
});
