"use client";

import { useCallback, useRef } from "react";

/* ─── Canvas particle burst from a button click ─── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function useButtonParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  const ensureCanvas = useCallback(() => {
    if (canvasRef.current) return canvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ro = new ResizeObserver(() => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    ro.observe(document.documentElement);

    return canvas;
  }, []);

  const burst = useCallback(
    (e: React.MouseEvent, color: string) => {
      const canvas = ensureCanvas();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Spawn particles
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // slight upward bias
          life: 1,
          maxLife: 0.6 + Math.random() * 0.4,
          size: 2 + Math.random() * 3,
          color,
        });
      }

      // Start animation loop if not running
      if (!frameRef.current) {
        let lastTime = performance.now();

        function animate(now: number) {
          const dt = Math.min(0.05, (now - lastTime) / 1000);
          lastTime = now;

          ctx!.clearRect(0, 0, canvas.width, canvas.height);

          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 6 * dt; // gravity
            p.life -= dt / p.maxLife;

            if (p.life <= 0) {
              particles.splice(i, 1);
              continue;
            }

            ctx!.globalAlpha = p.life;
            ctx!.fillStyle = p.color;
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx!.fill();
          }

          if (particles.length > 0) {
            frameRef.current = requestAnimationFrame(animate);
          } else {
            frameRef.current = 0;
            ctx!.clearRect(0, 0, canvas.width, canvas.height);
          }
        }

        frameRef.current = requestAnimationFrame(animate);
      }
    },
    [ensureCanvas],
  );

  return burst;
}
