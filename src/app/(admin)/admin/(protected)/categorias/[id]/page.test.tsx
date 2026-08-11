import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockCategory = {
  id: "cat-1",
  name: "Piñatas",
  slug: "pinatas",
  sort_order: 0,
  cover_image_url: null,
  animation_theme: "carnaval",
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockCategory }),
        }),
      }),
    }),
  }),
}));

vi.mock("../actions", () => ({
  updateCategory: vi.fn(),
}));

vi.mock("../cover-upload", () => ({
  CoverUpload: () => null,
}));

vi.mock("@/lib/theme-settings", () => ({
  getAllThemeMotionSettings: vi.fn().mockResolvedValue({}),
  DEFAULT_MOTION_SETTINGS: {
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  },
}));

describe("EditarCategoriaPage", () => {
  it("pre-selects the category's current animation_theme", async () => {
    const EditarCategoriaPage = (await import("./page")).default;
    const ui = await EditarCategoriaPage({ params: Promise.resolve({ id: "cat-1" }) });
    render(ui);

    const select = screen.getByLabelText(/tema de animación/i) as HTMLSelectElement;
    expect(select.value).toBe("carnaval");
  });

  it("pre-selects 'Usar tema del sitio' when animation_theme is null", async () => {
    const nullThemeCategory = { ...mockCategory, animation_theme: null };
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: nullThemeCategory }),
          }),
        }),
      }),
    } as never);

    const EditarCategoriaPage = (await import("./page")).default;
    const ui = await EditarCategoriaPage({ params: Promise.resolve({ id: "cat-1" }) });
    render(ui);

    const select = screen.getByLabelText(/tema de animación/i) as HTMLSelectElement;
    expect(select.value).toBe("");
  });
});
