"use client";

import { X, Shield, Repeat, Sparkles } from "lucide-react";

interface IncomingReferralModalProps {
  referrerAddress: string;
  existingRef: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onClear: () => void;
}

export function IncomingReferralModal({
  referrerAddress,
  existingRef,
  onAccept,
  onDecline,
  onClear,
}: IncomingReferralModalProps) {
  const truncated = `${referrerAddress.slice(0, 4)}...${referrerAddress.slice(-4)}`;
  const hasExisting = existingRef && existingRef !== referrerAddress;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center px-4"
      style={{ animation: "modal-entrance 0.35s ease-out" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDecline();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-md" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[380px] overflow-hidden border border-brand/25 bg-surface shadow-2xl"
        style={{
          animation: "modal-card-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.05s",
          boxShadow: "0 0 80px -20px rgba(201, 168, 76, 0.15), 0 25px 50px -12px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Top accent: animated gold line ── */}
        <div
          className="h-[2px] origin-left"
          style={{
            background: "linear-gradient(90deg, transparent, var(--brand), var(--brand-bright), var(--brand), transparent)",
            animation: "gold-line-draw 0.6s ease-out both 0.3s",
          }}
        />

        {/* Close */}
        <button
          onClick={onDecline}
          className="absolute right-4 top-4 z-20 text-text-3 hover:text-text-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Header zone ── */}
        <div
          className="relative px-7 pt-8 pb-0"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.2s" }}
        >
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-brand/70">
            Referral detected
          </p>
          <h2 className="mt-2 font-display text-[22px] font-bold leading-tight text-text-1">
            You&apos;ve been
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-bright) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              invited to earn
            </span>
          </h2>
        </div>

        {/* ── The big number — hero focal point ── */}
        <div
          className="relative px-7 pt-4 pb-1"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.35s" }}
        >
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-display text-[56px] font-bold leading-none tracking-tight"
              style={{
                background: "linear-gradient(180deg, var(--brand-bright) 0%, var(--brand) 60%, var(--brand-dim) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              10%
            </span>
            <span className="text-[14px] font-medium text-text-3 mb-2">
              of trading fees
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-text-3">
            Taken from the platform fee — costs you nothing extra.
          </p>
        </div>

        {/* ── Referrer card ── */}
        <div
          className="mx-7 mt-5 relative"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.45s" }}
        >
          <div className="border border-brand/15 bg-bg/80 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-3">
                  Referred by
                </p>
                <p className="mt-1 font-mono text-[15px] font-semibold text-text-1 tracking-wide">
                  {truncated}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center border border-brand/20 bg-brand/5"
                style={{ boxShadow: "0 0 20px -6px var(--glow-brand)" }}
              >
                <Sparkles className="h-4.5 w-4.5 text-brand" />
              </div>
            </div>
            <p className="mt-2 font-mono text-[10px] text-text-3/60 break-all leading-relaxed">
              {referrerAddress}
            </p>
          </div>
        </div>

        {/* ── Details ── */}
        <div
          className="mx-7 mt-4 flex gap-4"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.55s" }}
        >
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-buy" />
            <p className="text-[11px] leading-relaxed text-text-3">
              <span className="text-text-2">No extra cost</span> — fee is split from what you already pay
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Repeat className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            <p className="text-[11px] leading-relaxed text-text-3">
              <span className="text-text-2">Change anytime</span> with a different referral link
            </p>
          </div>
        </div>

        {/* ── Existing referral warning ── */}
        {hasExisting && (
          <div
            className="mx-7 mt-4 border border-status-graduating/20 bg-status-graduating/5 px-4 py-2.5"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.6s" }}
          >
            <p className="text-[12px] text-status-graduating">
              Replaces your current referral from{" "}
              <span className="font-mono font-medium">
                {existingRef!.slice(0, 4)}...{existingRef!.slice(-4)}
              </span>
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div
          className="px-7 pt-6 pb-7 flex gap-3"
          style={{ animation: "fade-in-up 0.5s ease-out both 0.65s" }}
        >
          <button
            onClick={onDecline}
            className="flex-1 border border-border py-3 text-[13px] font-medium text-text-3 hover:border-border-hover hover:text-text-1 transition-all duration-200"
          >
            No thanks
          </button>
          <button
            onClick={onAccept}
            className="group relative flex-1 overflow-hidden py-3 text-[13px] font-semibold text-bg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
          >
            <span
              className="absolute inset-0 bg-gradient-to-r from-brand via-brand-bright to-brand"
              style={{
                backgroundSize: "200% 100%",
                animation: "gradient-x 4s ease infinite",
              }}
            />
            <span className="relative font-display">Accept referral</span>
          </button>
        </div>

        {/* Clear option */}
        {hasExisting && (
          <div className="border-t border-border/50 px-7 py-3">
            <button
              onClick={onClear}
              className="w-full text-center text-[11px] text-text-3 hover:text-sell transition-colors"
            >
              Remove all referrals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
