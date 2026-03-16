import React, { useEffect, useState } from "react";

interface MouseParallaxSectionProps {
  /** Optional background image URL. If omitted, uses a subtle gradient. */
  backgroundImageUrl?: string;
  /** How strong the parallax offset feels. Typical range: 10–60. */
  parallaxStrength?: number;
  /** Extra class names for the outer section. */
  className?: string;
  children?: React.ReactNode;
  /** Background color. */
  backgroundColor?: string;
  /** Background image opacity. */
  backgroundImageOpacity?: number;
}

export const MouseParallaxSection: React.FC<MouseParallaxSectionProps> = ({
  backgroundImageUrl,
  parallaxStrength = -40,
  className = "",
  backgroundColor = "#B4DAD9ff",
  backgroundImageOpacity = 0.66,
  children,
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;

      const normX = (event.clientX / innerWidth) * 2 - 1; // -1 left, 1 right
      const normY = (event.clientY / innerHeight) * 2 - 1; // -1 top, 1 bottom

      setOffset({
        x: normX * parallaxStrength,
        y: normY * parallaxStrength,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [parallaxStrength]);

  return (
    <section
      className={`relative w-full min-h-screen overflow-hidden ${className}`}
      style={{
        backgroundColor: backgroundColor,
      }}
    >
      <div
        className="pointer-events-none absolute inset-[-10%] transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(1.05)`,
          backgroundImage: backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : "radial-gradient(circle at 20% 20%, #3b82f6, transparent 60%), radial-gradient(circle at 80% 80%, #f97316, #020617 70%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(2px)",
          opacity: backgroundImageOpacity,
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="max-w-xl text-center text-white">{children}</div>
      </div>
    </section>
  );
};
