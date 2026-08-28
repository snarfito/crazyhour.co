import { describe, it, expect } from "vitest";
import { fontHeading, fontBody, fontAccent, fontMono } from "@/lib/fonts";

describe("fonts", () => {
  it("exposes a CSS variable class name for each font", () => {
    expect(fontHeading.variable).toBe("--font-nunito");
    expect(fontBody.variable).toBe("--font-manrope");
    expect(fontAccent.variable).toBe("--font-caveat");
    expect(fontMono.variable).toBe("--font-jetbrains-mono");
  });
});
