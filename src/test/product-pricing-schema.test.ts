import { describe, it, expect, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "./db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzpricingschema_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)(
  "products tiered-pricing schema + product_categories (against local Supabase)",
  () => {
    const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

    beforeEach(async () => {
      // Products before categories: product_categories rows cascade-delete
      // with their product, avoiding categories' on-delete-restrict FK.
      await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
      await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
    });

    it("allows a product with only unit_price_cop", async () => {
      const { error } = await admin
        .from("products")
        .insert({ name: `${TEST_PREFIX}Solo unidad`, unit_price_cop: 5000, is_active: true });
      expect(error).toBeNull();
    });

    it("rejects pack1_price_cop without pack1_qty", async () => {
      const { error } = await admin
        .from("products")
        .insert({ name: `${TEST_PREFIX}Sin qty`, unit_price_cop: 5000, pack1_price_cop: 4000, is_active: true });
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/products_pack1_price_requires_qty/);
    });

    it("rejects pack2_price_cop without pack2_qty", async () => {
      const { error } = await admin
        .from("products")
        .insert({ name: `${TEST_PREFIX}Sin qty 2`, unit_price_cop: 5000, pack2_price_cop: 4500, is_active: true });
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/products_pack2_price_requires_qty/);
    });

    it("rejects pack1_qty <= pack2_qty", async () => {
      const { error } = await admin.from("products").insert({
        name: `${TEST_PREFIX}Tramos invertidos`,
        unit_price_cop: 5000,
        pack1_qty: 5,
        pack1_price_cop: 4000,
        pack2_qty: 10,
        pack2_price_cop: 4500,
        is_active: true,
      });
      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/products_pack1_qty_gt_pack2_qty/);
    });

    it("allows pack1_qty > pack2_qty with both prices set", async () => {
      const { error } = await admin.from("products").insert({
        name: `${TEST_PREFIX}Tramos correctos`,
        unit_price_cop: 5000,
        pack1_qty: 10,
        pack1_price_cop: 3000,
        pack2_qty: 5,
        pack2_price_cop: 3500,
        is_active: true,
      });
      expect(error).toBeNull();
    });

    it("lets a product link to more than one category via product_categories", async () => {
      const { data: catA } = await admin
        .from("categories")
        .insert({ name: `${TEST_PREFIX}Cat A`, slug: `${TEST_PREFIX}cat-a`, sort_order: 1 })
        .select()
        .single();
      const { data: catB } = await admin
        .from("categories")
        .insert({ name: `${TEST_PREFIX}Cat B`, slug: `${TEST_PREFIX}cat-b`, sort_order: 2 })
        .select()
        .single();
      const { data: product } = await admin
        .from("products")
        .insert({ name: `${TEST_PREFIX}Multi categoria`, unit_price_cop: 1000, is_active: true })
        .select()
        .single();

      const { error: linkError } = await admin.from("product_categories").insert([
        { product_id: product!.id, category_id: catA!.id },
        { product_id: product!.id, category_id: catB!.id },
      ]);
      expect(linkError).toBeNull();

      const { data: links } = await admin
        .from("product_categories")
        .select("category_id")
        .eq("product_id", product!.id);
      expect(links).toHaveLength(2);
    });
  }
);
