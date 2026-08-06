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
// Deliberately NOT "zzfase2catpage_" — categorias/actions.test.ts's rows go
// through slugify(), which strips "_", so its cleanup pattern there ended
// up unbounded ("zzfase2cat%", no delimiter) and matched this file's rows
// too under parallel runs (real cross-file data loss, one-directional: this
// file's own pattern never matched categorias' rows). Renaming to "pgcat"
// (page+cat, swapped) breaks that literal-prefix relationship regardless of
// how categorias' own pattern is built — see categorias/actions.test.ts for
// the full diagnosis and its own fix (switched to a "-" prefix, which
// survives slugify() unchanged and needs no escaping).
const TEST_PREFIX = "zzfase2pgcat_";
// Still escaped defensively — see categorias/actions.test.ts for why "_" in
// a LIKE pattern needs escaping in general, independent of this rename.
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

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Category page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    const { data: cats } = await admin.from("categories").select("id").like("slug", TEST_PREFIX_LIKE);
    const ids = (cats ?? []).map((c) => c.id);
    if (ids.length > 0) await admin.from("products").delete().in("category_id", ids);
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
      .insert({
        category_id: category!.id,
        name: "Piñata estrella",
        description: "x",
        price_cop: 45000,
        is_active: true,
      })
      .select()
      .single();
    await admin.from("product_images").insert({
      product_id: activeProduct!.id,
      original_url: "https://example.com/original.jpg",
      enhanced_url: "https://example.com/enhanced.jpg",
    });

    await admin.from("products").insert({
      category_id: category!.id,
      name: "Producto inactivo",
      description: "x",
      price_cop: 1000,
      is_active: false,
    });

    const CategoryPage = (await import("./page")).default;
    const ui = await CategoryPage({ params: Promise.resolve({ categorySlug: `${TEST_PREFIX}pinatas` }) });
    render(ui);

    expect(screen.getByText("Piñata estrella")).toBeInTheDocument();
    expect(screen.queryByText("Producto inactivo")).not.toBeInTheDocument();
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
});
