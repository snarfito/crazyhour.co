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

describe("verifySession", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
    mockRedirect.mockClear();
  });

  it("returns the user id, email, and role when a session and admin_users row exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "limited" }, error: null });
    const { verifySession } = await import("@/lib/supabase/dal");

    const session = await verifySession();

    expect(session).toEqual({ userId: "user-123", email: "admin@crazyhour.co", role: "limited" });
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

describe("requireFullAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
    mockRedirect.mockClear();
  });

  it("returns the session when role is full", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "full" }, error: null });
    const { requireFullAdmin } = await import("@/lib/supabase/dal");

    await expect(requireFullAdmin()).resolves.toEqual({
      userId: "user-123",
      email: "admin@crazyhour.co",
      role: "full",
    });
  });

  it("redirects to /admin/pedidos when role is limited", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { role: "limited" }, error: null });
    const { requireFullAdmin } = await import("@/lib/supabase/dal");

    await expect(requireFullAdmin()).rejects.toThrow("REDIRECT:/admin/pedidos");
  });
});
