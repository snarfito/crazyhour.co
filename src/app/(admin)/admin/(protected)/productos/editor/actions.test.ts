import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzeditorlive_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

const mockRequirePermission = vi.fn();

vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("product editor actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let categoryAId: string;
  let categoryBId: string;
  let productId: string;

  beforeEach(async () => {
    mockRequirePermission.mockReset().mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" });
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

    const { data: product } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata estrella`, description: "original", unit_price_cop: 20000 })
      .select()
      .single();
    productId = product!.id;
    await admin.from("product_categories").insert({ product_id: productId, category_id: categoryAId });
  });

  it("updateProductField updates a text field", async () => {
    const { updateProductField } = await import("./actions");
    await updateProductField(productId, "description", "descripción nueva");

    const { data } = await admin.from("products").select("description").eq("id", productId).single();
    expect(data?.description).toBe("descripción nueva");
  });

  it("updateProductField updates a numeric field", async () => {
    const { updateProductField } = await import("./actions");
    await updateProductField(productId, "unit_price_cop", "25000");

    const { data } = await admin.from("products").select("unit_price_cop").eq("id", productId).single();
    expect(data?.unit_price_cop).toBe(25000);
  });

  it("updateProductField clears an optional numeric field when given an empty string", async () => {
    const { updateProductField } = await import("./actions");
    await updateProductField(productId, "pack2_qty", "10");
    await updateProductField(productId, "pack2_qty", "");

    const { data } = await admin.from("products").select("pack2_qty").eq("id", productId).single();
    expect(data?.pack2_qty).toBeNull();
  });

  it("updateProductField rejects an empty unit_price_cop without writing", async () => {
    const { updateProductField } = await import("./actions");

    await expect(updateProductField(productId, "unit_price_cop", "")).rejects.toThrow(
      "El precio por unidad no puede quedar vacío.",
    );

    const { data } = await admin.from("products").select("unit_price_cop").eq("id", productId).single();
    expect(data?.unit_price_cop).toBe(20000);
  });

  it("updateProductField rejects an empty name without writing", async () => {
    const { updateProductField } = await import("./actions");

    await expect(updateProductField(productId, "name", "")).rejects.toThrow("El nombre no puede quedar vacío.");

    const { data } = await admin.from("products").select("name").eq("id", productId).single();
    expect(data?.name).toBe(`${TEST_PREFIX}Piñata estrella`);
  });

  it("updateProductField rejects a pack qty below 1 without writing", async () => {
    const { updateProductField } = await import("./actions");

    await expect(updateProductField(productId, "pack1_qty", "0")).rejects.toThrow(
      "La cantidad debe ser al menos 1.",
    );

    const { data } = await admin.from("products").select("pack1_qty").eq("id", productId).single();
    expect(data?.pack1_qty).toBeNull();
  });

  it("updateProductField rejects a negative pack qty without writing", async () => {
    const { updateProductField } = await import("./actions");

    await expect(updateProductField(productId, "pack2_qty", "-3")).rejects.toThrow(
      "La cantidad debe ser al menos 1.",
    );

    const { data } = await admin.from("products").select("pack2_qty").eq("id", productId).single();
    expect(data?.pack2_qty).toBeNull();
  });

  it("updateProductField rejects a field outside the allowed set without writing", async () => {
    const { updateProductField } = await import("./actions");

    await expect(
      updateProductField(productId, "is_active" as unknown as Parameters<typeof updateProductField>[1], "true"),
    ).rejects.toThrow("Campo no editable.");
  });

  it("updateProductField translates a pack-price-without-qty constraint violation into a short message", async () => {
    const { updateProductField } = await import("./actions");

    await expect(updateProductField(productId, "pack1_price_cop", "38000")).rejects.toThrow(
      "La paca completa necesita una cantidad antes de tener precio.",
    );
  });

  it("updateProductField propagates rejection when the caller lacks the productos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { updateProductField } = await import("./actions");

    await expect(updateProductField(productId, "unit_price_cop", "99999")).rejects.toThrow();

    const { data } = await admin.from("products").select("unit_price_cop").eq("id", productId).single();
    expect(data?.unit_price_cop).toBe(20000);
  });

  it("updateProductCategories replaces the full category set", async () => {
    const { updateProductCategories } = await import("./actions");
    await updateProductCategories(productId, [categoryBId]);

    const { data: links } = await admin.from("product_categories").select("category_id").eq("product_id", productId);
    expect((links ?? []).map((l) => l.category_id)).toEqual([categoryBId]);
  });

  it("updateProductCategories can clear every category", async () => {
    const { updateProductCategories } = await import("./actions");
    await updateProductCategories(productId, []);

    const { data: links } = await admin.from("product_categories").select("category_id").eq("product_id", productId);
    expect(links).toHaveLength(0);
  });

  it("updateProductCategories propagates rejection when the caller lacks the productos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { updateProductCategories } = await import("./actions");

    await expect(updateProductCategories(productId, [categoryBId])).rejects.toThrow();

    const { data: links } = await admin.from("product_categories").select("category_id").eq("product_id", productId);
    expect((links ?? []).map((l) => l.category_id)).toEqual([categoryAId]);
  });
});
