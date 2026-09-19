import { describe, it, expect, vi } from "vitest";
import { cropToFile, drawCropToCanvas } from "./crop-image";

describe("cropToFile", () => {
  it("resolves a File named after the source but with the extension and type of the encoded blob", async () => {
    const fakeBlob = new Blob(["cropped-bytes"], { type: "image/webp" });
    const canvas = {
      toBlob: (cb: BlobCallback) => cb(fakeBlob),
    } as unknown as HTMLCanvasElement;
    const sourceFile = new File(["original-bytes"], "sombrero.jpg", { type: "image/jpeg" });

    const result = await cropToFile(canvas, sourceFile);

    expect(result.name).toBe("sombrero.webp");
    expect(result.type).toBe("image/webp");
  });

  it("rejects when the canvas cannot produce a blob", async () => {
    const canvas = {
      toBlob: (cb: BlobCallback) => cb(null),
    } as unknown as HTMLCanvasElement;
    const sourceFile = new File(["original-bytes"], "sombrero.jpg", { type: "image/jpeg" });

    await expect(cropToFile(canvas, sourceFile)).rejects.toThrow(/no se pudo/i);
  });
});

describe("drawCropToCanvas", () => {
  it("sizes the canvas to the crop area and draws only that region at the origin", () => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage, fillRect, fillStyle: "" }),
    } as unknown as HTMLCanvasElement;
    const image = {} as CanvasImageSource;

    drawCropToCanvas(canvas, image, { x: 40, y: 10, width: 200, height: 150 });

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(150);
    expect(drawImage).toHaveBeenCalledWith(image, 40, 10, 200, 150, 0, 0, 200, 150);
  });

  it("fills the canvas white first, so zooming out past the image's edges exports white instead of transparent", () => {
    const ctx = { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
    const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
    const image = {} as CanvasImageSource;

    drawCropToCanvas(canvas, image, { x: -50, y: 0, width: 300, height: 150 });

    expect(ctx.fillStyle).toBe("#ffffff");
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
    // The white fill must happen before drawImage, or it would paint over the photo.
    const fillOrder = ctx.fillRect.mock.invocationCallOrder[0];
    const drawOrder = ctx.drawImage.mock.invocationCallOrder[0];
    expect(fillOrder).toBeLessThan(drawOrder);
  });

  it("downscales a large crop so its longest edge is 1600px, drawing the full source region into the smaller canvas", () => {
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage, fillRect: vi.fn(), fillStyle: "" }),
    } as unknown as HTMLCanvasElement;
    const image = {} as CanvasImageSource;

    drawCropToCanvas(canvas, image, { x: 0, y: 0, width: 4000, height: 3000 });

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 4000, 3000, 0, 0, 1600, 1200);
  });

  it("throws when the canvas has no 2d context", () => {
    const canvas = { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement;
    const image = {} as CanvasImageSource;

    expect(() => drawCropToCanvas(canvas, image, { x: 0, y: 0, width: 10, height: 10 })).toThrow(/no se pudo/i);
  });
});
