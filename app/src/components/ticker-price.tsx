"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Odometer-style price ticker ─── */

function Digit({ value, flash }: { value: string; flash: "up" | "down" | null }) {
  const [prev, setPrev] = useState(value);
  const [anim, setAnim] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (value !== prev) {
      setAnim(true);
      const t = setTimeout(() => {
        setPrev(value);
        setAnim(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  const isNum = /\d/.test(value);

  if (!isNum) {
    return (
      <span className="inline-block" style={{ width: value === "." ? "0.35em" : "0.5em" }}>
        {value}
      </span>
    );
  }

  const flashColor =
    flash === "up" ? "var(--buy)" : flash === "down" ? "var(--sell)" : undefined;

  return (
    <span
      ref={spanRef}
      className="relative inline-block overflow-hidden"
      style={{
        width: "0.62em",
        height: "1.15em",
        verticalAlign: "bottom",
      }}
    >
      {/* Old digit (slides out) */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-transform duration-250 ease-out"
        style={{
          transform: anim ? "translateY(-100%)" : "translateY(0)",
          color: flashColor,
        }}
      >
        {prev}
      </span>
      {/* New digit (slides in) */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-transform duration-250 ease-out"
        style={{
          transform: anim ? "translateY(0)" : "translateY(100%)",
          color: flashColor,
        }}
      >
        {value}
      </span>
    </span>
  );
}

export function TickerPrice({
  price,
  decimals = 6,
  flash,
  className = "",
}: {
  price: number;
  decimals?: number;
  flash: "up" | "down" | null;
  className?: string;
}) {
  const formatted = price.toFixed(decimals);
  const chars = formatted.split("");

  return (
    <span className={`inline-flex font-mono font-bold tabular-nums ${className}`}>
      {chars.map((ch, i) => (
        <Digit key={`${i}-${ch}`} value={ch} flash={flash} />
      ))}
    </span>
  );
}
