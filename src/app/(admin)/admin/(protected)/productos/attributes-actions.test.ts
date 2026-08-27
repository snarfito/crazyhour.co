import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzattrs_";
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

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("product attribute actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let productId: string;

  beforeEach(async () => {
    mockRequirePermission.mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" });
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);

    const { data: product } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Globo metalizado`, unit_price_cop: 1000, is_active: true })
      .select()
      .single();
    productId = product!.id;
  });

  it("createAttribute inserts a group scoped to the product", async () => {
    const { createAttribute } = await import("./attributes-actions");
    const formData = new FormData();
    formData.set("kind", "color");
    formData.set("display_name", "Color");

    await createAttribute(productId, formData);

    const { data } = await admin.from("product_attributes").select("*").eq("product_id", productId).single();
    expect(data?.kind).toBe("color");
    expect(data?.display_name).toBe("Color");
    expect(data?.affects_price).toBe(false);
  });

  it("createAttribute with affects_price=on marks the group as the price driver", async () => {
    const { createAttribute } = await import("./attributes-actions");
    const formData = new FormData();
    formData.set("kind", "size");
    formData.set("display_name", "Talla");
    formData.set("affects_price", "on");

    await createAttribute(productId, formData);

    const { data } = await admin.from("product_attributes").select("affects_price").eq("product_id", productId).single();
    expect(data?.affects_price).toBe(true);
  });

  it("rejects a second price-driving group on the same product", async () => {
    const { createAttribute } = await import("./attributes-actions");
    const first = new FormData();
    first.set("kind", "size");
    first.set("display_name", "Talla");
    first.set("affects_price", "on");
    await createAttribute(productId, first);

    const second = new FormData();
    second.set("kind", "generic");
    second.set("display_name", "Material");
    second.set("affects_price", "on");

    await expect(createAttribute(productId, second)).rejects.toThrow(/afectar el precio/i);

    const { data } = await admin.from("product_attributes").select("id").eq("product_id", productId);
    expect(data).toHaveLength(1);
  });

  it("createAttribute with has_photos=on marks the group as the photo-carrying group", async () => {
    const { createAttribute } = await import("./attributes-actions");
    const formData = new FormData();
    formData.set("kind", "color");
    formData.set("display_name", "Color");
    formData.set("has_photos", "on");

    await createAttribute(productId, formData);

    const { data } = await admin.from("product_attributes").select("has_photos").eq("product_id", productId).single();
    expect(data?.has_photos).toBe(true);
  });

  it("rejects a second photo-carrying group on the same product", async () => {
    const { createAttribute } = await import("./attributes-actions");
    const first = new FormData();
    first.set("kind", "color");
    first.set("display_name", "Color");
    first.set("has_photos", "on");
    await createAttribute(productId, first);

    const second = new FormData();
    second.set("kind", "generic");
    second.set("display_name", "Material");
    second.set("has_photos", "on");

    await expect(createAttribute(productId, second)).rejects.toThrow(/fotos/i);

    const { data } = await admin.from("product_attributes").select("id").eq("product_id", productId);
    expect(data).toHaveLength(1);
  });

  it("allows one group to affect price and a different group to have photos at the same time", async () => {
    const { createAttribute } = await import("./attributes-actions");
    const price = new FormData();
    price.set("kind", "size");
    price.set("display_name", "Talla");
    price.set("affects_price", "on");
    await createAttribute(productId, price);

    const photos = new FormData();
    photos.set("kind", "color");
    photos.set("display_name", "Color");
    photos.set("has_photos", "on");
    await createAttribute(productId, photos);

    const { data } = await admin.from("product_attributes").select("display_name, affects_price, has_photos").eq("product_id", productId);
    expect(data).toHaveLength(2);
  });

  it("propagates rejection when the caller lacks the productos permission, without writing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const { createAttribute } = await import("./attributes-actions");
    const formData = new FormData();
    formData.set("kind", "color");
    formData.set("display_name", "Color");

    await expect(createAttribute(productId, formData)).rejects.toThrow();

    const { data } = await admin.from("product_attributes").select("id").eq("product_id", productId);
    expect(data).toHaveLength(0);
  });

  describe("options", () => {
    let attributeId: string;

    beforeEach(async () => {
      const { data } = await admin
        .from("product_attributes")
        .insert({ product_id: productId, kind: "color", display_name: "Color" })
        .select()
        .single();
      attributeId = data!.id;
    });

    it("createOption inserts an option under the group", async () => {
      const { createOption } = await import("./attributes-actions");
      const formData = new FormData();
      formData.set("display_name", "Chrome Gold");
      formData.set("color_hex", "#D4AF37");

      await createOption(attributeId, productId, formData);

      const { data } = await admin.from("attribute_options").select("*").eq("attribute_id", attributeId).single();
      expect(data?.display_name).toBe("Chrome Gold");
      expect(data?.color_hex).toBe("#D4AF37");
      expect(data?.unit_price_cop).toBeNull();
      expect(data?.pack1_price_cop).toBeNull();
      expect(data?.pack2_price_cop).toBeNull();
      expect(data?.is_active).toBe(true);
    });

    it("createOptionsBatch adds one option per non-empty line", async () => {
      const { createOptionsBatch } = await import("./attributes-actions");
      const formData = new FormData();
      formData.set("namesRaw", "Chrome Gold\nChrome Silver\n\n  Chrome Red  \n");

      await createOptionsBatch(attributeId, productId, formData);

      const { data } = await admin
        .from("attribute_options")
        .select("display_name")
        .eq("attribute_id", attributeId)
        .order("display_name");
      expect((data ?? []).map((o) => o.display_name)).toEqual(["Chrome Gold", "Chrome Red", "Chrome Silver"]);
    });

    it("createOptionsBatch fills in a suggested color_hex per name, editable and best-effort", async () => {
      const { createOptionsBatch } = await import("./attributes-actions");
      const formData = new FormData();
      formData.set("namesRaw", "Chrome Gold\nNombre inventado sin match");

      await createOptionsBatch(attributeId, productId, formData);

      const { data } = await admin
        .from("attribute_options")
        .select("display_name, color_hex")
        .eq("attribute_id", attributeId)
        .order("display_name");
      expect(data).toEqual([
        { display_name: "Chrome Gold", color_hex: "#D4AF37" },
        { display_name: "Nombre inventado sin match", color_hex: null },
      ]);
    });

    it("linkOptionImage sets and clears the option's product_image_id", async () => {
      const { createOption, linkOptionImage } = await import("./attributes-actions");
      const create = new FormData();
      create.set("display_name", "Chrome Gold");
      await createOption(attributeId, productId, create);
      const { data: created } = await admin
        .from("attribute_options")
        .select("id")
        .eq("attribute_id", attributeId)
        .single();
      const { data: image } = await admin
        .from("product_images")
        .insert({ product_id: productId, original_url: "https://example.com/gold.jpg" })
        .select()
        .single();

      await linkOptionImage(created!.id, productId, image!.id);
      const { data: linked } = await admin.from("attribute_options").select("product_image_id").eq("id", created!.id).single();
      expect(linked?.product_image_id).toBe(image!.id);

      await linkOptionImage(created!.id, productId, null);
      const { data: unlinked } = await admin.from("attribute_options").select("product_image_id").eq("id", created!.id).single();
      expect(unlinked?.product_image_id).toBeNull();
    });

    it("updateOption changes name, the 3 tiered prices, and image link", async () => {
      const { createOption, updateOption } = await import("./attributes-actions");
      const create = new FormData();
      create.set("display_name", "Chrome Gold");
      await createOption(attributeId, productId, create);
      const { data: created } = await admin
        .from("attribute_options")
        .select("id")
        .eq("attribute_id", attributeId)
        .single();

      const update = new FormData();
      update.set("display_name", "Chrome Gold Renombrado");
      update.set("unit_price_cop", "3000");
      update.set("pack1_price_cop", "2000");
      update.set("pack2_price_cop", "2500");
      await updateOption(created!.id, productId, update);

      const { data: updated } = await admin.from("attribute_options").select("*").eq("id", created!.id).single();
      expect(updated?.display_name).toBe("Chrome Gold Renombrado");
      expect(updated?.unit_price_cop).toBe(3000);
      expect(updated?.pack1_price_cop).toBe(2000);
      expect(updated?.pack2_price_cop).toBe(2500);
    });

    it("toggleOptionActive flips is_active", async () => {
      const { createOption, toggleOptionActive } = await import("./attributes-actions");
      const create = new FormData();
      create.set("display_name", "Chrome Gold");
      await createOption(attributeId, productId, create);
      const { data: created } = await admin
        .from("attribute_options")
        .select("id")
        .eq("attribute_id", attributeId)
        .single();

      await toggleOptionActive(created!.id, productId, false);

      const { data: updated } = await admin.from("attribute_options").select("is_active").eq("id", created!.id).single();
      expect(updated?.is_active).toBe(false);
    });

    it("deleteOption removes the row", async () => {
      const { createOption, deleteOption } = await import("./attributes-actions");
      const create = new FormData();
      create.set("display_name", "Chrome Gold");
      await createOption(attributeId, productId, create);
      const { data: created } = await admin
        .from("attribute_options")
        .select("id")
        .eq("attribute_id", attributeId)
        .single();

      await deleteOption(created!.id, productId);

      const { data: remaining } = await admin.from("attribute_options").select("id").eq("id", created!.id);
      expect(remaining).toHaveLength(0);
    });
  });

  it("deleteAttribute cascades to its options", async () => {
    const { createAttribute, deleteAttribute } = await import("./attributes-actions");
    const attrForm = new FormData();
    attrForm.set("kind", "color");
    attrForm.set("display_name", "Color");
    await createAttribute(productId, attrForm);
    const { data: attribute } = await admin
      .from("product_attributes")
      .select("id")
      .eq("product_id", productId)
      .single();
    await admin.from("attribute_options").insert({ attribute_id: attribute!.id, display_name: "Chrome Gold" });

    await deleteAttribute(attribute!.id, productId);

    const { data: remainingOptions } = await admin
      .from("attribute_options")
      .select("id")
      .eq("attribute_id", attribute!.id);
    expect(remainingOptions).toHaveLength(0);
  });
});
