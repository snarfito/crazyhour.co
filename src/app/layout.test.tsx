import { describe, it, expect } from "vitest";
import { fontHeading, fontBody } from "@/lib/fonts";

describe("fonts", () => {
  it("exposes a CSS variable class name for each font", () => {
    expect(fontHeading.variable).toBe("--font-heading");
    expect(fontBody.variable).toBe("--font-body");
  });
});
