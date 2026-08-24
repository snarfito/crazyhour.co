import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./hero";

const WHATSAPP_URL = "https://wa.me/573000000000?text=Hola";

describe("Hero", () => {
  it("renders the headline, both CTAs, the emblem, and the verified data line", () => {
    const { container } = render(<Hero whatsappUrl={WHATSAPP_URL} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver catálogo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pedir por whatsapp/i })).toBeInTheDocument();
    const emblemImg = container.querySelector('img[src*="logo-emblema"]');
    expect(emblemImg).toHaveAttribute("alt", "");
    expect(screen.getByText(/catálogo renovado cada 15 días/i)).toBeInTheDocument();
  });

  it("the catalog CTA anchors to the grid and the WhatsApp CTA opens WhatsApp", () => {
    render(<Hero whatsappUrl={WHATSAPP_URL} />);
    const catalogCta = screen.getByRole("link", { name: /ver catálogo/i });
    const whatsappCta = screen.getByRole("link", { name: /pedir por whatsapp/i });
    expect(catalogCta).toHaveAttribute("href", "#catalogo");
    expect(whatsappCta).toHaveAttribute("href", WHATSAPP_URL);
    expect(whatsappCta).toHaveAttribute("target", "_blank");
  });
});
