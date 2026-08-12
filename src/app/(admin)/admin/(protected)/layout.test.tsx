import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockVerifySession = vi.fn();

vi.mock("@/lib/supabase/dal", () => ({
  verifySession: () => mockVerifySession(),
}));

vi.mock("../login/actions", () => ({
  signOut: async () => {},
}));

describe("protected admin layout", () => {
  it("renders the full nav and the signed-in user's email for a full admin", async () => {
    mockVerifySession.mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co", role: "full" });
    const ProtectedAdminLayout = (await import("./layout")).default;

    const ui = await ProtectedAdminLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByText("admin@crazyhour.co")).toBeInTheDocument();
    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Ajustes")).toBeInTheDocument();
    expect(screen.getByText("Animaciones")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("hides Ajustes, Animaciones, and Usuarios for a limited admin", async () => {
    mockVerifySession.mockResolvedValue({ userId: "u2", email: "limitado@crazyhour.co", role: "limited" });
    const ProtectedAdminLayout = (await import("./layout")).default;

    const ui = await ProtectedAdminLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.queryByText("Ajustes")).not.toBeInTheDocument();
    expect(screen.queryByText("Animaciones")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
  });
});
