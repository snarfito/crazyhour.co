import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!;

// verifySession() normally redirects unauthenticated users — for these
// tests we mock it to simulate an authenticated admin, since exercising
// the real login flow here would test Task 4, not this task.
vi.mock("@/lib/supabase/dal", () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: "test-admin", email: "test@crazyhour.co" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY),
}));

// revalidatePath() requires Next's request-scoped work store, which doesn't
// exist when a "use server" action is invoked directly from a Vitest test
// (outside the Next.js server runtime) — it throws "Invariant: static
// generation store missing" otherwise. Mocked for the same reason dal/server
// are mocked above: this test exercises the DB logic, not Next's cache layer.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("category actions (against local Supabase)", () => {
  const admin = createServiceClient(TEST_SUPABASE_URL, TEST_SERVICE_ROLE_KEY);

  beforeEach(async () => {
    await admin.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  });

  it("createCategory inserts a row with an auto-generated slug", async () => {
    const { createCategory } = await import("./actions");
    const formData = new FormData();
    formData.set("name", "Hora Loca");
    formData.set("sort_order", "1");

    await createCategory(formData);

    const { data } = await admin.from("categories").select("*").single();
    expect(data?.name).toBe("Hora Loca");
    expect(data?.slug).toBe("hora-loca");
  });

  it("createCategory rejects a duplicate slug", async () => {
    const { createCategory } = await import("./actions");
    const first = new FormData();
    first.set("name", "Globos");
    first.set("sort_order", "1");
    await createCategory(first);

    const duplicate = new FormData();
    duplicate.set("name", "Globos");
    duplicate.set("sort_order", "2");

    await expect(createCategory(duplicate)).rejects.toThrow(/slug/i);
  });

  it("updateCategory changes name and slug", async () => {
    const { createCategory, updateCategory } = await import("./actions");
    const create = new FormData();
    create.set("name", "Decoracion");
    create.set("sort_order", "1");
    await createCategory(create);
    const { data: created } = await admin.from("categories").select("id").single();

    const update = new FormData();
    update.set("name", "Decoración");
    update.set("slug", "decoracion-fiestas");
    update.set("sort_order", "2");
    await updateCategory(created!.id, update);

    const { data: updated } = await admin
      .from("categories")
      .select("*")
      .eq("id", created!.id)
      .single();
    expect(updated?.name).toBe("Decoración");
    expect(updated?.slug).toBe("decoracion-fiestas");
  });

  it("deleteCategory removes the row", async () => {
    const { createCategory, deleteCategory } = await import("./actions");
    const create = new FormData();
    create.set("name", "Recordatorios");
    create.set("sort_order", "1");
    await createCategory(create);
    const { data: created } = await admin.from("categories").select("id").single();

    await deleteCategory(created!.id);

    const { data: remaining } = await admin.from("categories").select("*");
    expect(remaining).toHaveLength(0);
  });
});
