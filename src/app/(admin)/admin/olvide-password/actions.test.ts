import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  }),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (key: string) => (key === "host" ? "crazyhour.co" : null) }),
}));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    mockResetPasswordForEmail.mockReset().mockResolvedValue({ error: null });
  });

  it("sends the reset email with a redirect to the auth callback", async () => {
    const { requestPasswordReset } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "admin@crazyhour.co");

    const result = await requestPasswordReset(undefined, formData);

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("admin@crazyhour.co", {
      redirectTo: "https://crazyhour.co/admin/restablecer-password",
    });
    expect(result).toEqual({ success: true });
  });

  it("reports success without calling Supabase when the email is blank", async () => {
    const { requestPasswordReset } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "");

    const result = await requestPasswordReset(undefined, formData);

    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
