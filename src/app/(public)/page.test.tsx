import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!;
const TEST_PREFIX = "zzfase2home_";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

describe.skipIf(!process.env.SUPABASE_TEST_SERVICE_ROLE_KEY)("Home page", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("categories").delete().like("slug", `${TEST_PREFIX}%`);
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
    const HomePage = (await import("./page")).default;
    const ui = await HomePage();
    render(ui);

    expect(screen.getByText(/armando el catálogo/i)).toBeInTheDocument();
  });
});
