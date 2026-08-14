import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductEditorTable, type EditorProduct } from "./product-editor-table";

const mockUpdateProductField = vi.fn().mockResolvedValue(undefined);
const mockUpdateProductCategories = vi.fn().mockResolvedValue(undefined);
const mockCreateQuickProduct = vi.fn();

vi.mock("./actions", () => ({
  updateProductField: (...args: unknown[]) => mockUpdateProductField(...args),
  updateProductCategories: (...args: unknown[]) => mockUpdateProductCategories(...args),
  createQuickProduct: (...args: unknown[]) => mockCreateQuickProduct(...args),
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
  beforeEach(() => {
    mockUpdateProductField.mockReset().mockResolvedValue(undefined);
    mockUpdateProductCategories.mockReset().mockResolvedValue(undefined);
    mockCreateQuickProduct.mockReset();
  });

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

  it("surfaces a failed save as a global error banner even though the row survives", async () => {
    mockUpdateProductField.mockRejectedValueOnce(new Error("No se pudo guardar el cambio."));
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    const input = screen.getByDisplayValue("Piñata estrella");
    await user.type(input, " grande");
    await user.tab();

    const banner = await screen.findByTestId("global-error-banner");
    expect(banner).toHaveTextContent("No se pudo guardar el cambio.");
  });

  it("dismisses the global error banner when 'Cerrar' is clicked", async () => {
    mockUpdateProductField.mockRejectedValueOnce(new Error("No se pudo guardar el cambio."));
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    const input = screen.getByDisplayValue("Piñata estrella");
    await user.type(input, " grande");
    await user.tab();

    await user.click(await screen.findByRole("button", { name: "Cerrar" }));

    expect(screen.queryByTestId("global-error-banner")).not.toBeInTheDocument();
  });

  it("wires the 'Media paca (cant.)' column to pack2_qty on the correct row", async () => {
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    // Row order matches `products`: index 0 = p-1, index 1 = p-2 ("Globo metálico").
    const input = screen.getAllByLabelText("pack2_qty")[1];
    await user.clear(input);
    await user.type(input, "7");
    await user.tab();

    expect(mockUpdateProductField).toHaveBeenCalledWith("p-2", "pack2_qty", "7");
  });

  it("wires the 'Paca completa (cant.)' column to pack1_qty on the correct row", async () => {
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    const input = screen.getAllByLabelText("pack1_qty")[1];
    await user.clear(input);
    await user.type(input, "20");
    await user.tab();

    expect(mockUpdateProductField).toHaveBeenCalledWith("p-2", "pack1_qty", "20");
  });

  it("editing two different cells in the same row produces two separate calls with distinct field names", async () => {
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    const pack1QtyInput = screen.getAllByLabelText("pack1_qty")[1];
    const pack2QtyInput = screen.getAllByLabelText("pack2_qty")[1];

    await user.clear(pack1QtyInput);
    await user.type(pack1QtyInput, "20");
    await user.tab();

    await user.clear(pack2QtyInput);
    await user.type(pack2QtyInput, "7");
    await user.tab();

    expect(mockUpdateProductField).toHaveBeenCalledTimes(2);
    expect(mockUpdateProductField).toHaveBeenCalledWith("p-2", "pack1_qty", "20");
    expect(mockUpdateProductField).toHaveBeenCalledWith("p-2", "pack2_qty", "7");
  });

  it("clicking 'Agregar producto' inserts a new row at the top of the table", async () => {
    mockCreateQuickProduct.mockResolvedValueOnce({
      id: "p-new",
      name: "Producto nuevo",
      description: null,
      unit_price_cop: 0,
      pack1_qty: null,
      pack1_price_cop: null,
      pack2_qty: null,
      pack2_price_cop: null,
    });
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    await user.click(screen.getByRole("button", { name: /agregar producto/i }));

    expect(await screen.findByDisplayValue("Producto nuevo")).toBeInTheDocument();
    expect(mockCreateQuickProduct).toHaveBeenCalledTimes(1);
  });

  it("shows an error banner when creating a product fails, without adding a row", async () => {
    mockCreateQuickProduct.mockRejectedValueOnce(new Error("No se pudo crear el producto."));
    const user = userEvent.setup();
    render(<ProductEditorTable products={products} categories={categories} />);

    await user.click(screen.getByRole("button", { name: /agregar producto/i }));

    expect(await screen.findByTestId("global-error-banner")).toHaveTextContent("No se pudo crear el producto.");
    expect(screen.queryByDisplayValue("Producto nuevo")).not.toBeInTheDocument();
  });
});
