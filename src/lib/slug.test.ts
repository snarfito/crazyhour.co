import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Hora Loca")).toBe("hora-loca");
  });

  it("strips accents", () => {
    expect(slugify("Piñatas y más")).toBe("pinatas-y-mas");
  });

  it("removes non-alphanumeric characters", () => {
    expect(slugify("Globos #1 (metálicos)!")).toBe("globos-1-metalicos");
  });

  it("collapses repeated hyphens and trims edges", () => {
    expect(slugify("  --Fiestas   Temáticas--  ")).toBe("fiestas-tematicas");
  });
});
