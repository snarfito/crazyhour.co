import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryGrid } from "./category-grid";

describe("CategoryGrid", () => {
  it("renders one card per category, each name shown once", () => {
    render(
      <CategoryGrid
        categories={[
          { id: "c1", name: "Piñatas", slug: "pinatas", cover_image_url: null, productCount: 3 },
          { id: "c2", name: "Globos", slug: "globos", cover_image_url: null, productCount: 8 },
        ]}
      />
    );
    expect(screen.getAllByText("Piñatas")).toHaveLength(1);
    expect(screen.getAllByText("Globos")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("makes every 5th tile (index 4, 9, ...) wide", () => {
    const categories = Array.from({ length: 5 }, (_, i) => ({
      id: `c${i}`,
      name: `Categoria ${i}`,
      slug: `categoria-${i}`,
      cover_image_url: null,
      productCount: 0,
    }));
    render(<CategoryGrid categories={categories} />);
    const links = screen.getAllByRole("link");
    expect(links[4]).toHaveClass("col-span-2");
    expect(links[0]).not.toHaveClass("col-span-2");
  });

  it("passes each category's product count through to its card", () => {
    render(
      <CategoryGrid
        categories={[
          { id: "c1", name: "Piñatas", slug: "pinatas", cover_image_url: null, productCount: 5 },
        ]}
      />
    );
    expect(screen.getByText("5 productos")).toBeInTheDocument();
  });
});
