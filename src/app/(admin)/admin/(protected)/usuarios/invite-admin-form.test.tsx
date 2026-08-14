import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockInviteAdmin = vi.fn();
vi.mock("./actions", () => ({
  inviteAdmin: (...args: unknown[]) => mockInviteAdmin(...args),
}));

describe("InviteAdminForm", () => {
  it("defaults to pedidos/productos/categorias checked, the rest unchecked", async () => {
    const { InviteAdminForm } = await import("./invite-admin-form");
    render(<InviteAdminForm />);

    expect(screen.getByLabelText("Pedidos")).toBeChecked();
    expect(screen.getByLabelText("Productos")).toBeChecked();
    expect(screen.getByLabelText("Categorías")).toBeChecked();
    expect(screen.getByLabelText("Ajustes")).not.toBeChecked();
    expect(screen.getByLabelText("Animaciones")).not.toBeChecked();
    expect(screen.getByLabelText("Usuarios")).not.toBeChecked();
  });

  it("shows the error message returned by inviteAdmin", async () => {
    mockInviteAdmin.mockResolvedValue({ error: "Este correo ya tiene acceso al panel." });
    const { InviteAdminForm } = await import("./invite-admin-form");
    render(<InviteAdminForm />);

    await userEvent.type(screen.getByLabelText(/correo/i), "ya@crazyhour.co");
    await userEvent.click(screen.getByRole("button", { name: /invitar/i }));

    expect(await screen.findByText("Este correo ya tiene acceso al panel.")).toBeInTheDocument();
  });
});
