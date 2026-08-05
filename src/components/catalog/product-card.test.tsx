import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";

describe("ProductCard", () => {
  it("links to the product page and shows name and formatted price", () => {
    render(<ProductCard id="p1" name="Piñata estrella" priceCop={45000} imageUrl={null} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/producto/p1");
    // When there's no cover image, the name appears twice: in the placeholder label and in the paragraph below
    expect(screen.getAllByText("Piñata estrella")).toHaveLength(2);
    expect(screen.getByText("$ 45.000")).toBeInTheDocument();
  });
});
