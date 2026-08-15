import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { SiteSearch } from "./site-search";

const mockLimit = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          ilike: () => ({
            limit: mockLimit,
          }),
        }),
      }),
    }),
  }),
}));

describe("SiteSearch", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders on the home page, a product page, and the cart", () => {
    for (const path of ["/", "/producto/p1", "/carrito", "/checkout"]) {
      vi.mocked(usePathname).mockReturnValue(path);
      const { unmount } = render(<SiteSearch />);
      expect(screen.getByLabelText("Buscar productos")).toBeInTheDocument();
      unmount();
    }
  });

  it("hides on category pages, which use their own scoped search instead", () => {
    vi.mocked(usePathname).mockReturnValue("/halloween");
    render(<SiteSearch />);

    expect(screen.queryByLabelText("Buscar productos")).not.toBeInTheDocument();
  });

  it("shows nothing until 2+ characters are typed", async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);

    await user.type(screen.getByLabelText("Buscar productos"), "p");

    expect(mockLimit).not.toHaveBeenCalled();
  });

  it("shows matching products with price after typing, and no results text otherwise", async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: "p1", name: "Piñata estrella", unit_price_cop: 45000, product_images: [] },
      ],
    });
    const user = userEvent.setup();
    render(<SiteSearch />);

    await user.type(screen.getByLabelText("Buscar productos"), "piñata");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /piñata estrella/i })).toHaveAttribute("href", "/producto/p1");
    });
    expect(screen.getByText("$ 45.000")).toBeInTheDocument();
  });

  it("shows a no-results message when the search returns nothing", async () => {
    mockLimit.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    render(<SiteSearch />);

    await user.type(screen.getByLabelText("Buscar productos"), "xyz");

    await waitFor(() => {
      expect(screen.getByText(/sin resultados/i)).toBeInTheDocument();
    });
  });
});
