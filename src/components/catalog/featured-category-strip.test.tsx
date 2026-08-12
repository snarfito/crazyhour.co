import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedCategoryStrip } from "./featured-category-strip";

describe("FeaturedCategoryStrip", () => {
  it("shows the category name, description, and a link to the category page", () => {
    render(
      <FeaturedCategoryStrip
        name="Hora Loca"
        slug="hora-loca"
        description="Gafas, pitos, coronas y todo el desorden que hace única una hora loca."
        coverImageUrl={null}
      />
    );

    expect(screen.getByText("Hora Loca")).toBeInTheDocument();
    expect(
      screen.getByText("Gafas, pitos, coronas y todo el desorden que hace única una hora loca.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver hora loca/i })).toHaveAttribute("href", "/hora-loca");
  });

  it("omits the description paragraph when there is none", () => {
    render(<FeaturedCategoryStrip name="Halloween" slug="halloween" description={null} coverImageUrl={null} />);
    expect(screen.getByRole("link", { name: /ver halloween/i })).toBeInTheDocument();
  });
});
