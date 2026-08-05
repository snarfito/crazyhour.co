import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryGrid } from "./category-grid";

describe("CategoryGrid", () => {
  it("renders one card per category", () => {
    render(
      <CategoryGrid
        categories={[
          { id: "c1", name: "Piñatas", slug: "pinatas", cover_image_url: null },
          { id: "c2", name: "Globos", slug: "globos", cover_image_url: null },
        ]}
      />
    );
    // When categories have no cover images, each name appears twice: in the placeholder and in the paragraph
    expect(screen.getAllByText("Piñatas")).toHaveLength(2);
    expect(screen.getAllByText("Globos")).toHaveLength(2);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
