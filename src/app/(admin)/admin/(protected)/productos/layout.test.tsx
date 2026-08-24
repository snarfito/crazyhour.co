import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockRequirePermission = vi.fn().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co" });
vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

describe("ProductosLayout", () => {
  it("renders children when the caller has the productos permission", async () => {
    const ProductosLayout = (await import("./layout")).default;
    const ui = await ProductosLayout({ children: <p>listado</p> });
    render(ui as React.ReactElement);

    expect(screen.getByText("listado")).toBeInTheDocument();
    expect(mockRequirePermission).toHaveBeenCalledWith("productos");
  });

  it("redirects when the caller lacks the productos permission", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const ProductosLayout = (await import("./layout")).default;

    await expect(ProductosLayout({ children: <p>listado</p> })).rejects.toThrow("REDIRECT:/admin/pedidos");
  });
});
