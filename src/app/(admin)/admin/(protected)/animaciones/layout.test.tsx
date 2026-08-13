import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockRequireFullAdmin = vi.fn().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co", role: "full" });
vi.mock("@/lib/supabase/dal", () => ({
  requireFullAdmin: () => mockRequireFullAdmin(),
}));

describe("AnimacionesLayout", () => {
  it("lists all 12 themes, each linking to its own editor, alongside the children pane", async () => {
    const AnimacionesLayout = (await import("./layout")).default;
    const ui = await AnimacionesLayout({ children: <p>editor</p> });
    render(ui);

    expect(screen.getByRole("link", { name: "Navidad" })).toHaveAttribute("href", "/admin/animaciones/navidad");
    expect(screen.getByRole("link", { name: "Carnaval" })).toHaveAttribute("href", "/admin/animaciones/carnaval");
    expect(screen.getAllByRole("link")).toHaveLength(12);
    expect(screen.getByText("editor")).toBeInTheDocument();
  });

  it("redirects non-full admins away", async () => {
    mockRequireFullAdmin.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const AnimacionesLayout = (await import("./layout")).default;

    await expect(AnimacionesLayout({ children: <p>editor</p> })).rejects.toThrow("REDIRECT:/admin/pedidos");
  });
});
