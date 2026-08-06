import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the headline, both CTAs, the emblem, and the verified data line", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ver catálogo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pedir por whatsapp/i })).toBeInTheDocument();
    expect(screen.getByAltText("Crazy Hour")).toHaveAttribute(
      "src",
      expect.stringContaining("logo-emblema.jpeg")
    );
    expect(screen.getByText(/catálogo renovado cada 15 días/i)).toBeInTheDocument();
  });

  it("both CTAs are inert (no href, no onClick wiring beyond default button behavior)", () => {
    render(<Hero />);
    const catalogCta = screen.getByRole("button", { name: /ver catálogo/i });
    const whatsappCta = screen.getByRole("button", { name: /pedir por whatsapp/i });
    expect(catalogCta).toHaveAttribute("type", "button");
    expect(whatsappCta).toHaveAttribute("type", "button");
  });
});
