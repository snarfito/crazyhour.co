import { describe, it, expect, afterEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)(
  "admin_users permissions schema (against local Supabase)",
  () => {
    const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
    const createdUserIds: string[] = [];

    afterEach(async () => {
      for (const id of createdUserIds.splice(0)) {
        await admin.auth.admin.deleteUser(id).catch(() => {});
      }
    });

    it("defaults every permission column to false on insert", async () => {
      const { data: created } = await admin.auth.admin.createUser({
        email: `zzadminpermschema_default_${Date.now()}@crazyhour.test`,
        email_confirm: true,
      });
      const user = created!.user!;
      createdUserIds.push(user.id);

      const { data, error } = await admin
        .from("admin_users")
        .insert({ id: user.id, email: user.email })
        .select("can_pedidos, can_productos, can_categorias, can_ajustes, can_animaciones, can_usuarios")
        .single();

      expect(error).toBeNull();
      expect(data).toEqual({
        can_pedidos: false, can_productos: false, can_categorias: false,
        can_ajustes: false, can_animaciones: false, can_usuarios: false,
      });
    });

    it("no longer accepts the old role column", async () => {
      const { data: created } = await admin.auth.admin.createUser({
        email: `zzadminpermschema_role_${Date.now()}@crazyhour.test`,
        email_confirm: true,
      });
      const user = created!.user!;
      createdUserIds.push(user.id);

      const { error } = await admin
        .from("admin_users")
        .insert({ id: user.id, email: user.email, role: "full" });

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/role/i);
    });
  }
);
