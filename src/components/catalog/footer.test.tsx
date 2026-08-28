import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

describe("Footer", () => {
  const originalTiktok = process.env.NEXT_PUBLIC_TIKTOK_URL;
  const originalMl = process.env.NEXT_PUBLIC_MERCADOLIBRE_URL;
  const originalIg = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_TIKTOK_URL = originalTiktok;
    process.env.NEXT_PUBLIC_MERCADOLIBRE_URL = originalMl;
    process.env.NEXT_PUBLIC_INSTAGRAM_URL = originalIg;
  });

  it("renders the brand, a real WhatsApp link with an icon, and no TikTok/ML/Instagram links when the env vars are unset", () => {
    delete process.env.NEXT_PUBLIC_TIKTOK_URL;
    delete process.env.NEXT_PUBLIC_MERCADOLIBRE_URL;
    delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;

    render(<Footer whatsappNumber="573000000000" />);

    expect(screen.getByText("Crazy Hour")).toBeInTheDocument();
    const whatsappLink = screen.getByRole("link", { name: /whatsapp/i });
    expect(whatsappLink).toHaveAttribute("href", expect.stringContaining("https://wa.me/573000000000"));
    expect(whatsappLink.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("link", { name: /tiktok/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /mercado libre/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /instagram/i })).not.toBeInTheDocument();
  });

  it("renders TikTok, Mercado Libre, and Instagram links with icons when their env vars are set", () => {
    process.env.NEXT_PUBLIC_TIKTOK_URL = "https://tiktok.com/@crazyhour";
    process.env.NEXT_PUBLIC_MERCADOLIBRE_URL = "https://listado.mercadolibre.com.co/crazyhour";
    process.env.NEXT_PUBLIC_INSTAGRAM_URL = "https://www.instagram.com/importador_crazyhour";

    render(<Footer whatsappNumber="573000000000" />);

    const tiktokLink = screen.getByRole("link", { name: /tiktok/i });
    expect(tiktokLink).toHaveAttribute("href", "https://tiktok.com/@crazyhour");
    expect(tiktokLink.querySelector("svg")).not.toBeNull();

    const mlLink = screen.getByRole("link", { name: /mercado libre/i });
    expect(mlLink).toHaveAttribute("href", "https://listado.mercadolibre.com.co/crazyhour");
    expect(mlLink.querySelector("svg")).not.toBeNull();

    const igLink = screen.getByRole("link", { name: /instagram/i });
    expect(igLink).toHaveAttribute("href", "https://www.instagram.com/importador_crazyhour");
    expect(igLink.querySelector("svg")).not.toBeNull();
  });
});
