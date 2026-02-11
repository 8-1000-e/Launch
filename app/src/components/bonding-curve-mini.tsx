"use client";

import { useEffect, useRef } from "react";

/* ─── Mini animated bonding curve SVG ─── */

export function BondingCurveMini({
  progress,
  color,
}: {
  progress: number; // 0-100
  color: string;
}) {
  const dotRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);

  // Bonding curve shape: y = x^1.6 (convex)
  const W = 280;
  const H = 80;
  const PAD = 8;

  const pts: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = PAD + t * (W - PAD * 2);
    const y = H - PAD - Math.pow(t, 1.6) * (H - PAD * 2);
    pts.push(`${x},${y}`);
  }
  const curvePath = pts.join(" ");

  // Area fill path
  const areaPath = `M${PAD},${H - PAD} ` + pts.map((p) => `L${p}`).join(" ") + ` L${W - PAD},${H - PAD} Z`;

  // Current position on curve
  const p = Math.min(1, Math.max(0, progress / 100));
  const dotX = PAD + p * (W - PAD * 2);
  const dotY = H - PAD - Math.pow(p, 1.6) * (H - PAD * 2);

  // Graduation threshold line (at 100%)
  const threshY = H - PAD - Math.pow(1, 1.6) * (H - PAD * 2);

  // Animate the pulsing dot
  useEffect(() => {
    let frame: number;
    let t = 0;
    function tick() {
      t += 0.04;
      const scale = 1 + Math.sin(t * 2) * 0.3;
      const opacity = 0.4 + Math.sin(t * 2) * 0.2;
      if (dotRef.current) {
        dotRef.current.setAttribute("r", String(3 * scale));
      }
      if (glowRef.current) {
        glowRef.current.setAttribute("r", String(8 * scale));
        glowRef.current.setAttribute("opacity", String(opacity));
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="mini-curve-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="mini-stroke-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset={`${progress}%`} stopColor={color} stopOpacity="1" />
          <stop offset={`${Math.min(100, progress + 1)}%`} stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
        <filter id="mini-glow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={PAD}
          y1={H - PAD - t * (H - PAD * 2)}
          x2={W - PAD}
          y2={H - PAD - t * (H - PAD * 2)}
          stroke="var(--border)"
          strokeWidth="0.5"
          opacity="0.4"
        />
      ))}

      {/* Graduation threshold dashed line */}
      <line
        x1={PAD}
        y1={threshY}
        x2={W - PAD}
        y2={threshY}
        stroke="var(--status-graduating)"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <text
        x={W - PAD - 2}
        y={threshY - 4}
        textAnchor="end"
        fontSize="7"
        fill="var(--status-graduating)"
        opacity="0.7"
      >
        85 SOL
      </text>

      {/* Area fill under curve */}
      <path d={areaPath} fill="url(#mini-curve-grad)" />

      {/* Curve line */}
      <polyline
        points={curvePath}
        fill="none"
        stroke="url(#mini-stroke-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glow behind dot */}
      <circle
        ref={glowRef}
        cx={dotX}
        cy={dotY}
        r="8"
        fill={color}
        opacity="0.4"
        filter="url(#mini-glow)"
      />

      {/* Pulsing dot at current position */}
      <circle
        ref={dotRef}
        cx={dotX}
        cy={dotY}
        r="3"
        fill={color}
      />

      {/* Inner bright dot */}
      <circle
        cx={dotX}
        cy={dotY}
        r="1.5"
        fill="white"
        opacity="0.8"
      />
    </svg>
  );
}
