import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrandPlaceholder } from "./brand-placeholder";

describe("BrandPlaceholder", () => {
  it("renders a decorative gradient tile with an icon, no visible text", () => {
    const { container } = render(<BrandPlaceholder seed="cat-1" />);
    // The name is rendered by CatalogImage (Task 3), not here — this
    // component is purely the decorative background + icon.
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it("picks the same gradient and icon for the same seed", () => {
    const { container: a } = render(<BrandPlaceholder seed="same-seed" />);
    const { container: b } = render(<BrandPlaceholder seed="same-seed" />);
    const classA = a.firstElementChild?.className;
    const classB = b.firstElementChild?.className;
    expect(classA).toBe(classB);
  });

  it("picks a different gradient for a different seed", () => {
    const { container: a } = render(<BrandPlaceholder seed="seed-one" />);
    const { container: b } = render(<BrandPlaceholder seed="seed-two" />);
    const classA = a.firstElementChild?.className;
    const classB = b.firstElementChild?.className;
    expect(classA).not.toBe(classB);
  });
});
