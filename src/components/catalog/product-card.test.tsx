import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";

describe("ProductCard", () => {
  it("links to the product page and shows name and formatted price", () => {
    render(<ProductCard id="p1" name="Piñata estrella" priceCop={45000} imageUrl={null} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/producto/p1");
    // The name appears once in the card text; the placeholder is now purely decorative (text moved to CatalogImage overlay in Task 3)
    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByText("$ 45.000")).toBeInTheDocument();
  });
});
