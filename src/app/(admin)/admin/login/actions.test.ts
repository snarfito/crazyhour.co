import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignIn = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mockSignIn },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("signIn", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockRedirect.mockClear();
  });

  it("returns an error message on invalid credentials", async () => {
    mockSignIn.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const { signIn } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "admin@crazyhour.co");
    formData.set("password", "wrong-password");

    const result = await signIn(undefined, formData);

    expect(result).toEqual({ error: "Correo o contraseña incorrectos." });
  });

  it("redirects to /admin/categorias on success", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const { signIn } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "admin@crazyhour.co");
    formData.set("password", "correct-password");

    await expect(signIn(undefined, formData)).rejects.toThrow(
      "REDIRECT:/admin/categorias"
    );
  });
});
