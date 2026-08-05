import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
// Falls back to a placeholder when unset so `describe.skipIf` below can skip
// cleanly: the describe callback (including `createServiceClient(...)` at
// its top) still runs during Vitest's collection phase even when the suite
// is skipped, and `createServiceClient` throws immediately on an
// empty/undefined key regardless of whether any test actually runs.
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
// Unique per-file prefix so this file's fixture rows can never collide with
// another integration-test file's rows in the shared "categories" table when
// files run in parallel (see categorias/actions.test.ts for its own prefix).
const TEST_PREFIX = "zzfase2prod_";

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
// (Same fix as Task 6's categories/actions.test.ts for the identical issue.)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("product actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let categoryId: string;

  beforeEach(async () => {
    const { data: prefixedCategories } = await admin
      .from("categories")
      .select("id")
      .like("slug", `${TEST_PREFIX}%`);
    const categoryIds = (prefixedCategories ?? []).map((c) => c.id);
    if (categoryIds.length > 0) {
      await admin.from("products").delete().in("category_id", categoryIds);
    }
    await admin.from("categories").delete().like("slug", `${TEST_PREFIX}%`);
    const { data } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    categoryId = data!.id;
  });

  it("createProduct inserts a row linked to its category", async () => {
    const { createProduct } = await import("./actions");
    const formData = new FormData();
    formData.set("category_id", categoryId);
    formData.set("name", `${TEST_PREFIX}Piñata estrella`);
    formData.set("description", "Piñata artesanal grande");
    formData.set("price_cop", "45000");
    formData.set("sku", "PIN-001");

    await createProduct(formData);

    const { data } = await admin.from("products").select("*").eq("category_id", categoryId).single();
    expect(data?.name).toBe(`${TEST_PREFIX}Piñata estrella`);
    expect(data?.category_id).toBe(categoryId);
    expect(data?.price_cop).toBe(45000);
    expect(data?.is_active).toBe(true);
  });

  it("updateProduct changes fields", async () => {
    const { createProduct, updateProduct } = await import("./actions");
    const create = new FormData();
    create.set("category_id", categoryId);
    create.set("name", `${TEST_PREFIX}Globo`);
    create.set("description", "Globo metálico");
    create.set("price_cop", "5000");
    create.set("sku", "GLO-001");
    await createProduct(create);
    const { data: created } = await admin
      .from("products")
      .select("id")
      .eq("category_id", categoryId)
      .single();

    const update = new FormData();
    update.set("category_id", categoryId);
    update.set("name", `${TEST_PREFIX}Globo metálico grande`);
    update.set("description", "Globo metálico 24 pulgadas");
    update.set("price_cop", "7000");
    update.set("sku", "GLO-001");
    await updateProduct(created!.id, update);

    const { data: updated } = await admin.from("products").select("*").eq("id", created!.id).single();
    expect(updated?.name).toBe(`${TEST_PREFIX}Globo metálico grande`);
    expect(updated?.price_cop).toBe(7000);
  });

  it("toggleProductActive flips is_active", async () => {
    const { createProduct, toggleProductActive } = await import("./actions");
    const create = new FormData();
    create.set("category_id", categoryId);
    create.set("name", `${TEST_PREFIX}Kit decoración`);
    create.set("description", "Kit completo");
    create.set("price_cop", "30000");
    create.set("sku", "KIT-001");
    await createProduct(create);
    const { data: created } = await admin
      .from("products")
      .select("id, is_active")
      .eq("category_id", categoryId)
      .single();
    expect(created?.is_active).toBe(true);

    await toggleProductActive(created!.id, false);

    const { data: updated } = await admin.from("products").select("is_active").eq("id", created!.id).single();
    expect(updated?.is_active).toBe(false);
  });

  it("deleteProduct removes the row", async () => {
    const { createProduct, deleteProduct } = await import("./actions");
    const create = new FormData();
    create.set("category_id", categoryId);
    create.set("name", `${TEST_PREFIX}Producto a borrar`);
    create.set("description", "x");
    create.set("price_cop", "1000");
    create.set("sku", "DEL-001");
    await createProduct(create);
    const { data: created } = await admin
      .from("products")
      .select("id")
      .eq("category_id", categoryId)
      .single();

    await deleteProduct(created!.id);

    const { data: remaining } = await admin.from("products").select("*").eq("category_id", categoryId);
    expect(remaining).toHaveLength(0);
  });
});
