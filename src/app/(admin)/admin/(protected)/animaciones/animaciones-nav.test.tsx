import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimacionesNav } from "./animaciones-nav";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const themes = [
  { theme: "navidad" as const, label: "Navidad" },
  { theme: "carnaval" as const, label: "Carnaval" },
];

describe("AnimacionesNav", () => {
  it("marks the theme matching the current path as active", () => {
    mockUsePathname.mockReturnValue("/admin/animaciones/carnaval");
    render(<AnimacionesNav themes={themes} />);

    expect(screen.getByRole("link", { name: "Carnaval" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Navidad" })).not.toHaveAttribute("aria-current");
  });

  it("marks nothing active when on the index page", () => {
    mockUsePathname.mockReturnValue("/admin/animaciones");
    render(<AnimacionesNav themes={themes} />);

    expect(screen.getByRole("link", { name: "Navidad" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Carnaval" })).not.toHaveAttribute("aria-current");
  });
});
