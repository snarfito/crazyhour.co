"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { drawCropToCanvas, cropToFile } from "./crop-image";

// Below 1 = zoomed out past "cover", so a photo that isn't naturally square
// (e.g. wider than tall) can be shrunk to fit inside the square without
// cropping any of it — the leftover space exports as white (crop-image.ts).
const MIN_ZOOM = 0.3;

/** Modal that lets the admin drag/zoom a source file into a 1:1 square before it gets uploaded. */
export function CropModal({
  imageUrl,
  sourceFile,
  onCancel,
  onCropped,
}: {
  imageUrl: string;
  sourceFile: File;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    setError(null);

    try {
      const image = await loadImage(imageUrl);
      const canvas = document.createElement("canvas");
      drawCropToCanvas(canvas, image, croppedAreaPixels);
      const file = await cropToFile(canvas, sourceFile);
      onCropped(file);
    } catch {
      setError("No se pudo recortar la imagen. Intenta de nuevo.");
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-4">
        <p className="mb-3 text-sm font-medium">Encuadra la foto</p>
        <div className="relative h-80 w-full overflow-hidden rounded-md bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={3}
            restrictPosition={false}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>
        <input
          type="range"
          min={MIN_ZOOM}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="mt-3 w-full"
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={processing || !croppedAreaPixels}>
            {processing ? "Recortando..." : "Recortar y usar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}
