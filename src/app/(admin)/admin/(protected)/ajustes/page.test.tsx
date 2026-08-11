import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getSettings } from "@/lib/settings";

vi.mock("@/lib/settings", () => ({
  getSettings: vi.fn().mockResolvedValue({
    whatsappNumber: "573000000000",
    contactEmail: "hola@crazyhour.co",
    contactPhone: "3000000000",
    activeEventTheme: "halloween",
  }),
}));

vi.mock("./actions", () => ({
  updateSettings: vi.fn(),
}));

describe("AjustesPage", () => {
  it("lists Ninguno plus every registered theme, in Spanish", async () => {
    const AjustesPage = (await import("./page")).default;
    render(await AjustesPage());

    const select = screen.getByLabelText(/tema de animación/i);
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["Ninguno", "Navidad", "Amor y Amistad", "Halloween", "Hora Loca"]);
  });

  it("pre-selects the currently active theme", async () => {
    const AjustesPage = (await import("./page")).default;
    render(await AjustesPage());

    const select = screen.getByLabelText(/tema de animación/i) as HTMLSelectElement;
    expect(select.value).toBe("halloween");
  });

  it("reflects a newly-saved theme after a re-render without a full remount (reproduces the reported bug: saving updates the DB, but the <select> kept showing the old value until a hard reload)", async () => {
    const AjustesPage = (await import("./page")).default;
    const { rerender } = render(await AjustesPage());

    // Simulate the post-save server refresh: the server now returns the new
    // theme, and Next reconciles the updated JSX into the same mounted tree
    // — it does not remount the page from scratch. render()+rerender() on
    // an already-resolved element tree reproduces that exact reconciliation
    // step without needing a real browser/server-action round trip.
    vi.mocked(getSettings).mockResolvedValueOnce({
      whatsappNumber: "573000000000",
      contactEmail: "hola@crazyhour.co",
      contactPhone: "3000000000",
      activeEventTheme: "hora_loca",
    });
    rerender(await AjustesPage());

    const select = screen.getByLabelText(/tema de animación/i) as HTMLSelectElement;
    expect(select.value).toBe("hora_loca");
  });
});
