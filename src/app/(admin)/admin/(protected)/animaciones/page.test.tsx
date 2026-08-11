import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnimacionesPage from "./page";

describe("AnimacionesPage", () => {
  it("lists all 12 themes, each linking to its own editor", () => {
    render(<AnimacionesPage />);

    expect(screen.getByRole("link", { name: "Navidad" })).toHaveAttribute("href", "/admin/animaciones/navidad");
    expect(screen.getByRole("link", { name: "Carnaval" })).toHaveAttribute("href", "/admin/animaciones/carnaval");
    expect(screen.getAllByRole("link")).toHaveLength(12);
  });
});
