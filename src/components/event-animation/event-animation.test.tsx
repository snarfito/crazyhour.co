import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EventAnimation } from "./event-animation";

describe("EventAnimation", () => {
  it("renders nothing when the theme is none", () => {
    const { container } = render(<EventAnimation theme="none" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders 8 particles for an active theme, in a pointer-events-none fixed overlay", () => {
    const { container } = render(<EventAnimation theme="navidad" />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("pointer-events-none", "fixed", "inset-0", "z-10");
    expect(overlay.querySelectorAll(".event-particle")).toHaveLength(8);
  });

  it("gives every particle the theme's movement direction class", () => {
    const { container } = render(<EventAnimation theme="amor_y_amistad" />);

    const particles = container.querySelectorAll(".event-particle");
    for (const particle of particles) {
      expect(particle).toHaveClass("event-particle-up");
    }
  });

  it("uses an absolute, non-fixed container when contained is true (for embedding in a preview box)", () => {
    const { container } = render(<EventAnimation theme="navidad" contained />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("absolute", "inset-0");
    expect(overlay).not.toHaveClass("fixed", "z-10");
  });
});
