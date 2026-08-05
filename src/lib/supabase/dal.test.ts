import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockRedirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

describe("verifySession", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetUser.mockReset();
    mockRedirect.mockClear();
  });

  it("returns the user id and email when a session exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "admin@crazyhour.co" } },
      error: null,
    });
    const { verifySession } = await import("@/lib/supabase/dal");

    const session = await verifySession();

    expect(session).toEqual({ userId: "user-123", email: "admin@crazyhour.co" });
  });

  it("redirects to /admin/login when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { verifySession } = await import("@/lib/supabase/dal");

    await expect(verifySession()).rejects.toThrow("REDIRECT:/admin/login");
  });
});
