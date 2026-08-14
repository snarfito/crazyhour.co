import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase2prodlist_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/productos",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Admin products list page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
  });

  it("lists a product linked to 2 categories only once, showing both category names", async () => {
    const { data: catA } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    const { data: catB } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Globos`, slug: `${TEST_PREFIX}globos`, sort_order: 2 })
      .select()
      .single();
    const { data: product } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Globo piñata`, unit_price_cop: 15000, is_active: true })
      .select()
      .single();
    await admin.from("product_categories").insert([
      { product_id: product!.id, category_id: catA!.id },
      { product_id: product!.id, category_id: catB!.id },
    ]);

    const ProductosPage = (await import("./page")).default;
    const ui = await ProductosPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getAllByText(`${TEST_PREFIX}Globo piñata`)).toHaveLength(1);
    expect(screen.getByText(`${TEST_PREFIX}Piñatas, ${TEST_PREFIX}Globos`)).toBeInTheDocument();
  });

  it("filters the list to only products linked to the selected category", async () => {
    const { data: catA } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    const { data: catB } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Globos`, slug: `${TEST_PREFIX}globos`, sort_order: 2 })
      .select()
      .single();
    const { data: inA } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Solo piñatas`, unit_price_cop: 10000, is_active: true })
      .select()
      .single();
    const { data: inB } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Solo globos`, unit_price_cop: 5000, is_active: true })
      .select()
      .single();
    await admin.from("product_categories").insert([
      { product_id: inA!.id, category_id: catA!.id },
      { product_id: inB!.id, category_id: catB!.id },
    ]);

    const ProductosPage = (await import("./page")).default;
    const ui = await ProductosPage({ searchParams: Promise.resolve({ categoria: catA!.id }) });
    render(ui);

    expect(screen.getByText(`${TEST_PREFIX}Solo piñatas`)).toBeInTheDocument();
    expect(screen.queryByText(`${TEST_PREFIX}Solo globos`)).not.toBeInTheDocument();
  });

  it("links to the quick editor", async () => {
    const ProductosPage = (await import("./page")).default;
    const ui = await ProductosPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByRole("link", { name: /editor rápido/i })).toHaveAttribute(
      "href",
      "/admin/productos/editor",
    );
  });
});
