import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// actions.ts (imported transitively via CategoriasListClient) imports
// "@/lib/supabase/dal", which imports "server-only" — throws when loaded
// outside a real Next.js server render (same fix as the animaciones layout test).
vi.mock("server-only", () => ({}));

const mockCategories = [
  { id: "1", name: "Piñatas", slug: "pinatas", sort_order: 0 },
  { id: "2", name: "Globos", slug: "globos", sort_order: 1 },
];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: mockCategories }),
      }),
    }),
  }),
}));

describe("CategoriasLayout", () => {
  it("lists every category, each linking to its own editor, alongside the children pane", async () => {
    const CategoriasLayout = (await import("./layout")).default;
    const ui = await CategoriasLayout({ children: <p>editor</p> });
    render(ui);

    expect(screen.getByText("Piñatas")).toBeInTheDocument();
    expect(screen.getByText("Globos")).toBeInTheDocument();
    const editLinks = screen.getAllByRole("link", { name: /Editar/ }).map((l) => l.getAttribute("href"));
    expect(editLinks).toEqual(["/admin/categorias/1", "/admin/categorias/2"]);
    expect(screen.getByRole("link", { name: /Nueva/ })).toHaveAttribute("href", "/admin/categorias/nueva");
    expect(screen.getByText("editor")).toBeInTheDocument();
  });
});
