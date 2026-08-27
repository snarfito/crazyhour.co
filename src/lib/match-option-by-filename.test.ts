import { describe, it, expect } from "vitest";
import { matchOptionByFilename } from "./match-option-by-filename";

const OPTIONS = [
  { id: "opt-gold", displayName: "Chrome Gold" },
  { id: "opt-silver", displayName: "Chrome Silver" },
  { id: "opt-18", displayName: "18 pulgadas" },
];

describe("matchOptionByFilename", () => {
  it("matches an exact slug (ignoring extension, case, and separators)", () => {
    expect(matchOptionByFilename("chrome-gold.jpg", OPTIONS)?.id).toBe("opt-gold");
    expect(matchOptionByFilename("Chrome_Silver.PNG", OPTIONS)?.id).toBe("opt-silver");
    expect(matchOptionByFilename("18-pulgadas.webp", OPTIONS)?.id).toBe("opt-18");
  });

  it("matches when the filename contains the option name plus extra text", () => {
    expect(matchOptionByFilename("IMG_chrome-gold_final.jpg", OPTIONS)?.id).toBe("opt-gold");
  });

  it("prefers the longest matching option to avoid short false positives", () => {
    const options = [
      { id: "opt-gold", displayName: "Gold" },
      { id: "opt-chrome-gold", displayName: "Chrome Gold" },
    ];
    expect(matchOptionByFilename("chrome-gold.jpg", options)?.id).toBe("opt-chrome-gold");
  });

  it("returns null when nothing matches", () => {
    expect(matchOptionByFilename("random-photo.jpg", OPTIONS)).toBeNull();
  });

  it("returns null for a filename that slugifies to nothing", () => {
    expect(matchOptionByFilename("....jpg", OPTIONS)).toBeNull();
  });
});
