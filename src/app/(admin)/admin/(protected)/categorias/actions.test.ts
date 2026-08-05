import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slug";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
// Falls back to a placeholder when unset so `describe.skipIf` below can skip
// cleanly: the describe callback (including `createServiceClient(...)` at
// its top) still runs during Vitest's collection phase even when the suite
// is skipped, and `createServiceClient` throws immediately on an
// empty/undefined key regardless of whether any test actually runs.
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
// Unique per-file prefix so this file's fixture rows can never collide with
// another integration-test file's rows in the shared "categories" table when
// files run in parallel (see productos/actions.test.ts for its own prefix).
const TEST_PREFIX = "zzfase2cat_";

// verifySession() normally redirects unauthenticated users — for these
// tests we mock it to simulate an authenticated admin, since exercising
// the real login flow here would test Task 4, not this task.
vi.mock("@/lib/supabase/dal", () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

// revalidatePath() requires Next's request-scoped work store, which doesn't
// exist when a "use server" action is invoked directly from a Vitest test
// (outside the Next.js server runtime) — it throws "Invariant: static
// generation store missing" otherwise. Mocked for the same reason dal/server
// are mocked above: this test exercises the DB logic, not Next's cache layer.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("category actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("categories").delete().like("slug", `${TEST_PREFIX}%`);
  });

  it("createCategory inserts a row with an auto-generated slug", async () => {
    const { createCategory } = await import("./actions");
    const formData = new FormData();
    formData.set("name", `${TEST_PREFIX}Hora Loca`);
    formData.set("sort_order", "1");

    await createCategory(formData);

    const { data } = await admin
      .from("categories")
      .select("*")
      .like("slug", `${TEST_PREFIX}%`)
      .single();
    expect(data?.name).toBe(`${TEST_PREFIX}Hora Loca`);
    // slugify() strips non-alphanumeric characters, including the "_" in
    // TEST_PREFIX — so the prefix survives in the slug output but without
    // its underscore (e.g. "zzfase2cathora-loca", not "zzfase2cat_hora-loca").
    // Asserting via the real slugify() (rather than hand-writing the
    // expected string) keeps this test correct if that stripping behavior
    // ever changes.
    expect(data?.slug).toBe(slugify(`${TEST_PREFIX}Hora Loca`));
  });

  it("createCategory rejects a duplicate slug", async () => {
    const { createCategory } = await import("./actions");
    const first = new FormData();
    first.set("name", `${TEST_PREFIX}Globos`);
    first.set("sort_order", "1");
    await createCategory(first);

    const duplicate = new FormData();
    duplicate.set("name", `${TEST_PREFIX}Globos`);
    duplicate.set("sort_order", "2");

    await expect(createCategory(duplicate)).rejects.toThrow(/slug/i);
  });

  it("updateCategory changes name and slug", async () => {
    const { createCategory, updateCategory } = await import("./actions");
    const create = new FormData();
    create.set("name", `${TEST_PREFIX}Decoracion`);
    create.set("sort_order", "1");
    await createCategory(create);
    const { data: created } = await admin
      .from("categories")
      .select("id")
      .like("slug", `${TEST_PREFIX}%`)
      .single();

    const update = new FormData();
    update.set("name", `${TEST_PREFIX}Decoración`);
    update.set("slug", `${TEST_PREFIX}decoracion-fiestas`);
    update.set("sort_order", "2");
    await updateCategory(created!.id, update);

    const { data: updated } = await admin
      .from("categories")
      .select("*")
      .eq("id", created!.id)
      .single();
    expect(updated?.name).toBe(`${TEST_PREFIX}Decoración`);
    expect(updated?.slug).toBe(`${TEST_PREFIX}decoracion-fiestas`);
  });

  it("deleteCategory removes the row", async () => {
    const { createCategory, deleteCategory } = await import("./actions");
    const create = new FormData();
    create.set("name", `${TEST_PREFIX}Recordatorios`);
    create.set("sort_order", "1");
    await createCategory(create);
    const { data: created } = await admin
      .from("categories")
      .select("id")
      .like("slug", `${TEST_PREFIX}%`)
      .single();

    await deleteCategory(created!.id);

    const { data: remaining } = await admin
      .from("categories")
      .select("*")
      .like("slug", `${TEST_PREFIX}%`);
    expect(remaining).toHaveLength(0);
  });
});
