"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";

// Gold-themed confetti per boss specs
const CONFETTI_SHADES = ["#c9a84c", "#dbb85e", "#8a7034", "#e8d08c", "#a8873a"];
const CONFETTI_COUNT = 50;

interface CelebrationModalProps {
  referralLink: string;
  onClose: () => void;
}

export function CelebrationModal({ referralLink, onClose }: CelebrationModalProps) {
  const [copied, setCopied] = useState(false);

  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: CONFETTI_SHADES[i % CONFETTI_SHADES.length],
        delay: `${Math.random() * 2}s`,
        duration: `${2.5 + Math.random() * 2}s`,
        size: 4 + Math.random() * 6,
        rotation: Math.random() > 0.5,
      })),
    [],
  );

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareX() {
    const text = encodeURIComponent(
      `I'm now a referrer on the launchpad! Every trade earns me SOL.\n\n${referralLink}`,
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  }

  function handleShareTelegram() {
    const text = encodeURIComponent(
      `I'm now a referrer on the launchpad! Every trade earns me SOL.`,
    );
    const url = encodeURIComponent(referralLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  }

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center px-4"
      style={{ animation: "modal-entrance 0.3s ease-out" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-md" />

      {/* Gold confetti */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="pointer-events-none absolute top-0"
          style={{
            left: c.left,
            width: c.size,
            height: c.size,
            borderRadius: c.rotation ? "50%" : "1px",
            background: c.color,
            animation: `confetti-fall ${c.duration} ${c.delay} ease-in forwards`,
          }}
        />
      ))}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[400px] overflow-hidden bg-surface text-center"
        style={{
          animation: "modal-card-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.1s",
          boxShadow: "0 0 120px -30px rgba(201, 168, 76, 0.25), 0 30px 60px -15px rgba(0,0,0,0.7)",
          border: "1px solid rgba(201, 168, 76, 0.25)",
        }}
      >
        {/* Top gold line */}
        <div
          className="h-[2px] origin-left"
          style={{
            background: "linear-gradient(90deg, transparent, var(--brand), var(--brand-bright), var(--brand), transparent)",
            animation: "gold-line-draw 0.6s ease-out both 0.3s",
          }}
        />

        <div className="px-7 pt-8 pb-7">
          {/* Emoji */}
          <div
            className="text-[48px] leading-none"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.2s" }}
          >
            🎉
          </div>

          {/* Headline */}
          <h2
            className="mt-3 font-display text-[24px] font-bold text-text-1"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.3s" }}
          >
            You&apos;re in. Start sharing.
          </h2>

          <p
            className="mt-2 text-[13px] text-text-3"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.4s" }}
          >
            Every trade made through this link earns you SOL.{" "}
            <span className="text-text-2 font-medium">Forever.</span>
          </p>

          {/* Referral link */}
          <div
            className="mt-6 flex items-center gap-2 border border-brand/20 bg-bg/60 px-3 py-2.5"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.5s" }}
          >
            <p className="flex-1 truncate text-left font-mono text-[12px] text-text-2">
              {referralLink}
            </p>
            <button
              onClick={handleCopy}
              className="shrink-0 text-brand hover:text-brand-bright transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Share buttons */}
          <div
            className="mt-3 grid grid-cols-3 gap-2"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.6s" }}
          >
            <button
              onClick={handleCopy}
              className="border border-border py-2.5 text-[12px] font-medium text-text-1 hover:border-brand/30 hover:bg-brand/5 transition-colors"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={handleShareX}
              className="border border-border py-2.5 text-[12px] font-medium text-text-1 hover:border-brand/30 hover:bg-brand/5 transition-colors"
            >
              Share on 𝕏
            </button>
            <button
              onClick={handleShareTelegram}
              className="border border-border py-2.5 text-[12px] font-medium text-text-1 hover:border-brand/30 hover:bg-brand/5 transition-colors"
            >
              Telegram
            </button>
          </div>

          {/* Done */}
          <button
            onClick={onClose}
            className="group relative mt-5 w-full overflow-hidden py-3 text-[13px] font-semibold text-bg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.7s" }}
          >
            <span
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, var(--brand), var(--brand-bright), var(--brand))",
                backgroundSize: "200% 100%",
                animation: "gradient-x 4s ease infinite",
              }}
            />
            <span className="relative font-display">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
