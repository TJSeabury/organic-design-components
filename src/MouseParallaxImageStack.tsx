import React, { useEffect, useState } from "react";

interface MouseParallaxImageStackProps {
  /** Overall parallax strength for the foreground image layer. */
  parallaxStrength?: number;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Foreground image (or image-like) content. */
  children: React.ReactNode;
}

export const MouseParallaxImageStack: React.FC<
  MouseParallaxImageStackProps
> = ({ parallaxStrength = 30, className = "", children }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;

      const normX = (event.clientX / innerWidth) * 2 - 1;
      const normY = (event.clientY / innerHeight) * 2 - 1;

      setOffset({
        x: normX * parallaxStrength,
        y: normY * parallaxStrength,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [parallaxStrength]);

  // Base offsets to keep underlayers visibly peeking out, plus mouse parallax.
  const back1X = 24 + offset.x * 0.25;
  const back1Y = -18 + offset.y * 0.25;
  const back2X = -16 + offset.x * 0.5;
  const back2Y = 12 + offset.y * 0.5;

  return (
    <div
      className={`relative inline-block max-w-full [perspective:1200px] ${className}`}
    >
      {/* Backmost color layer */}
      <div
        className="pointer-events-none absolute -inset-3 rounded-[2.25rem] bg-sky-500/45 shadow-xl shadow-black/40 will-change-transform transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${back1X}px, ${back1Y}px, 0) scale(1.04)`,
        }}
      />

      {/* Mid color layer */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-emerald-400/55 shadow-2xl shadow-black/60 will-change-transform transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${back2X}px, ${back2Y}px, 0) scale(1.02)`,
        }}
      />

      {/* Foreground image */}
      <div
        className="relative z-20 will-change-transform transition-transform duration-150 ease-out shadow-[0_40px_80px_rgba(0,0,0,0.75)] rounded-3xl overflow-hidden bg-black/40"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
