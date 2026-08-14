import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzeditorpage_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

const mockRequirePermission = vi.fn().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co" });
vi.mock("@/lib/supabase/dal", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Product editor page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    mockRequirePermission.mockReset().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co" });
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
  });

  it("loads every product with its categories and price fields in one render", async () => {
    const { data: cat } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    const { data: product } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata estrella`, unit_price_cop: 20000 })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: product!.id, category_id: cat!.id });

    const ProductEditorPage = (await import("./page")).default;
    render(await ProductEditorPage());

    expect(screen.getByDisplayValue(`${TEST_PREFIX}Piñata estrella`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${TEST_PREFIX}Piñatas` })).toBeInTheDocument();
  });

  it("redirects when the caller lacks the productos permission", async () => {
    mockRequirePermission.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const ProductEditorPage = (await import("./page")).default;

    await expect(ProductEditorPage()).rejects.toThrow("REDIRECT:/admin/pedidos");
    expect(mockRequirePermission).toHaveBeenCalledWith("productos");
  });
});
