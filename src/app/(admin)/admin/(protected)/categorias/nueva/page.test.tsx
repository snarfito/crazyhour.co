import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../actions", () => ({
  createCategory: vi.fn(),
}));

describe("NuevaCategoriaPage", () => {
  it("defaults the theme selector to 'Usar tema del sitio'", async () => {
    const NuevaCategoriaPage = (await import("./page")).default;
    render(NuevaCategoriaPage());

    const select = screen.getByLabelText(/tema de animación/i) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByText("Usar tema del sitio")).toBeInTheDocument();
  });
});
