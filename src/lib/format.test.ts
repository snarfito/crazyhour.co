import { describe, it, expect } from "vitest";
import { formatCOP } from "./format";

describe("formatCOP", () => {
  it("formats a whole COP amount with thousands separators and no decimals", () => {
    expect(formatCOP(45000)).toBe("$ 45.000");
  });

  it("formats a large amount correctly", () => {
    expect(formatCOP(1240000)).toBe("$ 1.240.000");
  });

  it("formats zero", () => {
    expect(formatCOP(0)).toBe("$ 0");
  });
});
