import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "./breadcrumb";

describe("Breadcrumb", () => {
  it("renders linked items with hrefs and the last item as plain current-page text", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Halloween", href: "/halloween" },
          { label: "Espantapájaros" },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Halloween" })).toHaveAttribute("href", "/halloween");
    const current = screen.getByText("Espantapájaros");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Espantapájaros" })).not.toBeInTheDocument();
  });
});
