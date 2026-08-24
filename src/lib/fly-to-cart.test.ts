import { describe, it, expect, vi, afterEach } from "vitest";
import { flyToCart } from "./fly-to-cart";

// jsdom implements neither Element.animate nor window.matchMedia, so both
// are stubbed here to exercise the branches (reduced motion, missing
// target, happy path) without a real browser.
function stubAnimate() {
  const animate = vi.fn().mockReturnValue({ onfinish: null, oncancel: null });
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  return animate;
}

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

describe("flyToCart", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing when prefers-reduced-motion is set", () => {
    stubMatchMedia(true);
    const animate = stubAnimate();
    const button = document.createElement("button");

    flyToCart(button);

    expect(animate).not.toHaveBeenCalled();
  });

  it("does nothing when the cart icon target is missing", () => {
    stubMatchMedia(false);
    const animate = stubAnimate();
    const button = document.createElement("button");

    flyToCart(button);

    expect(animate).not.toHaveBeenCalled();
  });

  it("animates a flying element to the cart icon and removes it on finish", () => {
    stubMatchMedia(false);
    const animate = stubAnimate();
    const button = document.createElement("button");
    const target = document.createElement("div");
    target.id = "cart-icon-target";
    document.body.append(button, target);

    flyToCart(button);

    expect(animate).toHaveBeenCalledTimes(1);
    const flyingEl = document.body.lastElementChild as HTMLElement;
    expect(flyingEl.textContent).toBe("📦");

    const animation = animate.mock.results[0]!.value;
    animation.onfinish();
    expect(document.body.contains(flyingEl)).toBe(false);
  });
});
