import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryProductsFilter } from "./category-products-filter";

const PRODUCTS = [
  { id: "p1", name: "Piñata vieja", price_cop: 20000, imageUrl: null, isNew: false },
  { id: "p2", name: "Piñata nueva", price_cop: 25000, imageUrl: null, isNew: true },
];

describe("CategoryProductsFilter", () => {
  it("shows all products by default", () => {
    render(<CategoryProductsFilter products={PRODUCTS} />);
    expect(screen.getByText("Piñata vieja")).toBeInTheDocument();
    expect(screen.getByText("Piñata nueva")).toBeInTheDocument();
  });

  it("filters to only new products when 'Nuevo' is selected", async () => {
    const user = userEvent.setup();
    render(<CategoryProductsFilter products={PRODUCTS} />);

    await user.click(screen.getByRole("radio", { name: "Nuevo" }));

    expect(screen.queryByText("Piñata vieja")).not.toBeInTheDocument();
    expect(screen.getByText("Piñata nueva")).toBeInTheDocument();
  });

  it("shows a message instead of an empty grid when no product matches the filter", async () => {
    const user = userEvent.setup();
    render(<CategoryProductsFilter products={[PRODUCTS[0]]} />);

    await user.click(screen.getByRole("radio", { name: "Nuevo" }));

    expect(screen.getByText(/no hay productos nuevos/i)).toBeInTheDocument();
  });

  it("filters products by name within the category as the user types", async () => {
    const user = userEvent.setup();
    render(<CategoryProductsFilter products={PRODUCTS} />);

    await user.type(screen.getByLabelText("Buscar en esta categoría"), "vieja");

    expect(screen.getByText("Piñata vieja")).toBeInTheDocument();
    expect(screen.queryByText("Piñata nueva")).not.toBeInTheDocument();
  });

  it("combines the text search with the Nuevo tab", async () => {
    const user = userEvent.setup();
    render(<CategoryProductsFilter products={PRODUCTS} />);

    await user.click(screen.getByRole("radio", { name: "Nuevo" }));
    await user.type(screen.getByLabelText("Buscar en esta categoría"), "vieja");

    expect(screen.getByText(/no hay productos que coincidan/i)).toBeInTheDocument();
  });
});
