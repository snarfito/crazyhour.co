import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

const ALL_GRANTED = {
  can_pedidos: true, can_productos: true, can_categorias: true,
  can_ajustes: true, can_animaciones: true, can_usuarios: true,
};

describe("verifySession", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
    mockRedirect.mockClear();
  });

  it("returns the user id, email, and the 6 permissions read from admin_users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: {
        can_pedidos: true, can_productos: false, can_categorias: false,
        can_ajustes: false, can_animaciones: false, can_usuarios: true,
      },
      error: null,
    });
    const { verifySession } = await import("@/lib/supabase/dal");

    const session = await verifySession();

    expect(session).toEqual({
      userId: "user-123",
      email: "admin@crazyhour.co",
      permissions: { pedidos: true, productos: false, categorias: false, ajustes: false, animaciones: false, usuarios: true },
    });
  });

  it("redirects to /admin/login when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { verifySession } = await import("@/lib/supabase/dal");

    await expect(verifySession()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to /admin/login when the user has no admin_users row (revoked or never invited)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "ex-admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { verifySession } = await import("@/lib/supabase/dal");

    await expect(verifySession()).rejects.toThrow("REDIRECT:/admin/login");
  });
});

describe("requirePermission", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
    mockRedirect.mockClear();
  });

  it("returns the session when the requested permission is true", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: ALL_GRANTED, error: null });
    const { requirePermission } = await import("@/lib/supabase/dal");

    await expect(requirePermission("productos")).resolves.toEqual({
      userId: "user-123",
      email: "admin@crazyhour.co",
      permissions: { pedidos: true, productos: true, categorias: true, ajustes: true, animaciones: true, usuarios: true },
    });
  });

  it("redirects to /admin/pedidos when the requested permission is false", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: {
        can_pedidos: true, can_productos: true, can_categorias: true,
        can_ajustes: false, can_animaciones: false, can_usuarios: false,
      },
      error: null,
    });
    const { requirePermission } = await import("@/lib/supabase/dal");

    await expect(requirePermission("usuarios")).rejects.toThrow("REDIRECT:/admin/pedidos");
  });
});
