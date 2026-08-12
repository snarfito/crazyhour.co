import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryWhatsAppCta } from "./category-whatsapp-cta";

describe("CategoryWhatsAppCta", () => {
  it("renders a WhatsApp link built from the given number", () => {
    render(<CategoryWhatsAppCta whatsappNumber="573000000000" />);

    expect(screen.getByText(/no encuentras lo que buscabas/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /escribir por whatsapp/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("https://wa.me/573000000000"));
    expect(link).toHaveAttribute("target", "_blank");
  });
});
