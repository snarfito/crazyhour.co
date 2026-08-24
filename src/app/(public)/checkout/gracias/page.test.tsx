import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GraciasPage from "./page";

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("none"),
}));

vi.mock("@/lib/theme-settings", () => ({
  DEFAULT_MOTION_SETTINGS: {
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  },
  getThemeMotionSettings: vi.fn().mockResolvedValue({
    particleCount: 8, minDuration: 14, maxDuration: 22,
    minSize: 16, maxSize: 28, maxOpacity: 0.18, customCss: null,
  }),
}));

describe("GraciasPage", () => {
  it("shows a generic processing message and the reference when there's no status", async () => {
    const ui = await GraciasPage({ searchParams: Promise.resolve({ ref: "order-123" }) });
    render(ui);

    expect(screen.getByText(/gracias por tu compra/i)).toBeInTheDocument();
    expect(screen.getByText(/pago está siendo procesado/i)).toBeInTheDocument();
    expect(screen.getByText(/order-123/)).toBeInTheDocument();
  });

  it("renders without a reference too", async () => {
    const ui = await GraciasPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText(/gracias por tu compra/i)).toBeInTheDocument();
  });

  it("shows a confirmed message when the transaction was approved", async () => {
    const ui = await GraciasPage({ searchParams: Promise.resolve({ ref: "order-123", status: "APPROVED" }) });
    render(ui);

    expect(screen.getByText(/pago confirmado/i)).toBeInTheDocument();
    expect(screen.getByText(/alistando tu pedido/i)).toBeInTheDocument();
  });

  it("shows the processing message when the transaction is pending", async () => {
    const ui = await GraciasPage({ searchParams: Promise.resolve({ ref: "order-123", status: "PENDING" }) });
    render(ui);

    expect(screen.getByText(/gracias por tu compra/i)).toBeInTheDocument();
    expect(screen.getByText(/pago está siendo procesado/i)).toBeInTheDocument();
  });
});
