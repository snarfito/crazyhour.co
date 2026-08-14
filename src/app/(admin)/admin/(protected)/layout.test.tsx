import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockVerifySession = vi.fn();

vi.mock("@/lib/supabase/dal", () => ({
  verifySession: () => mockVerifySession(),
}));

vi.mock("../login/actions", () => ({
  signOut: async () => {},
}));

const ALL_GRANTED = { pedidos: true, productos: true, categorias: true, ajustes: true, animaciones: true, usuarios: true };

describe("protected admin layout", () => {
  it("renders the full nav, 'Acceso completo', and the signed-in user's email when every permission is granted", async () => {
    mockVerifySession.mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co", permissions: ALL_GRANTED });
    const ProtectedAdminLayout = (await import("./layout")).default;

    const ui = await ProtectedAdminLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByText("admin@crazyhour.co")).toBeInTheDocument();
    expect(screen.getByText("Acceso completo")).toBeInTheDocument();
    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Ajustes")).toBeInTheDocument();
    expect(screen.getByText("Animaciones")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("shows only the granted sections and 'Acceso limitado' for a partial permission set", async () => {
    mockVerifySession.mockResolvedValue({
      userId: "u2",
      email: "limitado@crazyhour.co",
      permissions: { pedidos: true, productos: true, categorias: true, ajustes: false, animaciones: false, usuarios: false },
    });
    const ProtectedAdminLayout = (await import("./layout")).default;

    const ui = await ProtectedAdminLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByText("Acceso limitado")).toBeInTheDocument();
    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.queryByText("Ajustes")).not.toBeInTheDocument();
    expect(screen.queryByText("Animaciones")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
  });

  it("shows only Productos for an admin with a single permission", async () => {
    mockVerifySession.mockResolvedValue({
      userId: "u3",
      email: "soloproductos@crazyhour.co",
      permissions: { pedidos: false, productos: true, categorias: false, ajustes: false, animaciones: false, usuarios: false },
    });
    const ProtectedAdminLayout = (await import("./layout")).default;

    const ui = await ProtectedAdminLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.queryByText("Pedidos")).not.toBeInTheDocument();
    expect(screen.queryByText("Categorías")).not.toBeInTheDocument();
    expect(screen.queryByText("Ajustes")).not.toBeInTheDocument();
    expect(screen.queryByText("Animaciones")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
  });
});
