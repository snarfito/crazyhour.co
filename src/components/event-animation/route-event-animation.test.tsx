import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/lib/settings", () => ({
  getActiveEventTheme: vi.fn().mockResolvedValue("navidad"),
}));

describe("RouteEventAnimation", () => {
  it("uses the site-wide theme when no categoryTheme is given", async () => {
    const { RouteEventAnimation } = await import("./route-event-animation");
    const { container } = render(await RouteEventAnimation({}));

    expect(container.querySelectorAll(".event-particle-down").length).toBeGreaterThan(0);
  });

  it("uses the site-wide theme when categoryTheme is null (no override assigned)", async () => {
    const { RouteEventAnimation } = await import("./route-event-animation");
    const { container } = render(await RouteEventAnimation({ categoryTheme: null }));

    expect(container.querySelectorAll(".event-particle").length).toBeGreaterThan(0);
  });

  it("renders nothing when categoryTheme is 'none', even though a site-wide theme is active", async () => {
    const { RouteEventAnimation } = await import("./route-event-animation");
    const { container } = render(await RouteEventAnimation({ categoryTheme: "none" }));

    expect(container).toBeEmptyDOMElement();
  });

  it("uses categoryTheme over the site-wide theme when both are set", async () => {
    const { RouteEventAnimation } = await import("./route-event-animation");
    const { container } = render(await RouteEventAnimation({ categoryTheme: "carnaval" }));

    expect(container.querySelectorAll(".event-particle").length).toBe(8);
  });
});
