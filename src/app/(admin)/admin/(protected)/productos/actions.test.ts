import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase2prod_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

vi.mock("@/lib/supabase/dal", () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("product actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let categoryAId: string;
  let categoryBId: string;

  beforeEach(async () => {
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);

    const { data: catA } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    categoryAId = catA!.id;
    const { data: catB } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Globos`, slug: `${TEST_PREFIX}globos`, sort_order: 2 })
      .select()
      .single();
    categoryBId = catB!.id;
  });

  it("createProduct inserts a row linked to every selected category", async () => {
    const { createProduct } = await import("./actions");
    const formData = new FormData();
    formData.append("category_ids", categoryAId);
    formData.append("category_ids", categoryBId);
    formData.set("name", `${TEST_PREFIX}Piñata estrella`);
    formData.set("description", "Piñata artesanal grande");
    formData.set("unit_price_cop", "45000");
    formData.set("pack1_qty", "10");
    formData.set("pack1_price_cop", "38000");
    formData.set("sku", "PIN-001");

    await createProduct(formData);

    const { data: product } = await admin
      .from("products")
      .select("*")
      .eq("name", `${TEST_PREFIX}Piñata estrella`)
      .single();
    expect(product?.unit_price_cop).toBe(45000);
    expect(product?.pack1_qty).toBe(10);
    expect(product?.pack1_price_cop).toBe(38000);
    expect(product?.pack2_qty).toBeNull();
    expect(product?.is_active).toBe(true);

    const { data: links } = await admin
      .from("product_categories")
      .select("category_id")
      .eq("product_id", product!.id);
    expect((links ?? []).map((l) => l.category_id).sort()).toEqual([categoryAId, categoryBId].sort());
  });

  it("updateProduct replaces category links and price fields", async () => {
    const { createProduct, updateProduct } = await import("./actions");
    const create = new FormData();
    create.append("category_ids", categoryAId);
    create.set("name", `${TEST_PREFIX}Globo`);
    create.set("description", "Globo metálico");
    create.set("unit_price_cop", "5000");
    create.set("sku", "GLO-001");
    await createProduct(create);
    const { data: created } = await admin.from("products").select("id").eq("name", `${TEST_PREFIX}Globo`).single();

    const update = new FormData();
    update.append("category_ids", categoryBId);
    update.set("name", `${TEST_PREFIX}Globo metálico grande`);
    update.set("description", "Globo metálico 24 pulgadas");
    update.set("unit_price_cop", "7000");
    update.set("sku", "GLO-001");
    await updateProduct(created!.id, update);

    const { data: updated } = await admin.from("products").select("*").eq("id", created!.id).single();
    expect(updated?.name).toBe(`${TEST_PREFIX}Globo metálico grande`);
    expect(updated?.unit_price_cop).toBe(7000);

    const { data: links } = await admin
      .from("product_categories")
      .select("category_id")
      .eq("product_id", created!.id);
    expect((links ?? []).map((l) => l.category_id)).toEqual([categoryBId]);
  });

  it("toggleProductActive flips is_active", async () => {
    const { createProduct, toggleProductActive } = await import("./actions");
    const create = new FormData();
    create.append("category_ids", categoryAId);
    create.set("name", `${TEST_PREFIX}Kit decoración`);
    create.set("description", "Kit completo");
    create.set("unit_price_cop", "30000");
    create.set("sku", "KIT-001");
    await createProduct(create);
    const { data: created } = await admin
      .from("products")
      .select("id, is_active")
      .eq("name", `${TEST_PREFIX}Kit decoración`)
      .single();
    expect(created?.is_active).toBe(true);

    await toggleProductActive(created!.id, false);

    const { data: updated } = await admin.from("products").select("is_active").eq("id", created!.id).single();
    expect(updated?.is_active).toBe(false);
  });

  it("deleteProduct removes the row and its category links", async () => {
    const { createProduct, deleteProduct } = await import("./actions");
    const create = new FormData();
    create.append("category_ids", categoryAId);
    create.set("name", `${TEST_PREFIX}Producto a borrar`);
    create.set("description", "x");
    create.set("unit_price_cop", "1000");
    create.set("sku", "DEL-001");
    await createProduct(create);
    const { data: created } = await admin
      .from("products")
      .select("id")
      .eq("name", `${TEST_PREFIX}Producto a borrar`)
      .single();

    await deleteProduct(created!.id);

    const { data: remaining } = await admin.from("products").select("*").eq("id", created!.id);
    expect(remaining).toHaveLength(0);
    const { data: links } = await admin.from("product_categories").select("*").eq("product_id", created!.id);
    expect(links).toHaveLength(0);
  });
});
