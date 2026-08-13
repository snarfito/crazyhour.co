import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockInviteAdmin = vi.fn();
vi.mock("./actions", () => ({
  inviteAdmin: (...args: unknown[]) => mockInviteAdmin(...args),
}));

describe("InviteAdminForm", () => {
  it("defaults the role select to limited", async () => {
    const { InviteAdminForm } = await import("./invite-admin-form");
    render(<InviteAdminForm />);

    expect(screen.getByLabelText(/rol/i)).toHaveValue("limited");
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
