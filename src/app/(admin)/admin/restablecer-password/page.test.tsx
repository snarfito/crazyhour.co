import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const mockGetSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}));

vi.mock("./actions", () => ({
  updatePassword: vi.fn(),
}));

describe("RestablecerPasswordPage", () => {
  it("shows the password form once the link resolves into a session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
    const RestablecerPasswordPage = (await import("./page")).default;
    render(<RestablecerPasswordPage />);

    await waitFor(() => expect(screen.getByLabelText(/nueva contraseña/i)).not.toBeDisabled);
    expect(screen.getByRole("button", { name: /guardar contraseña/i })).toBeEnabled();
  });

  it("shows an expired-link message when there is no session to recover", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const RestablecerPasswordPage = (await import("./page")).default;
    render(<RestablecerPasswordPage />);

    await waitFor(() => expect(screen.getByText(/ya no es válido o expiró/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /solicitar uno nuevo/i })).toHaveAttribute(
      "href",
      "/admin/olvide-password"
    );
  });
});
