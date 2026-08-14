import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockProduct = {
  id: "prod-1",
  name: "Piñata estrella",
  description: "Piñata artesanal",
  unit_price_cop: 45000,
  pack1_qty: 10,
  pack1_price_cop: 38000,
  pack2_qty: 5,
  pack2_price_cop: 41000,
  sku: "PIN-001",
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      if (table === "products") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockProduct }) }) }) };
      }
      if (table === "categories") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  { id: "cat-a", name: "Piñatas" },
                  { id: "cat-b", name: "Globos" },
                ],
              }),
          }),
        };
      }
      if (table === "product_categories") {
        return { select: () => ({ eq: () => Promise.resolve({ data: [{ category_id: "cat-b" }] }) }) };
      }
      return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) };
    },
  }),
}));

vi.mock("../actions", () => ({
  updateProduct: vi.fn(),
}));

vi.mock("../image-upload", () => ({
  ImageUpload: () => null,
}));

describe("EditarProductoPage", () => {
  it("pre-checks the product's linked categories and pre-fills all price fields", async () => {
    const EditarProductoPage = (await import("./page")).default;
    const ui = await EditarProductoPage({ params: Promise.resolve({ id: "prod-1" }) });
    render(ui);

    expect(screen.getByLabelText("Globos")).toBeChecked();
    expect(screen.getByLabelText("Piñatas")).not.toBeChecked();
    expect(screen.getByLabelText(/precio por unidad/i)).toHaveValue(45000);
    expect(screen.getByLabelText(/paca completa — cantidad/i)).toHaveValue(10);
    expect(screen.getByLabelText(/paca completa — precio/i)).toHaveValue(38000);
    expect(screen.getByLabelText(/media paca — cantidad/i)).toHaveValue(5);
    expect(screen.getByLabelText(/media paca — precio/i)).toHaveValue(41000);
  });
});
