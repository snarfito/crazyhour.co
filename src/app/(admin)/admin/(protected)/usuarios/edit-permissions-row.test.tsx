import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUpdatePermissions = vi.fn();
vi.mock("./actions", () => ({
  updatePermissions: (...args: unknown[]) => mockUpdatePermissions(...args),
}));

const BASE_PERMISSIONS = {
  pedidos: true, productos: true, categorias: true,
  ajustes: false, animaciones: false, usuarios: false,
};

describe("EditPermissionsRow", () => {
  it("shows only a trigger button until clicked, then reveals checkboxes pre-filled with the current permissions", async () => {
    const { EditPermissionsRow } = await import("./edit-permissions-row");
    render(<EditPermissionsRow id="u1" permissions={BASE_PERMISSIONS} />);

    expect(screen.queryByLabelText("Ajustes")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /editar permisos/i }));

    expect(screen.getByLabelText("Pedidos")).toBeChecked();
    expect(screen.getByLabelText("Ajustes")).not.toBeChecked();
  });

  it("calls updatePermissions with the edited set on Guardar", async () => {
    mockUpdatePermissions.mockResolvedValue(undefined);
    const { EditPermissionsRow } = await import("./edit-permissions-row");
    render(<EditPermissionsRow id="u1" permissions={BASE_PERMISSIONS} />);

    await userEvent.click(screen.getByRole("button", { name: /editar permisos/i }));
    await userEvent.click(screen.getByLabelText("Ajustes"));
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(mockUpdatePermissions).toHaveBeenCalledWith("u1", { ...BASE_PERMISSIONS, ajustes: true });
  });

  it("shows the thrown error message and keeps the form open when updatePermissions rejects", async () => {
    mockUpdatePermissions.mockRejectedValue(new Error("Debe quedar al menos un administrador con acceso a Usuarios."));
    const { EditPermissionsRow } = await import("./edit-permissions-row");
    render(<EditPermissionsRow id="u1" permissions={BASE_PERMISSIONS} />);

    await userEvent.click(screen.getByRole("button", { name: /editar permisos/i }));
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(await screen.findByText("Debe quedar al menos un administrador con acceso a Usuarios.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
  });
});
