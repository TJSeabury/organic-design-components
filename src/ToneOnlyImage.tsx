import { converter, parse } from "culori";
import { useRef, useEffect } from "react";

interface ToneOnlyImageProps {
  imageUrl: string;
  width: number;
  height: number;
  className?: string;
}

export const ToneOnlyImage: React.FC<ToneOnlyImageProps> = ({
  imageUrl,
  width,
  height,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = new Image();
    image.src = imageUrl;
    image.onload = (event: Event) => {
      const image = event.target as HTMLImageElement;
      // Draw the image to the canvas first
      ctx.drawImage(image, 0, 0, width, height);
      // Convert all the pixels to hsl, drop the saturation, and convert back to rgb
      const imageData = ctx.getImageData(0, 0, width, height);
      const toHsl = converter("hsl");
      const toRgb = converter("rgb");
      for (let i = 0; i < imageData.data.length; i += 4) {
        const parsedColor = parse(
          `rgba(${imageData.data[i]}, ${imageData.data[i + 1]}, ${
            imageData.data[i + 2]
          }, ${imageData.data[i + 3]})`
        );
        if (!parsedColor) {
          console.error(
            `Failed to parse pixel color: ${imageData.data[i]}, ${
              imageData.data[i + 1]
            }, ${imageData.data[i + 2]}, ${imageData.data[i + 3]}`
          );
          continue;
        }
        const hslColor = toHsl(parsedColor);
        if (!hslColor || typeof hslColor !== "object") continue;
        // hslColor.s = 0;
        if (hslColor.l < 0.5) {
          hslColor.l = 0;
        }
        if (hslColor.l > 0.9) {
          hslColor.l = 1;
        }
        if (hslColor.h && hslColor.h > 90 && hslColor.h < 270) {
          hslColor.h = 240;
          hslColor.s = 1;
        } else {
          hslColor.h = 0;
          hslColor.s = 1;
        }
        const rgbColor = toRgb(hslColor);
        if (!rgbColor || typeof rgbColor !== "object") continue;
        // culori RGB values are normalized (0-1), convert to 0-255
        imageData.data[i] = Math.round((rgbColor.r ?? 0) * 255);
        imageData.data[i + 1] = Math.round((rgbColor.g ?? 0) * 255);
        imageData.data[i + 2] = Math.round((rgbColor.b ?? 0) * 255);
      }
      ctx.putImageData(imageData, 0, 0);
    };
  });

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};
