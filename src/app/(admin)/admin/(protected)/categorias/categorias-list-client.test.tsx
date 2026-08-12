import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoriasListClient, reorderOnDrop } from "./categorias-list-client";

vi.mock("./actions", () => ({
  reorderCategories: vi.fn(),
  deleteCategory: vi.fn(),
}));

const CATEGORIES = [
  { id: "1", name: "Piñatas", slug: "pinatas", sort_order: 0 },
  { id: "2", name: "Globos", slug: "globos", sort_order: 1 },
  { id: "3", name: "Decoración", slug: "decoracion", sort_order: 2 },
];

describe("CategoriasListClient", () => {
  it("renders every category in the order given", () => {
    render(<CategoriasListClient categories={CATEGORIES} />);

    const rows = screen.getAllByRole("row").slice(1); // skip the header row
    expect(rows[0]).toHaveTextContent("Piñatas");
    expect(rows[1]).toHaveTextContent("Globos");
    expect(rows[2]).toHaveTextContent("Decoración");
  });
});

describe("reorderOnDrop", () => {
  it("calls reorderCategories with the new id order and returns the reordered list", async () => {
    const { reorderCategories } = await import("./actions");

    const result = await reorderOnDrop(CATEGORIES, "1", "3");

    expect(reorderCategories).toHaveBeenCalledWith(["2", "3", "1"]);
    expect(result.map((c) => c.id)).toEqual(["2", "3", "1"]);
  });
});
