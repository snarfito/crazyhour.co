import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { toWebp, MAX_EDGE } from "./optimize-image";

const png = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: "#fc6000" } }).png().toBuffer();

describe("toWebp", () => {
  it("downscales the longest edge to MAX_EDGE and outputs webp", async () => {
    const meta = await sharp(await toWebp(await png(3000, 2000))).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(MAX_EDGE);
    expect(meta.height).toBe(Math.round((2000 * MAX_EDGE) / 3000));
  });

  it("never upscales a small image", async () => {
    const meta = await sharp(await toWebp(await png(400, 300))).metadata();
    expect(meta.width).toBe(400);
  });
});
