import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
// Falls back to a placeholder when unset so `describe.skipIf` below can skip
// cleanly: the describe callback (including `createServiceClient(...)` at
// its top) still runs during Vitest's collection phase even when the suite
// is skipped, and `createServiceClient` throws immediately on an
// empty/undefined key regardless of whether any test actually runs.
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
// Named "pgprod" (page+prod, swapped) rather than "prodpage" purely as
// defensive hygiene against future prefix additions that might share a
// literal-string root — productos/actions.test.ts's own escaped pattern
// (`zzfase2prod\_%`) already keeps its delimiter, so it was never actually
// at risk of matching "zzfase2prodpage_..." rows either way (see
// categorias/actions.test.ts for the LIKE-wildcard bug this file's own
// escaping below guards against, and for the one prefix pair — categorias
// vs. the category-page test — where a rename actually was required).
const TEST_PREFIX = "zzfase2pgprod_";
const TEST_PREFIX_LIKE = `${TEST_PREFIX.replace(/_/g, "\\_")}%`;

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Product page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);
  let categoryId: string;

  beforeEach(async () => {
    const { data: cats } = await admin.from("categories").select("id").like("slug", TEST_PREFIX_LIKE);
    const ids = (cats ?? []).map((c) => c.id);
    if (ids.length > 0) await admin.from("products").delete().in("category_id", ids);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
    mockNotFound.mockClear();

    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    categoryId = category!.id;
  });

  it("renders the product's name, formatted price, and description", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        category_id: categoryId,
        name: "Piñata estrella",
        description: "Piñata artesanal grande",
        price_cop: 45000,
        is_active: true,
      })
      .select()
      .single();
    // Give the product a real image so ImageGallery renders it instead of
    // falling back to BrandPlaceholder — the placeholder renders the
    // product name as visible text too, which would collide with the <h1>
    // below under getByText's exact-match (see Task 9's category page test,
    // which avoids the same collision the same way).
    await admin.from("product_images").insert({
      product_id: product!.id,
      original_url: "https://example.com/original.jpg",
      enhanced_url: "https://example.com/enhanced.jpg",
    });

    const ProductPage = (await import("./page")).default;
    const ui = await ProductPage({ params: Promise.resolve({ id: product!.id }) });
    render(ui);

    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.getByText("$ 45.000")).toBeInTheDocument();
    expect(screen.getByText("Piñata artesanal grande")).toBeInTheDocument();
    expect(screen.getByText("Agregar al carrito")).toBeInTheDocument();
  });

  it("calls notFound() for an inactive product", async () => {
    const { data: product } = await admin
      .from("products")
      .insert({
        category_id: categoryId,
        name: "Producto inactivo",
        description: "x",
        price_cop: 1000,
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
});
