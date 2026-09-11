/** Sizes `canvas` to the crop area and draws only that region of `image`, at the origin. */
export function drawCropToCanvas(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  croppedAreaPixels: { x: number; y: number; width: number; height: number }
): void {
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el recorte.");
  // Zooming out past "cover" (minZoom < 1 in the crop modal) can leave the
  // crop area bigger than the source image — fill white first so those gaps
  // export as white (matching every product photo's white background)
  // instead of transparent.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );
}

/** Wraps canvas.toBlob's callback API into a Promise, preserving the source file's name/type. */
export function cropToFile(canvas: HTMLCanvasElement, sourceFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen recortada."));
          return;
        }
        resolve(new File([blob], sourceFile.name, { type: sourceFile.type || blob.type }));
      },
      sourceFile.type || "image/jpeg",
      0.92
    );
  });
}
