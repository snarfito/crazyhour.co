import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryCard } from "./category-card";

describe("CategoryCard", () => {
  it("links to the category's URL and shows its name", () => {
    render(<CategoryCard id="c1" name="Piñatas" slug="pinatas" coverImageUrl={null} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pinatas");
    // The name appears once in the card text; the placeholder is now purely decorative (text moved to CatalogImage overlay in Task 3)
    expect(screen.getByText("Piñatas")).toBeInTheDocument();
  });
});
