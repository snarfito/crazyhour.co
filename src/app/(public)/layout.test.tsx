import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/settings", () => ({
  getWhatsAppNumber: vi.fn().mockResolvedValue("573000000000"),
}));

describe("public layout", () => {
  it("applies the dark theme class, renders the wordmark logo, and a sticky header", async () => {
    const PublicLayout = (await import("./layout")).default;
    const ui = await PublicLayout({ children: <p>contenido</p> });
    render(ui);

    const root = screen.getByTestId("public-theme-root");
    expect(root).toHaveClass("theme-dark");
    expect(screen.getByAltText("Crazy Hour")).toHaveAttribute("src", expect.stringContaining("logo.webp"));
    expect(screen.getByRole("banner")).toHaveClass("sticky");
  });

  it("renders a real, working WhatsApp link built from the configured number", async () => {
    const PublicLayout = (await import("./layout")).default;
    const ui = await PublicLayout({ children: <p>contenido</p> });
    render(ui);

    const link = screen.getByRole("link", { name: /pedir por whatsapp/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/573000000000"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders the cart icon linking to /carrito", async () => {
    const PublicLayout = (await import("./layout")).default;
    const ui = await PublicLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByRole("link", { name: /carrito/i })).toHaveAttribute("href", "/carrito");
  });

  it("wraps the logo in a link to the homepage", async () => {
    const PublicLayout = (await import("./layout")).default;
    const ui = await PublicLayout({ children: <p>contenido</p> });
    render(ui);

    const logo = screen.getByAltText("Crazy Hour");
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders the footer with the brand name", async () => {
    const PublicLayout = (await import("./layout")).default;
    const ui = await PublicLayout({ children: <p>contenido</p> });
    render(ui);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
