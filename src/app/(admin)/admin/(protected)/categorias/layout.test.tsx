import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// actions.ts (imported transitively via CategoriasListClient) imports
// "@/lib/supabase/dal", which imports "server-only" — throws when loaded
// outside a real Next.js server render (same fix as the animaciones layout test).
vi.mock("server-only", () => ({}));

const mockRequirePermission = vi.fn().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co" });
vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

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

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/categorias",
  useRouter: () => ({ push: mockPush }),
}));

describe("CategoriasLayout", () => {
  it("lists every category, each row navigating to its own editor, alongside the children pane", async () => {
    const CategoriasLayout = (await import("./layout")).default;
    const ui = await CategoriasLayout({ children: <p>editor</p> });
    render(ui);

    expect(screen.getByText("Piñatas")).toBeInTheDocument();
    expect(screen.getByText("Globos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva/ })).toHaveAttribute("href", "/admin/categorias/nueva");
    expect(screen.getByText("editor")).toBeInTheDocument();
  });

  it("redirects when the caller lacks the categorias permission", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const CategoriasLayout = (await import("./layout")).default;

    await expect(CategoriasLayout({ children: <p>editor</p> })).rejects.toThrow("REDIRECT:/admin/pedidos");
    expect(mockRequirePermission).toHaveBeenCalledWith("categorias");
  });
});
