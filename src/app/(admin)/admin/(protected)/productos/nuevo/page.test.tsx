import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({
        order: () =>
          Promise.resolve({
            data: [
              { id: "cat-a", name: "Piñatas" },
              { id: "cat-b", name: "Globos" },
            ],
          }),
      }),
    }),
  }),
}));

vi.mock("../actions", () => ({
  createProduct: vi.fn(),
}));

describe("NuevoProductoPage", () => {
  it("renders one checkbox per category and the 5 price fields", async () => {
    const NuevoProductoPage = (await import("./page")).default;
    const ui = await NuevoProductoPage();
    render(ui);

    expect(screen.getByLabelText("Piñatas")).toBeInTheDocument();
    expect(screen.getByLabelText("Globos")).toBeInTheDocument();
    expect(screen.getByLabelText(/precio por unidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/media paca — cantidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/media paca — precio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paca completa — cantidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paca completa — precio/i)).toBeInTheDocument();
  });
});
