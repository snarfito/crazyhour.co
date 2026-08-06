import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PublicLayout from "./layout";

describe("public layout", () => {
  it("applies the dark theme class, renders the wordmark logo, and a sticky header", () => {
    render(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>
    );
    const root = screen.getByTestId("public-theme-root");
    expect(root).toHaveClass("theme-dark");
    expect(screen.getByAltText("Crazy Hour")).toHaveAttribute("src", expect.stringContaining("logo.webp"));
    expect(screen.getByRole("banner")).toHaveClass("sticky");
  });

  it("renders a floating, inert WhatsApp button", () => {
    render(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>
    );
    const button = screen.getByRole("button", { name: /whatsapp/i });
    expect(button).not.toHaveAttribute("href");
  });
});
