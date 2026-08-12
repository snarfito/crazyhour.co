import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedProducts } from "./related-products";

describe("RelatedProducts", () => {
  it("renders a heading and the given products", () => {
    render(
      <RelatedProducts
        products={[{ id: "p1", name: "Telaraña", price_cop: 12900, imageUrl: null, isNew: false }]}
      />
    );

    expect(screen.getByRole("heading", { name: /también te puede servir/i })).toBeInTheDocument();
    expect(screen.getByText("Telaraña")).toBeInTheDocument();
  });

  it("renders nothing when there are no related products", () => {
    const { container } = render(<RelatedProducts products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
