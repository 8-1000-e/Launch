"use client";

import { useState } from "react";
import { X, Loader2, ArrowRight, ChevronDown } from "lucide-react";

interface RegisterReferralModalProps {
  onConfirm: () => void;
  onDismiss: () => void;
  loading: boolean;
}

export function RegisterReferralModal({
  onConfirm,
  onDismiss,
  loading,
}: RegisterReferralModalProps) {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center px-4"
      style={{ animation: "modal-entrance 0.35s ease-out" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onDismiss();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-md" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] overflow-hidden bg-surface"
        style={{
          animation: "modal-card-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.05s",
          boxShadow: "0 0 120px -30px rgba(201, 168, 76, 0.2), 0 30px 60px -15px rgba(0,0,0,0.7)",
          border: "1px solid rgba(201, 168, 76, 0.2)",
        }}
      >
        {/* Close */}
        {!loading && (
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 z-30 text-text-3/50 hover:text-text-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* ═══ HERO — 10% massive ═══ */}
        <div
          className="relative overflow-hidden px-7 pt-8 pb-6"
          style={{
            background: "radial-gradient(ellipse 90% 70% at 20% 30%, rgba(201,168,76,0.07), transparent), radial-gradient(ellipse 50% 50% at 85% 60%, rgba(201,168,76,0.04), transparent)",
          }}
        >
          {/* Decorative arcs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-brand/8" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-brand/5" />

          {/* The number */}
          <div
            className="flex items-end gap-2"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.15s" }}
          >
            <span
              className="font-display text-[88px] font-bold leading-[0.8] tracking-tighter"
              style={{
                background: "linear-gradient(180deg, var(--brand-bright) 0%, var(--brand) 50%, var(--brand-dim) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              10
            </span>
            <div className="mb-1.5 flex flex-col">
              <span
                className="font-display text-[36px] font-bold leading-none"
                style={{
                  background: "linear-gradient(180deg, var(--brand-bright) 0%, var(--brand) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                %
              </span>
              <span className="mt-1 text-[11px] font-mono uppercase tracking-[0.15em] text-text-3">
                of every fee
              </span>
            </div>
          </div>

          {/* Headline */}
          <h2
            className="mt-4 font-display text-[20px] font-bold leading-tight text-text-1"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.25s" }}
          >
            Every trade they make,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-bright) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              you earn SOL.
            </span>
          </h2>

          {/* Punch line */}
          <p
            className="mt-3 text-[13px] italic text-text-3/80 border-l-2 border-brand/30 pl-3"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.35s" }}
          >
            Your friends trade with their money.
            <br />
            <span className="text-brand font-medium not-italic">You get paid for it.</span>
          </p>

          {/* Social proof bar */}
          <div
            className="mt-5 inline-flex items-center gap-2 border border-brand/15 bg-brand/5 px-3 py-1.5"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.42s" }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            <p className="text-[11px] text-brand/80">
              <span className="font-semibold text-brand">127 people</span> earned SOL this week
              <span className="mx-1.5 text-brand/30">·</span>
              Top: <span className="font-mono font-semibold text-brand">4.2 SOL</span>
            </p>
          </div>
        </div>

        {/* ═══ HOW IT WORKS — collapsible stepper ═══ */}
        <div
          className="mx-7 mt-1"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.5s" }}
        >
          <button
            onClick={() => setHowOpen(!howOpen)}
            className="flex w-full items-center justify-between py-2 text-[11px] text-text-3 hover:text-text-2 transition-colors"
          >
            <span>How it works</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${howOpen ? "rotate-180" : ""}`} />
          </button>

          {howOpen && (
            <div className="pb-1 pt-1 space-y-0">
              {[
                { num: "1", title: "Register", detail: "One click, one small on-chain tx", last: false },
                { num: "2", title: "Share your link", detail: "Send it to friends, post it anywhere", last: false },
                { num: "3", title: "Earn SOL", detail: "Every trade they make, you get 10% of the fee", last: true },
              ].map((step) => (
                <div key={step.num} className="flex gap-3">
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand/8">
                      <span className="text-[10px] font-mono font-bold text-brand">{step.num}</span>
                    </div>
                    {!step.last && (
                      <div className="w-px flex-1 bg-gradient-to-b from-brand/20 to-transparent my-0.5" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={step.last ? "pb-0" : "pb-3"}>
                    <p className="text-[13px] font-semibold text-text-1 leading-6">{step.title}</p>
                    <p className="text-[11px] text-text-3 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ ACTIONS ═══ */}
        <div
          className="px-7 pt-6 pb-6 flex gap-3"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.6s" }}
        >
          <button
            onClick={onDismiss}
            disabled={loading}
            className="w-[85px] shrink-0 border border-border py-3 text-[13px] font-medium text-text-3 hover:border-border-hover hover:text-text-1 transition-all duration-200 disabled:opacity-50"
          >
            Later
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="group relative flex-1 overflow-hidden py-3 text-[13px] font-semibold text-bg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            style={!loading ? { animation: "pulse-glow 3s ease-in-out infinite" } : undefined}
          >
            <span
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, var(--brand), var(--brand-bright), var(--brand))",
                backgroundSize: "200% 100%",
                animation: "gradient-x 4s ease infinite",
              }}
            />
            <span className="relative font-display flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  Become a Referrer
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
