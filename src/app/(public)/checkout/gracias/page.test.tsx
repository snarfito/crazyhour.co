import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import GraciasPage from "./page";

describe("GraciasPage", () => {
  it("shows a thank-you message and the reference when present", async () => {
    const ui = await GraciasPage({ searchParams: Promise.resolve({ ref: "order-123" }) });
    render(ui);

    expect(screen.getByText(/gracias por tu compra/i)).toBeInTheDocument();
    expect(screen.getByText(/order-123/)).toBeInTheDocument();
  });

  it("renders without a reference too", async () => {
    const ui = await GraciasPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText(/gracias por tu compra/i)).toBeInTheDocument();
  });
});
