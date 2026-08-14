import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase2pgcat_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Category page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    // Products no longer FK to a single category, so they're scoped by
    // their own prefixed name now, not by a prefixed category_id lookup.
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
    mockNotFound.mockClear();
  });

  it("renders only active products for that category, preferring enhanced_url", async () => {
    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();

    const { data: activeProduct } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Piñata estrella`, description: "x", unit_price_cop: 45000, is_active: true })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: activeProduct!.id, category_id: category!.id });
    await admin.from("product_images").insert({
      product_id: activeProduct!.id,
      original_url: "https://example.com/original.jpg",
      enhanced_url: "https://example.com/enhanced.jpg",
    });

    const { data: inactiveProduct } = await admin
      .from("products")
      .insert({ name: `${TEST_PREFIX}Producto inactivo`, description: "x", unit_price_cop: 1000, is_active: false })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: inactiveProduct!.id, category_id: category!.id });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}pinatas` }) });
    render(ui);

    expect(screen.getByText(`${TEST_PREFIX}Piñata estrella`)).toBeInTheDocument();
    expect(screen.queryByText(`${TEST_PREFIX}Producto inactivo`)).not.toBeInTheDocument();
    expect(screen.getByAltText("")).toHaveAttribute("src", expect.stringContaining("enhanced.jpg"));
  });

  it("shows the nuevo badge only for products created in the last 15 days", async () => {
    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();

    const now = new Date();
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recent } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Producto reciente`,
        description: "x",
        unit_price_cop: 10000,
        is_active: true,
        created_at: now.toISOString(),
      })
      .select()
      .single();
    const { data: old } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Producto antiguo`,
        description: "x",
        unit_price_cop: 10000,
        is_active: true,
        created_at: twentyDaysAgo,
      })
      .select()
      .single();
    await admin.from("product_categories").insert([
      { product_id: recent!.id, category_id: category!.id },
      { product_id: old!.id, category_id: category!.id },
    ]);

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}pinatas` }) });
    render(ui);

    expect(screen.getAllByText("¡nuevo!")).toHaveLength(1);
  });

  it("shows the empty state when the category has no active products", async () => {
    await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Vacia`, slug: `${TEST_PREFIX}vacia`, sort_order: 1 });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}vacia` }) });
    render(ui);

    expect(screen.getByText(/no hay productos/i)).toBeInTheDocument();
  });

  it("calls notFound() for a slug that doesn't exist", async () => {
    const CategoryPage = (await import("./page")).default;

    await expect(
      CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}no-existe` }) })
    ).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("uses the category's own animation_theme, overriding whatever the site-wide theme is", async () => {
    await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Grados`, slug: `${TEST_PREFIX}grados`, sort_order: 1, animation_theme: "grados" });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}grados` }) });
    const { container } = render(ui);

    expect(container.querySelectorAll(".event-particle")).toHaveLength(8);
  });

  it("renders no particles when animation_theme is explicitly 'none', even if a site-wide theme is active", async () => {
    await admin.from("settings").update({ active_event_theme: "navidad" }).eq("id", true);
    await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}SinAnimacion`, slug: `${TEST_PREFIX}sin-animacion`, sort_order: 1, animation_theme: "none" });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}sin-animacion` }) });
    const { container } = render(ui);

    expect(container.querySelectorAll(".event-particle")).toHaveLength(0);

    await admin.from("settings").update({ active_event_theme: "none" }).eq("id", true);
  });

  it("renders a breadcrumb, the category description and banner, and the WhatsApp CTA", async () => {
    await admin.from("categories").insert({
      name: `${TEST_PREFIX}Halloween`,
      slug: `${TEST_PREFIX}halloween`,
      sort_order: 1,
      description: "Calabazas, telarañas y naranja por todas partes.",
      cover_image_url: "https://example.com/banner.jpg",
    });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}halloween` }) });
    render(ui);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Calabazas, telarañas y naranja por todas partes.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /escribir por whatsapp/i })).toBeInTheDocument();
  });

  it("still shows the breadcrumb and WhatsApp CTA when the category has no products", async () => {
    await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Vacia2`, slug: `${TEST_PREFIX}vacia2`, sort_order: 1 });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}vacia2` }) });
    render(ui);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /escribir por whatsapp/i })).toBeInTheDocument();
  });

  it("shows a product on every category it's linked to, not just the first", async () => {
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
      .insert({ name: `${TEST_PREFIX}Globo piñata`, description: "x", unit_price_cop: 15000, is_active: true })
      .select()
      .single();
    await admin.from("product_categories").insert([
      { product_id: product!.id, category_id: catA!.id },
      { product_id: product!.id, category_id: catB!.id },
    ]);

    const CategoryPage = (await import("./page")).default;

    const uiA = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}pinatas` }) });
    const { unmount } = render(uiA);
    expect(screen.getByText(`${TEST_PREFIX}Globo piñata`)).toBeInTheDocument();
    unmount();

    const uiB = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}globos` }) });
    render(uiB);
    expect(screen.getByText(`${TEST_PREFIX}Globo piñata`)).toBeInTheDocument();
  });
});
