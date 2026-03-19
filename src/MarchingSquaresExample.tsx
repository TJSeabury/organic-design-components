import React, { useEffect, useRef, useState } from "react";

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

const pointsNearXY = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  eps: number
) => Math.abs(ax - bx) <= eps && Math.abs(ay - by) <= eps;

const appendCellSegments = (
  out: number[],
  iso: number,
  cellSize: CellSize,
  x0: number,
  y0: number,
  vTL: number,
  vTR: number,
  vBR: number,
  vBL: number
): void => {
  // Compute interpolated intersection points along each edge.
  const x1 = x0 + cellSize.width;
  const y1 = y0 + cellSize.height;

  const tTop = edgeT(iso, vTL, vTR);
  const tRight = edgeT(iso, vTR, vBR);
  const tBottom = edgeT(iso, vBL, vBR);
  const tLeft = edgeT(iso, vTL, vBL);

  const pTopX = lerp(x0, x1, tTop);
  const pTopY = y0;
  const pRightX = x1;
  const pRightY = lerp(y0, y1, tRight);
  const pBottomX = lerp(x0, x1, tBottom);
  const pBottomY = y1;
  const pLeftX = x0;
  const pLeftY = lerp(y0, y1, tLeft);

  const mask =
    (vTL >= iso ? 0b0001 : 0) |
    (vTR >= iso ? 0b0010 : 0) |
    (vBR >= iso ? 0b0100 : 0) |
    (vBL >= iso ? 0b1000 : 0);

  const segments = caseSegments[mask] ?? [];
  if (segments.length === 0) return;

  for (let i = 0; i < segments.length; i++) {
    const [e0, e1] = segments[i];
    let xA = 0;
    let yA = 0;
    let xB = 0;
    let yB = 0;

    switch (e0) {
      case 0:
        xA = pTopX;
        yA = pTopY;
        break;
      case 1:
        xA = pRightX;
        yA = pRightY;
        break;
      case 2:
        xA = pBottomX;
        yA = pBottomY;
        break;
      case 3:
      default:
        xA = pLeftX;
        yA = pLeftY;
        break;
    }

    switch (e1) {
      case 0:
        xB = pTopX;
        yB = pTopY;
        break;
      case 1:
        xB = pRightX;
        yB = pRightY;
        break;
      case 2:
        xB = pBottomX;
        yB = pBottomY;
        break;
      case 3:
      default:
        xB = pLeftX;
        yB = pLeftY;
        break;
    }

    // Flat format: [x0, y0, x1, y1]
    out.push(xA, yA, xB, yB);
  }
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const size = 64;

type SimConfig = {
  particleCount: number;
  cohesionRadiusPx: number;
  repulsionRadiusPx: number;
  restDistancePx: number;
  cohesionStrength: number;
  repulsionStrength: number;
  damping: number;
  maxSpeed: number;
  debug: boolean;
  debugParticleRadius: number;
};

const defaultSimConfig: SimConfig = {
  particleCount: 200,
  cohesionRadiusPx: 50,
  repulsionRadiusPx: 40,
  restDistancePx: 33,
  cohesionStrength: 0.9,
  repulsionStrength: 3,
  damping: 0.997,
  maxSpeed: 1200,
  debug: true,
  debugParticleRadius: 1,
};

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
  const [simConfig, setSimConfig] = useState<SimConfig>(defaultSimConfig);
  const simConfigRef = useRef<SimConfig>(defaultSimConfig);
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
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1e3a8a"); // blue
    gradient.addColorStop(1, "#22c55e"); // green

    const spawnParticle = (): Particle => {
      const a = Math.random() * TAU;
      const r = Math.random() * Math.min(width, height) * 0.08;
      return {
        x: width / 2 + Math.cos(a) * r,
        y: height / 2 + Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
      };
    };

    // Initialize particles near the center
    particlesRef.current = Array.from(
      { length: simConfigRef.current.particleCount },
      spawnParticle
    );

    let lastNow = performance.now();
    // Separate from `lastNow` (which is used for the simulation dt clamp).
    // We measure the true rAF interval for FPS reporting.
    let lastRafNow = lastNow;
    const fpsWindow = 60;
    const fpsHistory = new Array<number>(fpsWindow).fill(0);
    let fpsIndex = 0;
    let fpsCount = 0;
    let fpsSum = 0;
    let prevPointerX = pointerRef.current.x;
    let prevPointerY = pointerRef.current.y;
    const segmentsBuffer: number[] = [];
    const loopsBuffer: number[][] = [];
    const segmentUsed: boolean[] = [];

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
      const rafIntervalMs = now - lastRafNow;
      lastRafNow = now;

      const instFps = rafIntervalMs > 0 ? 1000 / rafIntervalMs : 0;
      if (fpsCount < fpsWindow) {
        fpsHistory[fpsIndex] = instFps;
        fpsSum += instFps;
        fpsCount++;
      } else {
        fpsSum -= fpsHistory[fpsIndex];
        fpsHistory[fpsIndex] = instFps;
        fpsSum += instFps;
      }
      fpsIndex = (fpsIndex + 1) % fpsWindow;

      let fpsMin = Number.POSITIVE_INFINITY;
      let fpsMax = 0;
      for (let i = 0; i < fpsCount; i++) {
        const v = fpsHistory[i];
        if (v < fpsMin) fpsMin = v;
        if (v > fpsMax) fpsMax = v;
      }
      const fpsAvg = fpsCount > 0 ? fpsSum / fpsCount : 0;

      const dt = clamp((now - lastNow) / 1000, 0, 1 / 15);
      lastNow = now;

      const pointer = pointerRef.current;
      const particles = particlesRef.current;
      const cfg = simConfigRef.current;

      // Apply particle count changes live without remounting.
      if (particles.length < cfg.particleCount) {
        const needed = cfg.particleCount - particles.length;
        for (let i = 0; i < needed; i++) particles.push(spawnParticle());
      } else if (particles.length > cfg.particleCount) {
        particles.length = cfg.particleCount;
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "black";

      if (cfg.debug) {
        // FPS overlay (upper-left)
        ctx.save();
        ctx.font =
          "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(6, 6, 160, 52);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillText(`FPS min ${fpsMin.toFixed(0)}`, 12, 25);
        ctx.fillText(`avg ${fpsAvg.toFixed(0)}`, 12, 40);
        ctx.fillText(`max ${fpsMax.toFixed(0)}`, 12, 55);
        ctx.restore();
      }

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
      const cohesionR2 = cfg.cohesionRadiusPx * cfg.cohesionRadiusPx;
      const repulsionR2 = cfg.repulsionRadiusPx * cfg.repulsionRadiusPx;

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
            const disp = d - cfg.restDistancePx;
            const f = cfg.cohesionStrength * disp;
            fx += f * dx * invD;
            fy += f * dy * invD;
          }

          // Short-range repulsion
          if (d2 < repulsionR2) {
            const overlap = cfg.repulsionRadiusPx - d;
            const f = cfg.repulsionStrength * overlap;
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

        p.vx *= cfg.damping;
        p.vy *= cfg.damping;

        // clamp speed
        const s2 = p.vx * p.vx + p.vy * p.vy;
        if (s2 > cfg.maxSpeed * cfg.maxSpeed) {
          const s = Math.sqrt(s2);
          const k = cfg.maxSpeed / s;
          p.vx *= k;
          p.vy *= k;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const pad = 100;
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
      segmentsBuffer.length = 0;
      for (let x = 0; x < size - 1; ++x) {
        for (let y = 0; y < size - 1; ++y) {
          const vTL = field.readAt(x, y);
          const vTR = field.readAt(x + 1, y);
          const vBR = field.readAt(x + 1, y + 1);
          const vBL = field.readAt(x, y + 1);

          appendCellSegments(
            segmentsBuffer,
            iso,
            cellSize,
            x * cellWidth,
            y * cellHeight,
            vTL,
            vTR,
            vBR,
            vBL
          );
        }
      }

      // Reconstruct contour loops from segments.
      const EPS = 1e-3;
      const segmentCount = segmentsBuffer.length >> 2;
      segmentUsed.length = segmentCount;
      segmentUsed.fill(false);
      let loopCount = 0;

      for (let startIndex = 0; startIndex < segmentCount; startIndex++) {
        if (segmentUsed[startIndex]) continue;
        segmentUsed[startIndex] = true;
        const segBase = startIndex << 2;
        const loop = loopsBuffer[loopCount] ?? [];
        loop.length = 0;
        loop.push(
          segmentsBuffer[segBase],
          segmentsBuffer[segBase + 1],
          segmentsBuffer[segBase + 2],
          segmentsBuffer[segBase + 3]
        );

        let extended = true;
        while (extended) {
          extended = false;
          const endX = loop[loop.length - 2];
          const endY = loop[loop.length - 1];

          for (let idx = 0; idx < segmentCount; idx++) {
            if (segmentUsed[idx]) continue;
            const base = idx << 2;
            const ax = segmentsBuffer[base];
            const ay = segmentsBuffer[base + 1];
            const bx = segmentsBuffer[base + 2];
            const by = segmentsBuffer[base + 3];
            if (pointsNearXY(ax, ay, endX, endY, EPS)) {
              loop.push(bx, by);
              segmentUsed[idx] = true;
              extended = true;
              break;
            } else if (pointsNearXY(bx, by, endX, endY, EPS)) {
              loop.push(ax, ay);
              segmentUsed[idx] = true;
              extended = true;
              break;
            }
          }
        }

        // Close loop if end is near start.
        const firstX = loop[0];
        const firstY = loop[1];
        const lastX = loop[loop.length - 2];
        const lastY = loop[loop.length - 1];
        const dx = lastX - firstX;
        const dy = lastY - firstY;
        if (dx * dx + dy * dy < EPS * EPS) {
          loop[loop.length - 2] = firstX;
          loop[loop.length - 1] = firstY;
        }

        loopsBuffer[loopCount] = loop;
        loopCount++;
      }
      loopsBuffer.length = loopCount;

      // Fill and stroke each loop using a blue→green gradient.
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 1.5;

      for (const loop of loopsBuffer) {
        if (loop.length < 4) continue;
        ctx.beginPath();
        ctx.moveTo(loop[0], loop[1]);
        for (let i = 2; i < loop.length; i += 2) {
          ctx.lineTo(loop[i], loop[i + 1]);
        }
        ctx.closePath();
        ctx.fill();
      }

      if (cfg.debug === true) {
        for (const p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, cfg.debugParticleRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
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

  const updateConfig = <K extends keyof SimConfig>(
    key: K,
    value: SimConfig[K]
  ) => {
    setSimConfig((prev) => {
      const next = { ...prev, [key]: value };
      simConfigRef.current = next;
      return next;
    });
  };

  return (
    <div className="w-full flex items-start justify-center gap-4 my-4">
      <canvas
        ref={canvasRef}
        className="marching-squares-canvas block border border-black"
        width={800}
        height={800}
      />

      <aside className="w-[280px] shrink-0 rounded-md border border-white/10 bg-white/5 p-3 text-sm">
        <h3 className="font-semibold mb-3">Simulation Controls</h3>
        <div className="space-y-3">
          <label className="block">
            <div className="flex justify-between">
              <span>Particles</span>
              <span>{simConfig.particleCount}</span>
            </div>
            <input
              type="range"
              min={10}
              max={400}
              step={1}
              value={simConfig.particleCount}
              onChange={(e) =>
                updateConfig("particleCount", Number(e.target.value))
              }
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Cohesion Radius</span>
              <span>{simConfig.cohesionRadiusPx}</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={1}
              value={simConfig.cohesionRadiusPx}
              onChange={(e) =>
                updateConfig("cohesionRadiusPx", Number(e.target.value))
              }
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Repulsion Radius</span>
              <span>{simConfig.repulsionRadiusPx}</span>
            </div>
            <input
              type="range"
              min={5}
              max={150}
              step={1}
              value={simConfig.repulsionRadiusPx}
              onChange={(e) =>
                updateConfig("repulsionRadiusPx", Number(e.target.value))
              }
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Rest Distance</span>
              <span>{simConfig.restDistancePx}</span>
            </div>
            <input
              type="range"
              min={5}
              max={160}
              step={1}
              value={simConfig.restDistancePx}
              onChange={(e) =>
                updateConfig("restDistancePx", Number(e.target.value))
              }
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Cohesion Strength</span>
              <span>{simConfig.cohesionStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.01}
              value={simConfig.cohesionStrength}
              onChange={(e) =>
                updateConfig("cohesionStrength", Number(e.target.value))
              }
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Repulsion Strength</span>
              <span>{simConfig.repulsionStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={6}
              step={0.01}
              value={simConfig.repulsionStrength}
              onChange={(e) =>
                updateConfig("repulsionStrength", Number(e.target.value))
              }
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Damping</span>
              <span>{simConfig.damping.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={0.999}
              step={0.001}
              value={simConfig.damping}
              onChange={(e) => updateConfig("damping", Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Max Speed</span>
              <span>{simConfig.maxSpeed}</span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={10}
              value={simConfig.maxSpeed}
              onChange={(e) => updateConfig("maxSpeed", Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="flex items-center justify-between pt-1">
            <span>Debug Overlay</span>
            <input
              type="checkbox"
              checked={simConfig.debug}
              onChange={(e) => updateConfig("debug", e.target.checked)}
            />
          </label>

          <label className="block">
            <div className="flex justify-between">
              <span>Debug Particle Radius</span>
              <span>{simConfig.debugParticleRadius.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={simConfig.debugParticleRadius}
              onChange={(e) =>
                updateConfig("debugParticleRadius", Number(e.target.value))
              }
              className="w-full"
            />
          </label>
        </div>
      </aside>
    </div>
  );
};
