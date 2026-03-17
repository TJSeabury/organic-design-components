import React, { useEffect, useRef } from "react";

/** Basic width/height dimensions helper. */
export interface Dimensions<T> {
  width: T;
  height: T;
}

/**
 * Models a finite 2D scalar field.
 *
 * Ported inline from the original Svelte project utilities.
 */
export class FiniteScalarField2D {
  private field: number[][];
  dimensions: Dimensions<number>;
  zeroValue: number;

  constructor(width: number, height: number, zeroValue: number = 0) {
    this.dimensions = {
      width,
      height,
    };
    this.zeroValue = zeroValue;
    this.field = createTypedArray2D<number>(
      this.dimensions.width,
      this.dimensions.height,
      this.zeroValue
    );
  }

  read(): Array<NestedArray<number>> {
    return deepArrayClone<number>(this.field);
  }

  readAt(x: number, y: number): number {
    return this.field[x][y];
  }

  setAt(x: number, y: number, value: number): void {
    this.field[x][y] = value;
  }

  reset(): void {
    this.field = createTypedArray2D<number>(
      this.dimensions.width,
      this.dimensions.height,
      this.zeroValue
    );
  }

  map(f: (value: number, x: number, y: number) => number): void {
    for (let x = 0; x < this.dimensions.width; ++x) {
      for (let y = 0; y < this.dimensions.height; ++y) {
        let v = this.readAt(x, y);
        v = f(v, x, y);
        this.setAt(x, y, v);
      }
    }
  }
}

const createTypedArray2D = <T,>(width: number, height: number, fill: T) =>
  Array.from({ length: width }, () =>
    Array.from({ length: height }, () => fill)
  );

type NestedArray<T> = T | Array<NestedArray<T>>;

function deepArrayClone<T>(
  items: Array<NestedArray<T>>
): Array<NestedArray<T>> {
  return items.map((item: NestedArray<T>) =>
    Array.isArray(item) ? deepArrayClone<T>(item) : item
  );
}

const TAU = Math.PI * 2;

type CellSize = Dimensions<number>;

type Segment = readonly [Edge, Edge];
type Edge = 0 | 1 | 2 | 3; // 0=top, 1=right, 2=bottom, 3=left

// Standard marching squares connectivity (edges are connected by line segments).
// Corner bits: 1=TL, 2=TR, 4=BR, 8=BL.
const caseSegments: Readonly<Record<number, readonly Segment[]>> = {
  0: [],
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [
    [3, 0],
    [1, 2],
  ],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[3, 2]],
  9: [[0, 2]],
  10: [
    [0, 1],
    [3, 2],
  ],
  11: [[1, 2]],
  12: [[3, 1]],
  13: [[0, 1]],
  14: [[3, 0]],
  15: [],
};

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const edgeT = (iso: number, v0: number, v1: number) => {
  const denom = v1 - v0;
  if (denom === 0) return 0.5;
  return clamp01((iso - v0) / denom);
};

type Point = { x: number; y: number };
type SegmentPoints = { a: Point; b: Point };

const cellSegments = (
  iso: number,
  cellSize: CellSize,
  x0: number,
  y0: number,
  vTL: number,
  vTR: number,
  vBR: number,
  vBL: number
): SegmentPoints[] => {
  // Compute interpolated intersection points along each edge.
  const x1 = x0 + cellSize.width;
  const y1 = y0 + cellSize.height;

  const tTop = edgeT(iso, vTL, vTR);
  const tRight = edgeT(iso, vTR, vBR);
  const tBottom = edgeT(iso, vBL, vBR);
  const tLeft = edgeT(iso, vTL, vBL);

  const pTop = { x: lerp(x0, x1, tTop), y: y0 };
  const pRight = { x: x1, y: lerp(y0, y1, tRight) };
  const pBottom = { x: lerp(x0, x1, tBottom), y: y1 };
  const pLeft = { x: x0, y: lerp(y0, y1, tLeft) };

  const mask =
    (vTL >= iso ? 0b0001 : 0) |
    (vTR >= iso ? 0b0010 : 0) |
    (vBR >= iso ? 0b0100 : 0) |
    (vBL >= iso ? 0b1000 : 0);

  const segments = caseSegments[mask] ?? [];
  if (segments.length === 0) return [];

  const pointForEdge = (e: Edge): Point => {
    switch (e) {
      case 0:
        return pTop;
      case 1:
        return pRight;
      case 2:
        return pBottom;
      case 3:
      default:
        return pLeft;
    }
  };

  return segments.map(([e0, e1]) => {
    const p0 = pointForEdge(e0);
    const p1 = pointForEdge(e1);
    return { a: p0, b: p1 };
  });
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const size = 100;

const particleCount = 50;
const cohesionRadiusPx = 80;
const repulsionRadiusPx = 18;
const restDistancePx = 40;
const cohesionStrength = 0.9;
const repulsionStrength = 3;
const damping = 0.985;
const maxSpeed = 1200;

// Metaballs kernel parameters
const kernelSigmaPx = 28;
const iso = 0.9;
const invTwoSigma2 = 1 / (2 * kernelSigmaPx * kernelSigmaPx);

const field = new FiniteScalarField2D(size, size);

type PointerState = {
  active: boolean;
  down: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const MarchingSquaresExample: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef<PointerState>({
    active: false,
    down: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    const cellWidth = width / size;
    const cellHeight = height / size;
    const cellSize: CellSize = {
      width: cellWidth,
      height: cellHeight,
    };

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context required.");

    // Initialize particles near the center
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const a = Math.random() * TAU;
      const r = Math.random() * Math.min(width, height) * 0.08;
      return {
        x: width / 2 + Math.cos(a) * r,
        y: height / 2 + Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
      };
    });

    let lastNow = performance.now();
    let prevPointerX = pointerRef.current.x;
    let prevPointerY = pointerRef.current.y;

    const updatePointerFromEvent = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const pointer = pointerRef.current;
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
    };

    const onPointerMove = (ev: PointerEvent) => updatePointerFromEvent(ev);
    const onPointerDown = (ev: PointerEvent) => {
      updatePointerFromEvent(ev);
      const pointer = pointerRef.current;
      pointer.down = true;
      canvas.setPointerCapture(ev.pointerId);
    };
    const onPointerUp = (ev: PointerEvent) => {
      updatePointerFromEvent(ev);
      const pointer = pointerRef.current;
      pointer.down = false;
      try {
        canvas.releasePointerCapture(ev.pointerId);
      } catch {
        // ignore
      }
    };
    const onPointerLeave = () => {
      const pointer = pointerRef.current;
      pointer.active = false;
      pointer.down = false;
      pointer.vx = 0;
      pointer.vy = 0;
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const frame = (now: number) => {
      const dt = clamp((now - lastNow) / 1000, 0, 1 / 15);
      lastNow = now;

      const pointer = pointerRef.current;
      const particles = particlesRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "black";

      // Pointer velocity estimate (for stirring)
      if (pointer.active && dt > 0) {
        const instVx = (pointer.x - prevPointerX) / dt;
        const instVy = (pointer.y - prevPointerY) / dt;
        // low-pass filter to reduce noise
        pointer.vx = pointer.vx * 0.7 + instVx * 0.3;
        pointer.vy = pointer.vy * 0.7 + instVy * 0.3;
        prevPointerX = pointer.x;
        prevPointerY = pointer.y;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
        prevPointerX = pointer.x;
        prevPointerY = pointer.y;
      }

      // Particle simulation: cohesion + repulsion
      const cohesionR2 = cohesionRadiusPx * cohesionRadiusPx;
      const repulsionR2 = repulsionRadiusPx * repulsionRadiusPx;

      // Pairwise forces
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pj.x - pi.x;
          const dy = pj.y - pi.y;
          const d2 = dx * dx + dy * dy;
          if (d2 === 0) continue;

          const d = Math.sqrt(d2);
          const invD = 1 / d;
          let fx = 0;
          let fy = 0;

          // Cohesion (spring towards rest distance) within cohesion radius
          if (d2 < cohesionR2) {
            const disp = d - restDistancePx;
            const f = cohesionStrength * disp;
            fx += f * dx * invD;
            fy += f * dy * invD;
          }

          // Short-range repulsion
          if (d2 < repulsionR2) {
            const overlap = repulsionRadiusPx - d;
            const f = repulsionStrength * overlap;
            fx -= f * dx * invD;
            fy -= f * dy * invD;
          }

          pi.vx += fx * dt;
          pi.vy += fy * dt;
          pj.vx -= fx * dt;
          pj.vy -= fy * dt;
        }
      }

      // Pointer interaction forces (hover/click/drag/release)
      if (pointer.active) {
        const strength = pointer.down ? 1800 : 400;
        const radius = pointer.down ? 120 : 90;
        const r2 = radius * radius;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 === 0 || d2 > r2) continue;
          const d = Math.sqrt(d2);
          const invD = 1 / d;

          // Attraction toward pointer (decays with distance)
          const falloff = 1 - d / radius;
          const f = strength * falloff;
          p.vx += f * dx * invD * dt;
          p.vy += f * dy * invD * dt;

          // Mild tangential stirring based on pointer velocity
          const swirl = pointer.down ? 900 : 300;
          p.vx += -dy * invD * swirl * falloff * (pointer.vx * 0.001) * dt;
          p.vy += dx * invD * swirl * falloff * (pointer.vy * 0.001) * dt;
        }
      }

      // Global attraction to center (keeps a resting blob).
      const centerX = width / 2;
      const centerY = height / 2;
      const centerStrength = 120;

      // Integrate + boundary conditions + damping
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Centering force
        const cdx = centerX - p.x;
        const cdy = centerY - p.y;
        p.vx += (centerStrength * cdx * dt) / width;
        p.vy += (centerStrength * cdy * dt) / height;

        p.vx *= damping;
        p.vy *= damping;

        // clamp speed
        const s2 = p.vx * p.vx + p.vy * p.vy;
        if (s2 > maxSpeed * maxSpeed) {
          const s = Math.sqrt(s2);
          const k = maxSpeed / s;
          p.vx *= k;
          p.vy *= k;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const pad = 6;
        if (p.x < pad) {
          p.x = pad;
          p.vx = Math.abs(p.vx) * 0.6;
        } else if (p.x > width - pad) {
          p.x = width - pad;
          p.vx = -Math.abs(p.vx) * 0.6;
        }
        if (p.y < pad) {
          p.y = pad;
          p.vy = Math.abs(p.vy) * 0.6;
        } else if (p.y > height - pad) {
          p.y = height - pad;
          p.vy = -Math.abs(p.vy) * 0.6;
        }
      }

      // Compute metaballs scalar field from particles.
      // field(x,y) = Σ exp(-d^2/(2*sigma^2))
      for (let gx = 0; gx < size; gx++) {
        const sx = gx * cellWidth;
        for (let gy = 0; gy < size; gy++) {
          const sy = gy * cellHeight;
          let sum = 0;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const dx = sx - p.x;
            const dy = sy - p.y;
            const d2 = dx * dx + dy * dy;
            sum += Math.exp(-d2 * invTwoSigma2);
          }
          field.setAt(gx, gy, sum);
        }
      }

      // Collect contour segments from marching squares.
      const segments: SegmentPoints[] = [];
      for (let x = 0; x < size - 1; ++x) {
        for (let y = 0; y < size - 1; ++y) {
          const vTL = field.readAt(x, y);
          const vTR = field.readAt(x + 1, y);
          const vBR = field.readAt(x + 1, y + 1);
          const vBL = field.readAt(x, y + 1);

          segments.push(
            ...cellSegments(
              iso,
              cellSize,
              x * cellWidth,
              y * cellHeight,
              vTL,
              vTR,
              vBR,
              vBL
            )
          );
        }
      }

      // Reconstruct contour loops from segments.
      const EPS = 1e-3;
      const keyForPoint = (p: Point) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;

      const unused = new Set<number>();
      for (let i = 0; i < segments.length; i++) unused.add(i);

      const loops: Point[][] = [];

      while (unused.size > 0) {
        const [startIndex] = unused;
        unused.delete(startIndex);
        const seg = segments[startIndex];

        const loop: Point[] = [seg.a, seg.b];

        let extended = true;
        while (extended) {
          extended = false;
          const end = loop[loop.length - 1];
          const endKey = keyForPoint(end);

          for (const idx of Array.from(unused)) {
            const s = segments[idx];
            const kA = keyForPoint(s.a);
            const kB = keyForPoint(s.b);
            if (kA === endKey) {
              loop.push(s.b);
              unused.delete(idx);
              extended = true;
              break;
            } else if (kB === endKey) {
              loop.push(s.a);
              unused.delete(idx);
              extended = true;
              break;
            }
          }
        }

        // Close loop if end is near start.
        const first = loop[0];
        const last = loop[loop.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        if (dx * dx + dy * dy < EPS * EPS) {
          loop[loop.length - 1] = first;
        }

        loops.push(loop);
      }

      // Fill and stroke each loop using a blue→green gradient.
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#1e3a8a"); // blue
      gradient.addColorStop(1, "#22c55e"); // green
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;

      for (const loop of loops) {
        if (loop.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(loop[0].x, loop[0].y);
        for (let i = 1; i < loop.length; i++) {
          ctx.lineTo(loop[i].x, loop[i].y);
        }
        ctx.closePath();
        ctx.fill();
        // ctx.stroke();
      }

      animationFrameIdRef.current = requestAnimationFrame(frame);
    };

    animationFrameIdRef.current = requestAnimationFrame(frame);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="marching-squares-canvas block mx-auto my-4 border border-black"
      width={800}
      height={800}
    />
  );
};
