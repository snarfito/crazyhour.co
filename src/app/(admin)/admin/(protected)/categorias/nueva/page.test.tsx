import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../actions", () => ({
  createCategory: vi.fn(),
}));

vi.mock("@/lib/theme-settings", () => ({
  getAllThemeMotionSettings: vi.fn().mockResolvedValue({}),
  DEFAULT_MOTION_SETTINGS: {
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  },
}));

describe("NuevaCategoriaPage", () => {
  it("defaults the theme selector to 'Usar tema del sitio'", async () => {
    const NuevaCategoriaPage = (await import("./page")).default;
    render(await NuevaCategoriaPage());

    const select = screen.getByLabelText(/tema de animación/i) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByText("Usar tema del sitio")).toBeInTheDocument();
  });
});
