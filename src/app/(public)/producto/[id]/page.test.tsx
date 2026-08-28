import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";
import { CartProvider } from "@/components/cart/cart-context";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase2pgprod_";
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("none"),
  getWhatsAppNumber: vi.fn().mockResolvedValue("573000000000"),
}));

vi.mock("@/lib/theme-settings", () => ({
  DEFAULT_MOTION_SETTINGS: {
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  },
  getThemeMotionSettings: vi.fn().mockResolvedValue({
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  }),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Product page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let categoryId: string;

  beforeEach(async () => {
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
    mockNotFound.mockClear();

    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    categoryId = category!.id;
  });

  it("renders the product's name, unit price, and description", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Piñata estrella`,
        description: "Piñata artesanal grande",
        unit_price_cop: 45000,
        is_active: true,
      })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: product!.id, category_id: categoryId });
    await admin.from("product_images").insert({
      product_id: product!.id,
      original_url: "https://example.com/original.jpg",
      enhanced_url: "https://example.com/enhanced.jpg",
    });

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: product!.id }) });
    render(<CartProvider>{ui}</CartProvider>);

    expect(screen.getByRole("heading", { name: `${TEST_PREFIX}Piñata estrella` })).toBeInTheDocument();
    expect(screen.getByText(/\$ 45\.000\s*c\/u/)).toBeInTheDocument();
    expect(screen.getByText("Piñata artesanal grande")).toBeInTheDocument();
    expect(screen.getByText("Agregar al carrito")).toBeInTheDocument();
  });

  it("shows the media-paca and paca-completa tiers when present", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Globo por mayor`,
        description: "x",
        unit_price_cop: 4000,
        pack1_qty: 10,
        pack1_price_cop: 3000,
        pack2_qty: 5,
        pack2_price_cop: 3500,
        is_active: true,
      })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: product!.id, category_id: categoryId });

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: product!.id }) });
    render(<CartProvider>{ui}</CartProvider>);

    expect(screen.getByText(/Media paca \(5 un\.\).*\$ 3\.500/)).toBeInTheDocument();
    expect(screen.getByText(/Paca completa \(10 un\.\).*\$ 3\.000/)).toBeInTheDocument();
  });

  it("omits pack tiers that don't exist for the product", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Producto suelto`,
        description: "x",
        unit_price_cop: 4000,
        is_active: true,
      })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: product!.id, category_id: categoryId });

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: product!.id }) });
    render(<CartProvider>{ui}</CartProvider>);

    expect(screen.queryByText(/Media paca/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Paca completa/)).not.toBeInTheDocument();
  });

  it("calls notFound() for an inactive product", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Producto inactivo`,
        description: "x",
        unit_price_cop: 1000,
        is_active: false,
      })
      .select()
      .single();

    const ProductPage = (await import("./page")).default;

    await expect(
      ProductPage({ params: Promise.resolve({ id: product!.id }) })
    ).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("calls notFound() for an id that doesn't exist", async () => {
    const ProductPage = (await import("./page")).default;

    await expect(
      ProductPage({ params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }) })
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renders a breadcrumb with the (first linked) category and product name", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Piñata estrella`,
        description: "x",
        unit_price_cop: 45000,
        is_active: true,
      })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: product!.id, category_id: categoryId });

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: product!.id }) });
    render(<CartProvider>{ui}</CartProvider>);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: `${TEST_PREFIX}Piñatas` })).toHaveAttribute(
      "href",
      `/${TEST_PREFIX}pinatas`
    );
    expect(screen.getByText(`${TEST_PREFIX}Piñata estrella`, { selector: "span[aria-current='page']" })).toBeInTheDocument();
  });

  it("shows up to 3 other active products sharing a category, excluding itself", async () => {
    const { data: main } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Piñata estrella`,
        description: "x",
        unit_price_cop: 45000,
        is_active: true,
      })
      .select()
      .single();
    const { data: others } = await admin
      .from("products")
      .insert([
        { name: `${TEST_PREFIX}Piñata luna`, description: "x", unit_price_cop: 30000, is_active: true },
        { name: `${TEST_PREFIX}Piñata sol`, description: "x", unit_price_cop: 30000, is_active: true },
        { name: `${TEST_PREFIX}Piñata inactiva`, description: "x", unit_price_cop: 30000, is_active: false },
      ])
      .select();
    await admin.from("product_categories").insert([
      { product_id: main!.id, category_id: categoryId },
      ...(others ?? []).map((p) => ({ product_id: p.id, category_id: categoryId })),
    ]);

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: main!.id }) });
    render(<CartProvider>{ui}</CartProvider>);

    expect(screen.getByText(`${TEST_PREFIX}Piñata luna`)).toBeInTheDocument();
    expect(screen.getByText(`${TEST_PREFIX}Piñata sol`)).toBeInTheDocument();
    expect(screen.queryByText(`${TEST_PREFIX}Piñata inactiva`)).not.toBeInTheDocument();
    // The product itself appears twice on a correct render — breadcrumb's
    // current-page item + the <h1> title — a 3rd occurrence would mean it
    // leaked into the related-products grid too.
    expect(screen.getAllByText(`${TEST_PREFIX}Piñata estrella`)).toHaveLength(2);
  });

  it("omits the related-products section when there are no other products sharing a category", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        name: `${TEST_PREFIX}Piñata única`,
        description: "x",
        unit_price_cop: 45000,
        is_active: true,
      })
      .select()
      .single();
    await admin.from("product_categories").insert({ product_id: product!.id, category_id: categoryId });

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: product!.id }) });
    render(<CartProvider>{ui}</CartProvider>);

    expect(screen.queryByRole("heading", { name: /también te puede servir/i })).not.toBeInTheDocument();
  });
});
