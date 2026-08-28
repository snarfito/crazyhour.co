import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EventAnimation } from "./event-animation";
import { DEFAULT_MOTION_SETTINGS } from "@/lib/theme-motion-defaults";

describe("EventAnimation", () => {
  it("renders nothing when the theme is none", () => {
    const { container } = render(<EventAnimation theme="none" settings={DEFAULT_MOTION_SETTINGS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders settings.particleCount particles, in a pointer-events-none fixed overlay behind page content", () => {
    const { container } = render(
      <EventAnimation theme="navidad" settings={{ ...DEFAULT_MOTION_SETTINGS, particleCount: 5 }} />,
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("pointer-events-none", "fixed", "inset-0", "z-0");
    expect(overlay.querySelectorAll(".event-particle")).toHaveLength(5);
  });

  it("gives every particle the theme's movement direction class when there's no custom CSS", () => {
    const { container } = render(<EventAnimation theme="amor_y_amistad" settings={DEFAULT_MOTION_SETTINGS} />);

    const particles = container.querySelectorAll(".event-particle");
    for (const particle of particles) {
      expect(particle).toHaveClass("event-particle-up");
    }
  });

  it("uses an absolute, non-fixed container when contained is true", () => {
    const { container } = render(
      <EventAnimation theme="navidad" contained settings={DEFAULT_MOTION_SETTINGS} />,
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("absolute", "inset-0");
    expect(overlay).not.toHaveClass("fixed", "z-0");
  });

  it("respects settings.maxOpacity", () => {
    const { container } = render(
      <EventAnimation theme="navidad" settings={{ ...DEFAULT_MOTION_SETTINGS, maxOpacity: 0.42 }} />,
    );
    const particle = container.querySelector(".event-particle") as HTMLElement;
    expect(particle.style.opacity).toBe("0.42");
  });

  it("renders custom CSS in a <style> tag and omits the direction class + inline duration when customCss is set", () => {
    const customCss = ".event-particle[data-theme='navidad'] { animation: spin 2s linear infinite; }";
    const { container } = render(
      <EventAnimation theme="navidad" settings={{ ...DEFAULT_MOTION_SETTINGS, customCss }} />,
    );

    expect(container.querySelector("style")?.textContent).toBe(customCss);
    const particle = container.querySelector(".event-particle") as HTMLElement;
    expect(particle).not.toHaveClass("event-particle-down");
    expect(particle.getAttribute("data-theme")).toBe("navidad");
    expect(particle.style.animationDuration).toBe("");
  });
});
