import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// dal.ts (imported transitively via theme-editor-client -> actions.ts)
// imports "server-only", which throws when loaded outside a real Next.js
// server render (same fix as settings.test.ts/dal.test.ts).
vi.mock("server-only", () => ({}));

const mockRequireFullAdmin = vi.fn().mockResolvedValue({ userId: "u1", email: "admin@crazyhour.co", role: "full" });
vi.mock("@/lib/supabase/dal", () => ({
  requireFullAdmin: () => mockRequireFullAdmin(),
}));

const mockSettings = {
  particleCount: 12, minDuration: 10, maxDuration: 20,
  minSize: 16, maxSize: 28, maxOpacity: 0.25, customCss: null,
};

vi.mock("@/lib/theme-settings", () => ({
  getThemeMotionSettings: vi.fn().mockResolvedValue(mockSettings),
}));

const mockNotFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

describe("Animaciones editor page", () => {
  it("renders the editor for a valid theme", async () => {
    const AnimacionEditorPage = (await import("./page")).default;
    const ui = await AnimacionEditorPage({ params: Promise.resolve({ theme: "carnaval" }) });
    render(ui);

    expect(screen.getByLabelText(/cantidad de partículas/i)).toHaveValue("12");
  });

  it("calls notFound() for an invalid theme value", async () => {
    const AnimacionEditorPage = (await import("./page")).default;

    await expect(
      AnimacionEditorPage({ params: Promise.resolve({ theme: "not-a-theme" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("calls notFound() for 'none' (not a real editable theme)", async () => {
    const AnimacionEditorPage = (await import("./page")).default;

    await expect(
      AnimacionEditorPage({ params: Promise.resolve({ theme: "none" }) }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("redirects non-full admins away", async () => {
    mockRequireFullAdmin.mockRejectedValueOnce(new Error("REDIRECT:/admin/pedidos"));
    const AnimacionEditorPage = (await import("./page")).default;

    await expect(
      AnimacionEditorPage({ params: Promise.resolve({ theme: "carnaval" }) }),
    ).rejects.toThrow("REDIRECT:/admin/pedidos");
  });
});
