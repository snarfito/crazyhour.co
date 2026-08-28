import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    const hasBadgeText = (node: Element | null) => /catálogo renovado cada\s+15 días/i.test(node?.textContent ?? "");
    expect(
      screen.getByText(
        (_, el) => hasBadgeText(el) && Array.from(el?.children ?? []).every((child) => !hasBadgeText(child))
      )
    ).toBeInTheDocument();
  });

  it("renders decorative neon ornaments around the hero, hidden from assistive tech", () => {
    const { container } = render(<Hero whatsappUrl={WHATSAPP_URL} />);
    const ornaments = container.querySelectorAll("[data-hero-ornament]");
    expect(ornaments.length).toBeGreaterThan(0);
    ornaments.forEach((el) => expect(el).toHaveAttribute("aria-hidden", "true"));
  });

  it("gives the headline a neon glow, matching the client-approved neon direction", () => {
    render(<Hero whatsappUrl={WHATSAPP_URL} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-glow");
  });

  it("renders the emblem before the headline in markup order, for mobile-first stacking", () => {
    const { container } = render(<Hero whatsappUrl={WHATSAPP_URL} />);
    const emblemImg = container.querySelector('img[src*="logo-emblema"]');
    const heading = screen.getByRole("heading", { level: 1 });
    expect(emblemImg!.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not show the tap-to-spin hint text", () => {
    render(<Hero whatsappUrl={WHATSAPP_URL} />);
    expect(screen.queryByText(/toca el logo para girarlo/i)).not.toBeInTheDocument();
  });

  it("spins the emblem when tapped", () => {
    const { container } = render(<Hero whatsappUrl={WHATSAPP_URL} />);
    const emblemImg = container.querySelector('img[src*="logo-emblema"]')!;
    const trigger = screen.getByRole("button", { name: /girar el logo/i });

    expect(emblemImg).toHaveAttribute("data-spin", "false");
    fireEvent.click(trigger);
    expect(emblemImg).toHaveAttribute("data-spin", "true");
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
