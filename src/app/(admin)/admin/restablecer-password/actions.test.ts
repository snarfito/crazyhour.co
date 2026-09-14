import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdateUser = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { updateUser: mockUpdateUser },
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("updatePassword", () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
    mockRedirect.mockClear();
    mockFrom.mockClear();
    mockUpdate.mockClear();
    mockEq.mockClear();
  });

  it("rejects passwords shorter than 8 characters without calling Supabase", async () => {
    const { updatePassword } = await import("./actions");
    const formData = new FormData();
    formData.set("password", "short");

    const result = await updatePassword(undefined, formData);

    expect(result).toEqual({ error: "La contraseña debe tener al menos 8 caracteres." });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("returns an error when Supabase rejects the update", async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: null }, error: { message: "session expired" } });
    const { updatePassword } = await import("./actions");
    const formData = new FormData();
    formData.set("password", "longenough1");

    const result = await updatePassword(undefined, formData);

    expect(result).toEqual({ error: "No se pudo actualizar la contraseña. Solicita un nuevo enlace." });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("clears must_change_password and redirects to /admin/categorias on success", async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    const { updatePassword } = await import("./actions");
    const formData = new FormData();
    formData.set("password", "longenough1");

    await expect(updatePassword(undefined, formData)).rejects.toThrow(
      "REDIRECT:/admin/categorias"
    );

    expect(mockFrom).toHaveBeenCalledWith("admin_users");
    expect(mockUpdate).toHaveBeenCalledWith({ must_change_password: false });
    expect(mockEq).toHaveBeenCalledWith("id", "user-123");
  });
});
