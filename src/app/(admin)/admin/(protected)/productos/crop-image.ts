/** Longest edge uploaded to Storage — phone photos are 4000px+ / 3 MB and the storefront never shows them that big. */
const MAX_EDGE = 1600;

/** Sizes `canvas` to the crop area (downscaled to MAX_EDGE) and draws only that region of `image`, at the origin. */
export function drawCropToCanvas(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  croppedAreaPixels: { x: number; y: number; width: number; height: number }
): void {
  const scale = Math.min(1, MAX_EDGE / Math.max(croppedAreaPixels.width, croppedAreaPixels.height));
  const width = Math.round(croppedAreaPixels.width * scale);
  const height = Math.round(croppedAreaPixels.height * scale);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el recorte.");
  // Zooming out past "cover" (minZoom < 1 in the crop modal) can leave the
  // crop area bigger than the source image — fill white first so those gaps
  // export as white (matching every product photo's white background)
  // instead of transparent.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    width,
    height
  );
}

/** Wraps canvas.toBlob's callback API into a Promise, encoding as WebP (Safari falls back to PNG, whose blob.type we honor). */
export function cropToFile(canvas: HTMLCanvasElement, sourceFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen recortada."));
          return;
        }
        const ext = blob.type.split("/")[1] ?? "webp";
        resolve(new File([blob], sourceFile.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type }));
      },
      "image/webp",
      0.82
    );
  });
}

/** Downscales + re-encodes a whole image without cropping — for uploads that skip the crop modal. */
export async function shrinkFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  drawCropToCanvas(canvas, bitmap, { x: 0, y: 0, width: bitmap.width, height: bitmap.height });
  bitmap.close();
  return cropToFile(canvas, file);
}
