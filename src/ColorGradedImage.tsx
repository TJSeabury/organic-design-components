import { GradedImageFromImageData } from "./Utils";
import { parse, formatHex, type Color } from "culori";
import { useEffect, useState } from "react";
import { LoadImageData } from "./Utils";
import { wasmReady } from "./wasm";

type ColorGradedImageProps = {
  imageUrl: string;
  width: number;
  height: number;
  className?: string;
};

export const ColorGradedImage = ({
  imageUrl,
  width,
  height,
  className,
}: ColorGradedImageProps) => {
  const [imageData, setImageData] = useState<ImageData | undefined>(undefined);
  const [shadowColor, setShadowColor] = useState<Color | undefined>(undefined);
  const [highlightColor, setHighlightColor] = useState<Color | undefined>(
    undefined
  );
  const [gradedImageSrc, setGradedImageSrc] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await LoadImageData(imageUrl);
      if (cancelled || !data) return;
      setImageData(data);
      const initialShadow = parse("#6b4b6b"); // purple
      const initialHighlight = parse("#4b6b4b"); // green
      if (!initialShadow || !initialHighlight) return;
      setShadowColor(initialShadow);
      setHighlightColor(initialHighlight);
      wasmReady.then(() => {
        if (cancelled) return;
        const result = extractWarmCoolColorsWasm(data.data);
        if (result) {
          const [warm, cool] = result;
          const warmColor = parse(warm);
          const coolColor = parse(cool);
          if (warmColor) setShadowColor(warmColor);
          if (coolColor) setHighlightColor(coolColor);
        }
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!imageData || !shadowColor || !highlightColor) return;
    const dataUrl = GradedImageFromImageData(imageData, {
      shadowColor: shadowColor,
      highlightColor: highlightColor,
      shadowThreshold: 0.3,
      highlightThreshold: 0.7,
      shadowStrength: 0.4,
      highlightStrength: 0.4,
    });
    setGradedImageSrc(dataUrl);
  }, [imageData, shadowColor, highlightColor]);

  return (
    <figure className="relative">
      <div
        className="absolute top-0 left-0 w-16 h-16"
        style={{ backgroundColor: formatHex(shadowColor) ?? undefined }}
      ></div>
      <div
        className="absolute bottom-0 left-0 w-16 h-16"
        style={{
          backgroundColor: formatHex(highlightColor) ?? undefined,
        }}
      ></div>
      {gradedImageSrc && (
        <img
          src={gradedImageSrc}
          alt="Graded Image"
          width={width}
          height={height}
          className={className}
        />
      )}
    </figure>
  );
};
