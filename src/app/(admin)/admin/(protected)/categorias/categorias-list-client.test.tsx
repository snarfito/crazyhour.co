import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoriasListClient } from "./categorias-list-client";

vi.mock("./actions", () => ({
  reorderCategories: vi.fn(),
  deleteCategory: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/categorias",
  useRouter: () => ({ push: mockPush }),
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

  it("navigates to the category's editor when a row is clicked", async () => {
    mockPush.mockClear();
    render(<CategoriasListClient categories={CATEGORIES} />);

    const rows = screen.getAllByRole("row").slice(1);
    await userEvent.click(rows[1]);

    expect(mockPush).toHaveBeenCalledWith("/admin/categorias/2");
  });

  it("does not navigate when the delete button inside a row is clicked", async () => {
    mockPush.mockClear();
    render(<CategoriasListClient categories={CATEGORIES} />);

    await userEvent.click(screen.getAllByRole("button", { name: /eliminar/i })[0]);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
