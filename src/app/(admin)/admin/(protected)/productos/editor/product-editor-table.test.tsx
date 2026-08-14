import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductEditorTable, type EditorProduct } from "./product-editor-table";

vi.mock("./actions", () => ({
  updateProductField: vi.fn().mockResolvedValue(undefined),
  updateProductCategories: vi.fn().mockResolvedValue(undefined),
}));

const categories = [{ id: "cat-a", name: "Piñatas" }];

const products: EditorProduct[] = [
  {
    id: "p-1",
    name: "Piñata estrella",
    description: "grande",
    unit_price_cop: 20000,
    pack1_qty: null,
    pack1_price_cop: null,
    pack2_qty: null,
    pack2_price_cop: null,
    category_ids: ["cat-a"],
  },
  {
    id: "p-2",
    name: "Globo metálico",
    description: "24 pulgadas",
    unit_price_cop: 5000,
    pack1_qty: 10,
    pack1_price_cop: 4000,
    pack2_qty: 5,
    pack2_price_cop: 4500,
    category_ids: [],
  },
];

describe("ProductEditorTable", () => {
  it("renders every product's name", () => {
    render(<ProductEditorTable products={products} categories={categories} />);
    expect(screen.getByDisplayValue("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Globo metálico")).toBeInTheDocument();
  });

  it("filters the list live as the search box changes", async () => {
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    await user.type(screen.getByLabelText("Buscar producto"), "globo");

    expect(screen.queryByDisplayValue("Piñata estrella")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Globo metálico")).toBeInTheDocument();
  });

  it("filtering is case-insensitive", async () => {
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    await user.type(screen.getByLabelText("Buscar producto"), "PIÑATA");

    expect(screen.getByDisplayValue("Piñata estrella")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Globo metálico")).not.toBeInTheDocument();
  });

  it("shows an empty state when no product matches", async () => {
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    await user.type(screen.getByLabelText("Buscar producto"), "no existe");

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });
});
