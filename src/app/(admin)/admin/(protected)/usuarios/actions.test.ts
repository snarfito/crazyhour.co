import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

const mockRequirePermission = vi.fn();

vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("inviteAdmin / revokeAdmin / updatePermissions (against local Supabase)", () => {
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
    mockRequirePermission.mockResolvedValue({ userId: inviterId, email: "full@crazyhour.co" });
  });

  afterEach(async () => {
    for (const id of createdUserIds.splice(0)) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  });

  // Temporarily turns off can_usuarios on every OTHER admin_users row so a
  // "last admin with usuarios" scenario is deterministic regardless of what
  // else already exists in the local DB (e.g. this project's real seeded
  // admin) — then restores it, so this test never permanently locks anyone
  // out of the real local panel.
  async function withOnlyThisAdminHavingUsuarios(targetId: string, fn: () => Promise<void>) {
    const { data: others } = await admin.from("admin_users").select("id").eq("can_usuarios", true).neq("id", targetId);
    const otherIds = (others ?? []).map((o) => o.id);
    if (otherIds.length > 0) await admin.from("admin_users").update({ can_usuarios: false }).in("id", otherIds);
    try {
      await fn();
    } finally {
      if (otherIds.length > 0) await admin.from("admin_users").update({ can_usuarios: true }).in("id", otherIds);
    }
  }

  it("invites a brand-new email with the chosen permissions", async () => {
    const { inviteAdmin } = await import("./actions");
    const email = `zzadminusuarios_new_${Date.now()}@crazyhour.test`;
    const formData = new FormData();
    formData.set("email", email);
    formData.set("can_pedidos", "on");
    formData.set("can_productos", "on");
    formData.set("can_categorias", "on");

    const result = await inviteAdmin(undefined, formData);
    expect(result).toEqual({ success: true });

    const { data: row } = await admin.from("admin_users").select("*").eq("email", email).single();
    createdUserIds.push(row!.id);
    expect(row).toMatchObject({
      can_pedidos: true, can_productos: true, can_categorias: true,
      can_ajustes: false, can_animaciones: false, can_usuarios: false,
      invited_by: inviterId,
    });
  });

  it("rejects an email that already has an admin_users row", async () => {
    const email = `zzadminusuarios_dup_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: true, can_productos: true, can_categorias: true,
      can_ajustes: true, can_animaciones: true, can_usuarios: true,
    });

    const { inviteAdmin } = await import("./actions");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("can_pedidos", "on");

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
    formData.set("can_pedidos", "on");
    formData.set("can_productos", "on");
    formData.set("can_categorias", "on");
    formData.set("can_ajustes", "on");
    formData.set("can_animaciones", "on");
    formData.set("can_usuarios", "on");

    const result = await inviteAdmin(undefined, formData);
    expect(result).toEqual({ success: true });

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).single();
    expect(row?.can_usuarios).toBe(true);
  });

  it("revokes access by deleting the admin_users row, leaving the Auth account intact", async () => {
    const email = `zzadminusuarios_revoke_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: true, can_productos: true, can_categorias: true,
      can_ajustes: false, can_animaciones: false, can_usuarios: false,
    });

    const { revokeAdmin } = await import("./actions");
    await revokeAdmin(created.user!.id);

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).maybeSingle();
    expect(row).toBeNull();
    const { data: authUser } = await admin.auth.admin.getUserById(created.user!.id);
    expect(authUser.user).not.toBeNull();
  });

  it("refuses to let an admin revoke their own access", async () => {
    const email = `zzadminusuarios_self_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: true, can_productos: true, can_categorias: true,
      can_ajustes: false, can_animaciones: false, can_usuarios: true,
    });
    mockRequirePermission.mockResolvedValue({ userId: created.user!.id, email });

    const { revokeAdmin } = await import("./actions");
    await expect(revokeAdmin(created.user!.id)).rejects.toThrow("No puedes modificar tu propio acceso.");

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).maybeSingle();
    expect(row).not.toBeNull();
  });

  it("refuses to revoke the last admin with the usuarios permission", async () => {
    const email = `zzadminusuarios_lastusuarios_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: false, can_productos: false, can_categorias: false,
      can_ajustes: false, can_animaciones: false, can_usuarios: true,
    });

    const { revokeAdmin } = await import("./actions");
    await withOnlyThisAdminHavingUsuarios(created.user!.id, async () => {
      await expect(revokeAdmin(created.user!.id)).rejects.toThrow("Debe quedar al menos un administrador con acceso a Usuarios.");
    });

    const { data: row } = await admin.from("admin_users").select("*").eq("id", created.user!.id).maybeSingle();
    expect(row).not.toBeNull();
  });

  it("updatePermissions changes another admin's permissions without touching Auth", async () => {
    const email = `zzadminusuarios_editperm_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: true, can_productos: true, can_categorias: true,
      can_ajustes: false, can_animaciones: false, can_usuarios: false,
    });

    const { updatePermissions } = await import("./actions");
    await updatePermissions(created.user!.id, {
      pedidos: true, productos: true, categorias: true,
      ajustes: true, animaciones: false, usuarios: false,
    });

    const { data: row } = await admin.from("admin_users").select("can_ajustes, can_animaciones").eq("id", created.user!.id).single();
    expect(row?.can_ajustes).toBe(true);
    expect(row?.can_animaciones).toBe(false);

    const { data: authUser } = await admin.auth.admin.getUserById(created.user!.id);
    expect(authUser.user).not.toBeNull();
  });

  it("refuses to let an admin edit their own permissions", async () => {
    const email = `zzadminusuarios_editself_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: true, can_productos: true, can_categorias: true,
      can_ajustes: false, can_animaciones: false, can_usuarios: true,
    });
    mockRequirePermission.mockResolvedValue({ userId: created.user!.id, email });

    const { updatePermissions } = await import("./actions");
    await expect(
      updatePermissions(created.user!.id, {
        pedidos: false, productos: false, categorias: false,
        ajustes: false, animaciones: false, usuarios: false,
      }),
    ).rejects.toThrow("No puedes modificar tu propio acceso.");
  });

  it("refuses to remove the usuarios permission from the last admin who has it", async () => {
    const email = `zzadminusuarios_editlast_${Date.now()}@crazyhour.test`;
    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    createdUserIds.push(created.user!.id);
    await admin.from("admin_users").insert({
      id: created.user!.id, email, invited_by: inviterId,
      can_pedidos: false, can_productos: false, can_categorias: false,
      can_ajustes: false, can_animaciones: false, can_usuarios: true,
    });

    const { updatePermissions } = await import("./actions");
    await withOnlyThisAdminHavingUsuarios(created.user!.id, async () => {
      await expect(
        updatePermissions(created.user!.id, {
          pedidos: false, productos: false, categorias: false,
          ajustes: false, animaciones: false, usuarios: false,
        }),
      ).rejects.toThrow("Debe quedar al menos un administrador con acceso a Usuarios.");
    });

    const { data: row } = await admin.from("admin_users").select("can_usuarios").eq("id", created.user!.id).single();
    expect(row?.can_usuarios).toBe(true);
  });
});
