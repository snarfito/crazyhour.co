import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockRequireFullAdmin = vi.fn().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co", role: "full" });
vi.mock("@/lib/supabase/dal", () => ({
  requireFullAdmin: () => mockRequireFullAdmin(),
}));

describe("AnimacionesPage", () => {
  it("lists all 12 themes, each linking to its own editor", async () => {
    const AnimacionesPage = (await import("./page")).default;
    render(await AnimacionesPage());

    expect(screen.getByRole("link", { name: "Navidad" })).toHaveAttribute("href", "/admin/animaciones/navidad");
    expect(screen.getByRole("link", { name: "Carnaval" })).toHaveAttribute("href", "/admin/animaciones/carnaval");
    expect(screen.getAllByRole("link")).toHaveLength(12);
  });

  it("redirects non-full admins away", async () => {
    mockRequireFullAdmin.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const AnimacionesPage = (await import("./page")).default;

    await expect(AnimacionesPage()).rejects.toThrow("REDIRECT:/admin/pedidos");
  });
});
