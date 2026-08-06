import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) }),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    forceEmpty ? emptyClient : createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Home page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    forceEmpty = false;
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
});
