import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("AnimacionesPage", () => {
  it("prompts the admin to pick an animation from the list", async () => {
    const AnimacionesPage = (await import("./page")).default;
    render(AnimacionesPage());

    expect(screen.getByText(/selecciona una animación/i)).toBeInTheDocument();
  });
});
