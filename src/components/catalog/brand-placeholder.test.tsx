import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandPlaceholder } from "./brand-placeholder";

describe("BrandPlaceholder", () => {
  it("renders the label text", () => {
    render(<BrandPlaceholder label="Piñatas" seed="cat-1" />);
    expect(screen.getByText("Piñatas")).toBeInTheDocument();
  });

  it("picks the same color for the same seed", () => {
    const { container: a } = render(<BrandPlaceholder label="X" seed="same-seed" />);
    const { container: b } = render(<BrandPlaceholder label="Y" seed="same-seed" />);
    const classA = a.firstElementChild?.className;
    const classB = b.firstElementChild?.className;
    expect(classA).toBe(classB);
  });
});
