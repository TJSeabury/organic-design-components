import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ExtractComplimentaryColorsFromImage,
  ExtractAverageWarmAndCoolColorsFromImage,
} from "./Utils";
import { formatHex, type Color, rgb } from "culori";

interface CTASectionProps {
  backgroundImage?: string;
  backgroundColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  children?: React.ReactNode;
}

export const CTASection: React.FC<CTASectionProps> = ({
  backgroundImage,
  backgroundColor,
  overlayColor,
  overlayOpacity,
  textColor,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [complimentaryColors, setComplimentaryColors] = useState<Color[]>([
    rgb("#000000") as Color,
    rgb("#FFFFFF") as Color,
  ]);

  const [averageWarmAndCoolColors, setAverageWarmAndCoolColors] = useState<
    [Color, Color]
  >([rgb("#000000") as Color, rgb("#FFFFFF") as Color]);

  const colorPallete = useMemo(() => {
    const pallete: Color[] = [
      rgb("#677B96") as Color,
      rgb(backgroundColor) as Color,
      rgb(overlayColor) as Color,
      ...complimentaryColors.map((color) => rgb(color) as Color),
      ...averageWarmAndCoolColors.map((color) => rgb(color) as Color),
    ];
    console.log(pallete);
    return pallete;
  }, [
    "#677B96",
    backgroundColor,
    overlayColor,
    ...complimentaryColors,
    ...averageWarmAndCoolColors,
  ]);

  useEffect(() => {
    if (backgroundImage) {
      Promise.all([
        ExtractComplimentaryColorsFromImage(backgroundImage),
        ExtractAverageWarmAndCoolColorsFromImage(backgroundImage),
      ])
        .then(([complimentaryColors, averageWarmAndCoolColors]) => {
          if (
            complimentaryColors === undefined ||
            averageWarmAndCoolColors === undefined
          ) {
            console.error(
              `Failed to extract complimentary or average warm and cool colors from image: ${backgroundImage}`,
            );
            return;
          }
          setComplimentaryColors(complimentaryColors);
          setAverageWarmAndCoolColors(averageWarmAndCoolColors);
        })
        .catch((error) => {
          console.error(
            `Failed to extract complimentary or average warm and cool colors from image: ${backgroundImage}`,
            error,
          );
        });
    }
  }, [backgroundImage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.66, // Trigger when 10% of the section is visible
        rootMargin: "0px 0px -100px 0px", // Trigger slightly before fully in view
      },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const containerStyle: React.CSSProperties &
    Record<string, string | number | undefined> = {
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
    backgroundColor: backgroundColor ? backgroundColor : "none",
    overlayColor: overlayColor ? overlayColor : "none",
    overlayOpacity: overlayOpacity ? overlayOpacity : 0.5,
    textColor: textColor ? textColor : "none",
  };
  return (
    <section
      ref={sectionRef}
      className="cta-section w-full h-full my-16 relative overflow-hidden bg-cover bg-center flex items-center justify-center before:content-[''] before:block before:pt-[100vh]"
      style={containerStyle}
    >
      {colorPallete[6] && (
        <div
          className="cta-section-overlay absolute inset-0"
          style={{
            backgroundColor: formatHex(colorPallete[6]),
            opacity: overlayOpacity,
          }}
        ></div>
      )}
      <div
        className={`cta-section-content-card flex items-center justify-center z-10 bg-[${formatHex(colorPallete[5])}] backdrop-blur-sm min-w-[400px] min-h-[300px] rounded-lg p-32 transition-all duration-700 ease-out ${
          isVisible
            ? `scale-120 shadow-2xl ring-opacity-50 shadow-opacity-50`
            : "scale-100 shadow-none"
        }`}
        style={{
          boxShadow: isVisible
            ? `0 8px 16px 0 ${formatHex(colorPallete[5])}66`
            : `0 8px 16px 0 ${formatHex(colorPallete[5])}00`,
          backgroundColor: `${formatHex(colorPallete[6])}66`,
        }}
      >
        <div className="cta-section-content-card-inner">{children}</div>
      </div>
      <div className="cta-section-complimentary-colors absolute top-0 left-0 w-full flex items-center justify-start z-101 gap-2 p-4">
        {colorPallete.map((color, index) => (
          <div
            key={index}
            className="cta-section-complimentary-color pointer-events-none w-16 h-16 rounded-full shadow-md"
            style={{
              zIndex: 101,
              backgroundColor: formatHex(color),
              opacity: 1,
            }}
          ></div>
        ))}
      </div>
    </section>
  );
};
