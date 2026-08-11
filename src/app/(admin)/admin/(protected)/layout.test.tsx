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
  it("renders the nav and the signed-in user's email when a session exists", async () => {
    mockVerifySession.mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co" });
    const ProtectedAdminLayout = (await import("./layout")).default;

    const ui = await ProtectedAdminLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByText("admin@crazyhour.co")).toBeInTheDocument();
    expect(screen.getByText("Categorías")).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Ajustes")).toBeInTheDocument();
    expect(screen.getByText("Animaciones")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
