import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

const mockRequireFullAdmin = vi.fn();

vi.mock("@/lib/supabase/dal", () => ({
  requireFullAdmin: () => mockRequireFullAdmin(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("inviteAdmin / revokeAdmin (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  const createdUserIds: string[] = [];
  let inviterId: string;

  beforeAll(async () => {
    // invited_by has a real FK to auth.users — needs an actual account, a
    // made-up uuid fails the insert.
    const { data } = await admin.auth.admin.createUser({
      email: `zzadminusuarios_inviter_${Date.now()}@crazyhour.test`,
      email_confirm: true,
    });
    inviterId = data.user!.id;
  });

  afterAll(async () => {
    await admin.auth.admin.deleteUser(inviterId).catch(() => {});
  });

  beforeEach(() => {
    mockRequireFullAdmin.mockResolvedValue({ userId: inviterId, email: "full@crazyhour.co", role: "full" });
  });

  afterEach(async () => {
    for (const id of createdUserIds.splice(0)) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  });

  it("invites a brand-new email and gives it the chosen role", async () => {
    const { inviteAdmin } = await import("./actions");
    const email = `zzadminusuarios_new_${Date.now()}@crazyhour.test`;
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", "limited");

    const result = await inviteAdmin(undefined, formData);
    expect(result).toEqual({ success: true });

    const { data: row } = await admin.from("admin_users").select("*").eq("email", email).single();
    createdUserIds.push(row!.id);
    expect(row?.role).toBe("limited");
    expect(row?.invited_by).toBe(inviterId);
  });

  it("rejects an email that already has an admin_users row", async () => {
    const email = `zzadminusuarios_dup_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({ id: created.user!.id, email, role: "full" });

    const { inviteAdmin } = await import("./actions");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", "limited");

    const result = await inviteAdmin(undefined, formData);
    expect(result).toEqual({ error: "Este correo ya tiene acceso al panel." });
  });

  it("re-grants access to an Auth user that exists but was revoked, without erroring", async () => {
    const email = `zzadminusuarios_revoked_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    // No admin_users row — simulates a previously-revoked account.

    const { inviteAdmin } = await import("./actions");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("role", "full");

    const result = await inviteAdmin(undefined, formData);
    expect(result).toEqual({ success: true });

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).single();
    expect(row?.role).toBe("full");
  });

  it("revokes access by deleting the admin_users row, leaving the Auth account intact", async () => {
    const email = `zzadminusuarios_revoke_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({ id: created.user!.id, email, role: "limited" });

    const { revokeAdmin } = await import("./actions");
    await revokeAdmin(created.user!.id);

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).maybeSingle();
    expect(row).toBeNull();
    const { data: authUser } = await admin.auth.admin.getUserById(created.user!.id);
    expect(authUser.user).not.toBeNull();
  });

  it("refuses to let a full admin revoke their own access", async () => {
    const email = `zzadminusuarios_self_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({ id: created.user!.id, email, role: "full" });
    mockRequireFullAdmin.mockResolvedValue({ userId: created.user!.id, email, role: "full" });

    const { revokeAdmin } = await import("./actions");
    await expect(revokeAdmin(created.user!.id)).rejects.toThrow("No puedes revocarte tu propio acceso.");

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).maybeSingle();
    expect(row).not.toBeNull();
  });
});
