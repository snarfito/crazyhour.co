import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { likePattern } from "@/test/db-prefix";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
// Falls back to a placeholder when unset so `describe.skipIf` below can skip
// cleanly: the describe callback (including `createServiceClient(...)` at
// its top) still runs during Vitest's collection phase even when the suite
// is skipped, and `createServiceClient` throws immediately on an
// empty/undefined key regardless of whether any test actually runs.
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || "placeholder-key-suite-is-skipped";
const TEST_PREFIX = "zzfase2home_";
// See src/test/db-prefix.ts for why LIKE-escaping is required here (and
// for the full explanation of the bug categorias/actions.test.ts hit).
const TEST_PREFIX_LIKE = likePattern(TEST_PREFIX);

// The "no categories" case below can't be exercised by seeding the real
// `categories` table and asserting it's empty: every other DB-integration
// test in this suite only ever touches rows matching its own prefix (see
// productos/actions.test.ts and categorias/actions.test.ts), and files run
// concurrently (fileParallelism is on), so `categories` is routinely
// non-empty for reasons unrelated to this test. `forceEmpty` lets that one
// test swap in a client that returns an empty result set without touching
// Postgres, while the "renders a category card" test still exercises the
// real query/ordering/wiring against local Supabase.
let forceEmpty = false;
const emptyClient = {
  from: () => ({
    select: () => ({
      order: async () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
    }),
  }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    forceEmpty ? emptyClient : createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("none"),
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

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Home page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    forceEmpty = false;
    await admin.from("products").delete().like("name", TEST_PREFIX_LIKE);
    await admin.from("categories").delete().like("slug", TEST_PREFIX_LIKE);
  });

  it("renders a category card for each category, ordered by sort_order", async () => {
    await admin.from("categories").insert([
      { name: `${TEST_PREFIX}Globos`, slug: `${TEST_PREFIX}globos`, sort_order: 2 },
      { name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 },
    ]);

    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    const links = screen.getAllByRole("link");
    const prefixedLinks = links.filter((l) => l.getAttribute("href")?.startsWith(`/${TEST_PREFIX}`));
    expect(prefixedLinks).toHaveLength(2);
    expect(prefixedLinks[0]).toHaveAttribute("href", `/${TEST_PREFIX}pinatas`);
    expect(prefixedLinks[1]).toHaveAttribute("href", `/${TEST_PREFIX}globos`);
  });

  it("shows the empty state when there are no categories", async () => {
    forceEmpty = true;

    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    expect(screen.getByText(/armando el catálogo/i)).toBeInTheDocument();
  });

  it("shows the product count for each category, counting only active products", async () => {
    const { data: category } = await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Piñatas`, slug: `${TEST_PREFIX}pinatas`, sort_order: 1 })
      .select()
      .single();
    const { data: products } = await admin
      .from("products")
      .insert([
        { name: `${TEST_PREFIX}A`, description: "x", unit_price_cop: 1000, is_active: true },
        { name: `${TEST_PREFIX}B`, description: "x", unit_price_cop: 1000, is_active: true },
        { name: `${TEST_PREFIX}C`, description: "x", unit_price_cop: 1000, is_active: false },
      ])
      .select();
    await admin
      .from("product_categories")
      .insert((products ?? []).map((p) => ({ product_id: p.id, category_id: category!.id })));

    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    // Scoped to this test's own card via its href — plain getByText("2
    // productos") would risk colliding with another category's badge from a
    // concurrently-running test file (same risk class as the "renders a
    // category card" test above, which scopes via prefixedLinks for the
    // same reason).
    const link = screen.getAllByRole("link").find((l) => l.getAttribute("href") === `/${TEST_PREFIX}pinatas`);
    expect(link).toBeDefined();
    expect(within(link!).getByText("2 productos")).toBeInTheDocument();
  });

  it("renders the featured category strip only for the category flagged is_featured", async () => {
    // Both rows list the same keys explicitly: PostgREST's bulk insert sends
    // an explicit NULL (not the column default) for any key missing on some
    // row in the batch, which would otherwise violate categories.is_featured
    // NOT NULL on the row that omits it.
    await admin.from("categories").insert([
      { name: `${TEST_PREFIX}Normal`, slug: `${TEST_PREFIX}normal`, sort_order: 1, is_featured: false, description: null },
      {
        name: `${TEST_PREFIX}Hora Loca`,
        slug: `${TEST_PREFIX}hora-loca`,
        sort_order: 2,
        is_featured: true,
        description: "La fiesta no para.",
      },
    ]);

    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    expect(screen.getByRole("link", { name: /ver.*hora loca/i })).toHaveAttribute(
      "href",
      `/${TEST_PREFIX}hora-loca`
    );
  });

  it("omits the featured strip when no category is flagged", async () => {
    await admin
      .from("categories")
      .insert({ name: `${TEST_PREFIX}Normal`, slug: `${TEST_PREFIX}normal`, sort_order: 1 });

    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    // Hero always renders its own "Ver catálogo →" CTA (see hero.tsx) — the
    // assertion is that no *additional* "Ver X →" link (the featured-strip
    // CTA) appears alongside it.
    const verLinks = screen.getAllByRole("link", { name: /^Ver /i });
    expect(verLinks).toHaveLength(1);
    expect(verLinks[0]).toHaveTextContent("Ver catálogo");
  });

  it("always renders the how-it-works section, even with no categories", async () => {
    forceEmpty = true;

    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    expect(screen.getByText("Miras el catálogo")).toBeInTheDocument();
  });
});
