import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
});
