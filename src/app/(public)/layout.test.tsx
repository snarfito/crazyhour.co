import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PublicLayout from "./layout";

describe("public layout", () => {
  it("applies the dark theme class and renders the wordmark logo", () => {
    render(
      <PublicLayout>
        <p>contenido</p>
      </PublicLayout>
    );
    const root = screen.getByTestId("public-theme-root");
    expect(root).toHaveClass("theme-dark");
    expect(screen.getByAltText("Crazy Hour")).toHaveAttribute("src", expect.stringContaining("logo.webp"));
  });
});
