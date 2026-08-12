import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slug";
import { likePattern } from "@/test/db-prefix";

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
// A hyphen, not an underscore: most of this file's rows go through the real
// createCategory() action, which runs the name through slugify() —
// slugify() strips "_" (not in its [a-z0-9\s-] allowlist) but keeps "-", so
// a hyphen survives slugify() unchanged and needs no LIKE-escaping. (The
// updateCategory test below sets its slug directly rather than through
// slugify() — a hyphen behaves identically either way, so no special case
// is needed the way an underscore would have required one.)
const TEST_PREFIX = "zzfase2cat-";
const TEST_PREFIX_SLUG = slugify(TEST_PREFIX);
// The empty-prefix guard against slugify() reducing TEST_PREFIX to ""
// lives inside likePattern() now — see src/test/db-prefix.ts.
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX_SLUG);

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
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
  });

  it("createCategory inserts a row with an auto-generated slug", async () => {
    const { createCategory } = await import("./actions");
    const formData = new FormData();
    formData.set("name", `${TEST_PREFIX}Hora Loca`);

    await createCategory(formData);

    const { data } = await admin
      .from("categories")
      .select("*")
      .like("slug", TEST_PREFIX_LIKE)
      .single();
    expect(data?.name).toBe(`${TEST_PREFIX}Hora Loca`);
    // Asserting via the real slugify() (rather than hand-writing the
    // expected string) keeps this test correct if slugify()'s stripping
    // behavior ever changes.
    expect(data?.slug).toBe(slugify(`${TEST_PREFIX}Hora Loca`));
  });

  it("createCategory rejects a duplicate slug", async () => {
    const { createCategory } = await import("./actions");
    const first = new FormData();
    first.set("name", `${TEST_PREFIX}Globos`);
    await createCategory(first);

    const duplicate = new FormData();
    duplicate.set("name", `${TEST_PREFIX}Globos`);

    await expect(createCategory(duplicate)).rejects.toThrow(/slug/i);
  });

  it("updateCategory changes name and slug", async () => {
    const { createCategory, updateCategory } = await import("./actions");
    const create = new FormData();
    create.set("name", `${TEST_PREFIX}Decoracion`);
    await createCategory(create);
    const { data: created } = await admin
      .from("categories")
      .select("id")
      .like("slug", TEST_PREFIX_LIKE)
      .single();

    const update = new FormData();
    update.set("name", `${TEST_PREFIX}Decoración`);
    update.set("slug", `${TEST_PREFIX}decoracion-fiestas`);
    await updateCategory(created!.id, update);

    const { data: updated } = await admin
      .from("categories")
      .select("*")
      .eq("id", created!.id)
      .single();
    expect(updated?.name).toBe(`${TEST_PREFIX}Decoración`);
    expect(updated?.slug).toBe(`${TEST_PREFIX}decoracion-fiestas`);
  });

  it("createCategory stores a null animation_theme when the field is empty ('usar tema del sitio')", async () => {
    const { createCategory } = await import("./actions");
    const formData = new FormData();
    formData.set("name", `${TEST_PREFIX}Sin tema`);
    formData.set("animation_theme", "");

    await createCategory(formData);

    const { data } = await admin
      .from("categories")
      .select("animation_theme")
      .like("slug", TEST_PREFIX_LIKE)
      .single();
    expect(data?.animation_theme).toBeNull();
  });

  it("createCategory stores a real theme when one is picked", async () => {
    const { createCategory } = await import("./actions");
    const formData = new FormData();
    formData.set("name", `${TEST_PREFIX}Con tema`);
    formData.set("animation_theme", "carnaval");

    await createCategory(formData);

    const { data } = await admin
      .from("categories")
      .select("animation_theme")
      .like("slug", TEST_PREFIX_LIKE)
      .single();
    expect(data?.animation_theme).toBe("carnaval");
  });

  it("updateCategory stores 'none' as an explicit no-animation override, not null", async () => {
    const { createCategory, updateCategory } = await import("./actions");
    const createFormData = new FormData();
    createFormData.set("name", `${TEST_PREFIX}Editar tema`);
    createFormData.set("animation_theme", "carnaval");
    await createCategory(createFormData);

    const { data: created } = await admin
      .from("categories")
      .select("id, slug")
      .like("slug", TEST_PREFIX_LIKE)
      .single();

    const updateFormData = new FormData();
    updateFormData.set("name", `${TEST_PREFIX}Editar tema`);
    updateFormData.set("slug", created!.slug);
    updateFormData.set("animation_theme", "none");
    await updateCategory(created!.id, updateFormData);

    const { data: updated } = await admin
      .from("categories")
      .select("animation_theme")
      .eq("id", created!.id)
      .single();
    expect(updated?.animation_theme).toBe("none");
  });

  it("deleteCategory removes the row", async () => {
    const { createCategory, deleteCategory } = await import("./actions");
    const create = new FormData();
    create.set("name", `${TEST_PREFIX}Recordatorios`);
    await createCategory(create);
    const { data: created } = await admin
      .from("categories")
      .select("id")
      .like("slug", TEST_PREFIX_LIKE)
      .single();

    await deleteCategory(created!.id);

    const { data: remaining } = await admin
      .from("categories")
      .select("*")
      .like("slug", TEST_PREFIX_LIKE);
    expect(remaining).toHaveLength(0);
  });

  it("createCategory appends to the end when categories already exist", async () => {
    const { createCategory } = await import("./actions");
    const first = new FormData();
    first.set("name", `${TEST_PREFIX}Primero`);
    await createCategory(first);
    const { data: firstRow } = await admin
      .from("categories")
      .select("sort_order")
      .like("slug", TEST_PREFIX_LIKE)
      .single();

    const second = new FormData();
    second.set("name", `${TEST_PREFIX}Segundo`);
    await createCategory(second);
    const { data: rows } = await admin
      .from("categories")
      .select("name, sort_order")
      .like("slug", TEST_PREFIX_LIKE)
      .order("sort_order");

    expect(rows).toHaveLength(2);
    expect(rows![1].sort_order).toBe(firstRow!.sort_order + 1);
  });

  it("reorderCategories persists the new order without touching name/slug", async () => {
    const { createCategory, reorderCategories } = await import("./actions");
    const a = new FormData();
    a.set("name", `${TEST_PREFIX}A`);
    await createCategory(a);
    const b = new FormData();
    b.set("name", `${TEST_PREFIX}B`);
    await createCategory(b);

    const { data: rows } = await admin
      .from("categories")
      .select("id, name, slug")
      .like("slug", TEST_PREFIX_LIKE)
      .order("sort_order");
    const [rowA, rowB] = rows!;

    await reorderCategories([rowB.id, rowA.id]);

    const { data: reordered } = await admin
      .from("categories")
      .select("id, name, slug, sort_order")
      .like("slug", TEST_PREFIX_LIKE)
      .order("sort_order");
    expect(reordered![0].id).toBe(rowB.id);
    expect(reordered![0].name).toBe(rowB.name);
    expect(reordered![0].slug).toBe(rowB.slug);
    expect(reordered![1].id).toBe(rowA.id);
  });
});
