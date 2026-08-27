import { describe, it, expect } from "vitest";
import { suggestColorHex } from "./color-name-to-hex";

describe("suggestColorHex", () => {
  it("matches a plain base color name in Spanish", () => {
    expect(suggestColorHex("Amarillo")).toBe("#FDD835");
    expect(suggestColorHex("rojo")).toBe("#E53935");
  });

  it("matches a plain base color name in English", () => {
    expect(suggestColorHex("Yellow")).toBe("#FDD835");
    expect(suggestColorHex("gold")).toBe("#D4AF37");
  });

  it("strips a finish/prefix modifier word before matching (real catalog names)", () => {
    expect(suggestColorHex("Chrome Gold")).toBe("#D4AF37");
    expect(suggestColorHex("Chrome Silver")).toBe("#C0C0C0");
    expect(suggestColorHex("Metálico Rojo")).toBe("#E53935");
  });

  it("matches a compound named shade exactly, without stripping", () => {
    expect(suggestColorHex("Rose Gold")).toBe("#B76E79");
    expect(suggestColorHex("Night Blue")).toBe("#16215B");
    expect(suggestColorHex("Light Green")).toBe("#90C978");
  });

  it("strips a modifier and still matches a compound shade underneath", () => {
    expect(suggestColorHex("Chrome Rose Gold")).toBe("#B76E79");
    expect(suggestColorHex("Chrome night blue")).toBe("#16215B");
    expect(suggestColorHex("Chrome light green")).toBe("#90C978");
  });

  it("falls back to the last word when no compound match exists", () => {
    expect(suggestColorHex("Chrome new gold")).toBe("#D4AF37");
  });

  it("is case- and accent-insensitive", () => {
    expect(suggestColorHex("AMARILLO")).toBe("#FDD835");
    expect(suggestColorHex("café")).toBe("#4E342E");
  });

  it("returns null for a name with no match", () => {
    expect(suggestColorHex("Hemes")).toBeNull();
    expect(suggestColorHex("")).toBeNull();
  });
});
