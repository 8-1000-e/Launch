"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Star,
  Rocket,
  Layers,
  Activity,
  Clock,
  Gift,
  Link2,
  Coins,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useToast } from "@/components/toast";
import { useTokenLaunchpad } from "@/hooks/use-token-launchpad";
import { TokenLaunchpadClient } from "@sdk/client";
import { getReferralPda } from "@sdk/pda";
import {
  useProfileData,
  type ProfileHolding,
  type ProfileTrade,
  type ProfileCreatedToken,
} from "@/hooks/use-profile-data";

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function shorten(addr: string) {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function walletHue(addr: string): number {
  return addr.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/** SOL amount with subscript notation for very small values: 0.0₅123 */
function SolAmount({ value }: { value: number }) {
  if (value === 0) return <>0</>;
  if (value >= 0.001) return <>{value.toFixed(4)}</>;

  const str = value.toFixed(20);
  const dot = str.indexOf(".");
  let zeros = 0;
  for (let i = dot + 1; i < str.length; i++) {
    if (str[i] !== "0") break;
    zeros++;
  }
  const sigDigits = str.slice(dot + 1 + zeros, dot + 1 + zeros + 4).replace(/0+$/, "") || "0";

  return (
    <>0.0<sub className="text-[0.65em] opacity-60">{zeros}</sub>{sigDigits}</>
  );
}

/* ─── Animated counter hook ─── */
function useAnimatedCounter(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

/* ─── Loading skeleton ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface/60 ${className}`}
      style={{ borderRadius: 2 }}
    />
  );
}

/* ═══════════════════════════════════════════════
   ACTIVITY HEATMAP (GitHub-style)
   ═══════════════════════════════════════════════ */

function ActivityHeatmap({ data }: { data: number[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const weeks = 13;
  const cellSize = 14;
  const maxVal = Math.max(...data, 1);

  function intensityColor(val: number): string {
    if (val === 0) return "var(--border)";
    const pct = val / maxVal;
    if (pct < 0.25) return "rgba(201,168,76,0.2)";
    if (pct < 0.5) return "rgba(201,168,76,0.4)";
    if (pct < 0.75) return "rgba(201,168,76,0.65)";
    return "rgba(201,168,76,0.9)";
  }

  const days = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pr-2">
          {days.map((d, i) => (
            <div
              key={i}
              className="flex items-center text-[9px] text-text-3"
              style={{ height: cellSize }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px]">
          {Array.from({ length: weeks }, (_, week) => (
            <div key={week} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, day) => {
                const idx = week * 7 + day;
                if (idx >= data.length) return <div key={day} style={{ width: cellSize, height: cellSize }} />;
                const val = data[idx];
                const daysAgo = data.length - 1 - idx;
                return (
                  <div
                    key={day}
                    className="cursor-pointer transition-all duration-150 hover:scale-125"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: intensityColor(val),
                      borderRadius: 2,
                      animation: `fade-in-up 0.3s ease-out both ${idx * 8}ms`,
                    }}
                    onMouseEnter={(e) => {
                      if (!containerRef.current) return;
                      const cellRect = e.currentTarget.getBoundingClientRect();
                      const parentRect = containerRef.current.getBoundingClientRect();
                      setTooltip({
                        x: cellRect.left - parentRect.left + cellRect.width / 2,
                        y: cellRect.top - parentRect.top - 8,
                        text: `${val} trade${val !== 1 ? "s" : ""} · ${daysAgo}d ago`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full px-2 py-1 text-[10px] font-mono text-text-1 bg-surface border border-border shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-text-3">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: pct === 0 ? "var(--border)" : `rgba(201,168,76,${0.2 + pct * 0.7})`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   IDENTICON (procedural avatar from address)
   ═══════════════════════════════════════════════ */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Identicon({ address, size = 64 }: { address: string; size?: number }) {
  const hue = walletHue(address);
  const hash = address.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRandom(hash);

  const grid = 5;
  const cellSize = size / grid;
  const cells: { x: number; y: number }[] = [];

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < Math.ceil(grid / 2); x++) {
      if (rng() > 0.4) {
        cells.push({ x, y });
        if (x !== grid - 1 - x) {
          cells.push({ x: grid - 1 - x, y });
        }
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} rx={4} fill={`hsl(${hue}, 35%, 15%)`} />
      {cells.map((c, i) => (
        <rect
          key={i}
          x={c.x * cellSize}
          y={c.y * cellSize}
          width={cellSize}
          height={cellSize}
          fill={`hsl(${hue}, 55%, 55%)`}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */

type Tab = "portfolio" | "history" | "created" | "referrals";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [tab, setTab] = useState<Tab>("portfolio");
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  const { publicKey } = useWallet();
  const isOwnProfile = publicKey?.toBase58() === address;

  const { portfolio, tradeHistory, createdTokens, stats, activityMap, loading } =
    useProfileData(address);

  const animatedPnl = useAnimatedCounter(
    loading ? 0 : Math.abs(Math.floor(stats.pnl * 10)),
    2000,
  );
  const animatedTrades = useAnimatedCounter(loading ? 0 : stats.trades, 1800);
  const animatedVolume = useAnimatedCounter(
    loading ? 0 : Math.floor(stats.volume),
    2200,
  );

  const hue = walletHue(address);

  const hasTabs: Tab[] = useMemo(() => {
    const t: Tab[] = ["portfolio", "history"];
    if (createdTokens.length > 0) t.push("created");
    if (isOwnProfile) t.push("referrals");
    return t;
  }, [createdTokens.length, isOwnProfile]);

  function handleCopy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabLabels: Record<Tab, { label: string; icon: typeof Wallet }> = {
    portfolio: { label: "Portfolio", icon: Layers },
    history: { label: "Trade History", icon: Activity },
    created: { label: "Created", icon: Rocket },
    referrals: { label: "Referrals", icon: Gift },
  };

  return (
    <>
      <Navbar />

      {/* ─── Background effects ─── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "90%",
            height: "55%",
            background:
              "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 450,
            height: 450,
            top: "5%",
            right: "15%",
            borderRadius: "50%",
            background: `hsl(${hue}, 50%, 50%)`,
            opacity: 0.04,
            filter: "blur(120px)",
            animation: "float-orb-1 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 350,
            height: 350,
            bottom: "20%",
            left: "5%",
            borderRadius: "50%",
            background: "var(--brand)",
            opacity: 0.03,
            filter: "blur(100px)",
            animation: "float-orb-2 30s ease-in-out infinite",
          }}
        />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10">
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-20 sm:px-6">
          {/* Back link */}
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-[12px] text-text-3 transition-colors hover:text-text-2"
            style={{ animation: "fade-in-up 0.3s ease-out both" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Leaderboard
          </Link>

          {/* ═══════════════════════════════════════════
              BANNER
              ═══════════════════════════════════════════ */}
          <div
            className="relative mt-4 h-[140px] w-full overflow-hidden sm:h-[170px]"
            style={{
              background: `linear-gradient(135deg, hsl(${hue},45%,18%) 0%, hsl(${(hue + 40) % 360},40%,12%) 50%, hsl(${(hue + 80) % 360},35%,10%) 100%)`,
              animation: "fade-in-up 0.4s ease-out both",
            }}
          >
            {/* Noise pattern on banner */}
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 0.5px)",
                backgroundSize: "16px 16px",
              }}
            />
            {/* Gradient mesh blobs */}
            <div
              className="absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]"
              style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
            />
            <div
              className="absolute left-1/4 bottom-0 h-[120px] w-[250px] rounded-full opacity-15 blur-[50px]"
              style={{ backgroundColor: `hsl(${(hue + 60) % 360}, 50%, 45%)` }}
            />
            <div
              className="absolute right-1/3 top-1/2 h-[100px] w-[100px] rounded-full opacity-20 blur-[40px]"
              style={{ backgroundColor: `hsl(${(hue + 120) % 360}, 55%, 55%)` }}
            />
          </div>

          {/* ═══════════════════════════════════════════
              PROFILE HEADER
              ═══════════════════════════════════════════ */}
          <div
            className="relative px-1"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.1s" }}
          >
            {/* Avatar — overlaps banner */}
            <div className="-mt-10 mb-3 rounded-lg overflow-hidden border-[3px] border-bg shadow-lg inline-block">
              <Identicon address={address} size={72} />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 min-w-0">
              <div className="min-w-0">
                {/* Address */}
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-xl font-bold text-text-1 sm:text-2xl font-mono">
                    {shorten(address)}
                  </h1>
                  <button
                    onClick={handleCopy}
                    className="text-text-3 transition-colors hover:text-text-1"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-buy" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={`https://solscan.io/account/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-3 transition-colors hover:text-text-1"
                    title="View on Solscan"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <p className="mt-1 text-[12px] text-text-3 font-mono break-all sm:hidden">
                  {address}
                </p>
              </div>
            </div>

            {/* ─── Stats grid ─── */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {/* PnL */}
              <div style={{ animation: `fade-in-up 0.4s ease-out both 200ms` }}>
                <p className="text-[10px] uppercase tracking-wider text-text-3">PnL</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p
                    className="mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl"
                    style={{
                      color: stats.pnl >= 0 ? "var(--buy)" : "var(--sell)",
                      textShadow: `0 0 16px ${stats.pnl >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}
                  >
                    {stats.pnl >= 0 ? "+" : "-"}
                    {(animatedPnl / 10).toFixed(1)}
                    <span className="ml-0.5 text-[11px] font-normal opacity-60">SOL</span>
                  </p>
                )}
              </div>

              {/* Win Rate */}
              <div style={{ animation: `fade-in-up 0.4s ease-out both 300ms` }}>
                <p className="text-[10px] uppercase tracking-wider text-text-3">Win Rate</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-16" />
                ) : (
                  <p
                    className="mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl"
                    style={{ color: stats.winRate >= 50 ? "var(--buy)" : "var(--sell)" }}
                  >
                    {stats.winRate}%
                  </p>
                )}
              </div>

              {/* Trades */}
              <div style={{ animation: `fade-in-up 0.4s ease-out both 400ms` }}>
                <p className="text-[10px] uppercase tracking-wider text-text-3">Trades</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-16" />
                ) : (
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-text-1 sm:text-2xl">
                    {animatedTrades.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Volume */}
              <div style={{ animation: `fade-in-up 0.4s ease-out both 500ms` }}>
                <p className="text-[10px] uppercase tracking-wider text-text-3">Volume</p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-20" />
                ) : (
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-text-1 sm:text-2xl">
                    {animatedVolume.toLocaleString()}
                    <span className="ml-0.5 text-[11px] font-normal text-text-3">SOL</span>
                  </p>
                )}
              </div>

              {/* Tokens Created */}
              {!loading && stats.tokensCreated > 0 && (
                <div style={{ animation: `fade-in-up 0.4s ease-out both 600ms` }}>
                  <p className="text-[10px] uppercase tracking-wider text-text-3">Created</p>
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-text-1 sm:text-2xl">
                    {stats.tokensCreated}
                  </p>
                </div>
              )}

              {/* Tokens Graduated */}
              {!loading && stats.tokensGraduated > 0 && (
                <div style={{ animation: `fade-in-up 0.4s ease-out both 700ms` }}>
                  <p className="text-[10px] uppercase tracking-wider text-text-3">Graduated</p>
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-brand sm:text-2xl">
                    {stats.tokensGraduated}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              ACTIVITY HEATMAP
              ═══════════════════════════════════════════ */}
          <div
            className="mt-8 border border-border bg-surface/40 p-4 sm:p-5"
            style={{ animation: "fade-in-up 0.5s ease-out both 0.4s" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-medium uppercase tracking-wider text-text-3">
                Trading Activity
              </h3>
              <span className="text-[10px] text-text-3">Last 91 days</span>
            </div>
            <ActivityHeatmap data={activityMap} />
          </div>

          {/* ═══════════════════════════════════════════
              TABS
              ═══════════════════════════════════════════ */}
          <div
            className="mt-8 flex items-center border-b border-border"
            style={{ animation: "fade-in-up 0.4s ease-out both 0.5s" }}
          >
            {hasTabs.map((t) => {
              const { label, icon: Icon } = tabLabels[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors ${
                    tab === t ? "text-text-1" : "text-text-3 hover:text-text-2"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(" ")[0]}</span>
                  {t === "created" && !loading && (
                    <span className="ml-1 text-[10px] text-text-3">{createdTokens.length}</span>
                  )}
                  {tab === t && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{
                        background: "var(--brand)",
                        boxShadow: "0 0 8px rgba(201,168,76,0.4)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════
              TAB CONTENT
              ═══════════════════════════════════════════ */}
          <div className="mt-6" style={{ animation: "fade-in-up 0.4s ease-out both 0.55s" }}>
            {tab === "portfolio" && (
              <PortfolioTab portfolio={portfolio} mounted={mounted} loading={loading} />
            )}
            {tab === "history" && (
              <TradeHistoryTab trades={tradeHistory} mounted={mounted} loading={loading} />
            )}
            {tab === "created" && (
              <CreatedTokensTab tokens={createdTokens} mounted={mounted} loading={loading} />
            )}
            {tab === "referrals" && (
              <ReferralsTab
                mounted={mounted}
                isOwnProfile={isOwnProfile}
                address={address}
              />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════
   PORTFOLIO TAB
   ═══════════════════════════════════════════════ */

function PortfolioTab({
  portfolio,
  mounted,
  loading,
}: {
  portfolio: ProfileHolding[];
  mounted: boolean;
  loading: boolean;
}) {
  const sorted = useMemo(
    () => [...portfolio].sort((a, b) => b.valueSol - a.valueSol),
    [portfolio],
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border border-border bg-surface/40 p-3 sm:p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-3">
        <Wallet className="h-8 w-8 mb-3 opacity-40" />
        <p className="text-[13px]">No tokens held</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((token, i) => {
        const avatarHue = token.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

        const inner = (
          <>
            {/* Token avatar */}
            {token.isSol ? (
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt="SOL"
                className="h-9 w-9 shrink-0 rounded-full"
              />
            ) : token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-bg"
                style={{ background: `hsl(${avatarHue}, 55%, 50%)` }}
              >
                {token.symbol.charAt(0)}
              </div>
            )}

            {/* Name + symbol */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-text-1 truncate">{token.name}</p>
              <p className="text-[11px] font-mono text-text-3">${token.symbol}</p>
            </div>

            {/* Balance */}
            <div className="text-right hidden md:block">
              <p className="font-mono text-[12px] tabular-nums text-text-2">
                {token.isSol ? token.balance.toFixed(4) : formatNum(token.balance)}
              </p>
              {!token.isSol && (
                <p className="text-[10px] text-text-3">{token.pctSupply}% supply</p>
              )}
            </div>

            {/* Value */}
            <div className="text-right min-w-[70px]">
              <p className="font-mono text-[13px] font-medium tabular-nums text-text-1">
                {token.valueSol.toFixed(2)}
                <span className="ml-0.5 text-[10px] font-normal text-text-3">SOL</span>
              </p>
              {!token.isSol && (
                <p
                  className="font-mono text-[11px] tabular-nums font-medium"
                  style={{ color: token.pnl >= 0 ? "var(--buy)" : "var(--sell)" }}
                >
                  {token.pnl >= 0 ? "+" : ""}
                  {token.pnl.toFixed(1)}%
                </p>
              )}
            </div>
          </>
        );

        const className = "group flex items-center gap-4 border border-border bg-surface/40 p-3 sm:p-4 transition-colors hover:bg-surface-hover/50 hover:border-border-hover";
        const style = {
          animation: mounted ? `fade-in-up 0.3s ease-out both ${i * 50}ms` : "none",
        };

        if (token.isSol) {
          return (
            <div key={token.mint} className={className} style={style}>
              {inner}
            </div>
          );
        }

        return (
          <Link key={token.mint} href={`/token/${token.mint}`} className={className} style={style}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TRADE HISTORY TAB
   ═══════════════════════════════════════════════ */

/** Price with subscript notation for very small values: 0.0₅123 */
function TradePrice({ value }: { value: number }) {
  if (value === 0) return <>0</>;
  if (value >= 1) return <>{value.toFixed(4)}</>;
  if (value >= 0.001) return <>{value.toFixed(6)}</>;

  // Very small: subscript notation
  const str = value.toFixed(20);
  const dot = str.indexOf(".");
  let zeros = 0;
  for (let i = dot + 1; i < str.length; i++) {
    if (str[i] !== "0") break;
    zeros++;
  }
  const sigDigits = str.slice(dot + 1 + zeros, dot + 1 + zeros + 4).replace(/0+$/, "") || "0";

  return (
    <>0.0<sub className="text-[0.65em] opacity-60">{zeros}</sub>{sigDigits}</>
  );
}

function TradeHistoryTab({
  trades,
  mounted,
  loading,
}: {
  trades: ProfileTrade[];
  mounted: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="border border-border bg-surface/40 p-4 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-3">
        <Activity className="h-8 w-8 mb-3 opacity-40" />
        <p className="text-[13px]">No trades found</p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-3">
              <th className="py-3 pl-4 pr-2 font-medium">Time</th>
              <th className="py-3 px-2 font-medium">Token</th>
              <th className="py-3 px-2 font-medium">Type</th>
              <th className="py-3 px-2 font-medium text-right">SOL</th>
              <th className="py-3 px-2 font-medium text-right hidden sm:table-cell">Tokens</th>
              <th className="py-3 pl-2 pr-4 font-medium text-right hidden md:table-cell">Price</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => {
              const avatarHue = trade.tokenName.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
              return (
                <tr
                  key={trade.signature}
                  className="border-b border-border/50 transition-colors hover:bg-surface-hover/50 last:border-0"
                  style={{
                    animation: mounted ? `fade-in-up 0.3s ease-out both ${i * 30}ms` : "none",
                  }}
                >
                  <td className="py-2.5 pl-4 pr-2">
                    <span className="text-[11px] text-text-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(trade.timestamp)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <Link
                      href={`/token/${trade.mint}`}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {trade.tokenImage ? (
                        <img
                          src={trade.tokenImage}
                          alt={trade.tokenSymbol}
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-bg"
                          style={{ background: `hsl(${avatarHue}, 55%, 50%)` }}
                        >
                          {trade.tokenName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-text-1 truncate max-w-[80px]">
                          {trade.tokenName}
                        </p>
                        <p className="text-[10px] font-mono text-text-3">${trade.tokenSymbol}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        background: trade.type === "buy" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: trade.type === "buy" ? "var(--buy)" : "var(--sell)",
                      }}
                    >
                      {trade.type === "buy" ? (
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowDownRight className="h-2.5 w-2.5" />
                      )}
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-[12px] font-medium tabular-nums text-text-1">
                    {trade.solAmount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-[11px] tabular-nums text-text-2 hidden sm:table-cell">
                    {formatNum(trade.tokenAmount)}
                  </td>
                  <td className="py-2.5 pl-2 pr-4 text-right font-mono text-[11px] tabular-nums text-text-3 hidden md:table-cell">
                    <TradePrice value={trade.price} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CREATED TOKENS TAB
   ═══════════════════════════════════════════════ */

function CreatedTokensTab({
  tokens,
  mounted,
  loading,
}: {
  tokens: ProfileCreatedToken[];
  mounted: boolean;
  loading: boolean;
}) {
  const sorted = useMemo(
    () =>
      [...tokens].sort(
        (a, b) =>
          (b.graduated ? 1 : 0) - (a.graduated ? 1 : 0) ||
          b.virtualSol - a.virtualSol,
      ),
    [tokens],
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border border-border bg-surface/40 p-3 sm:p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-3">
        <Rocket className="h-8 w-8 mb-3 opacity-40" />
        <p className="text-[13px]">No tokens created</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((token, i) => {
        const avatarHue = token.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
        return (
          <Link
            key={token.mint}
            href={`/token/${token.mint}`}
            className="group flex items-center gap-4 border border-border bg-surface/40 p-3 sm:p-4 transition-colors hover:bg-surface-hover/50 hover:border-border-hover"
            style={{
              animation: mounted ? `fade-in-up 0.3s ease-out both ${i * 50}ms` : "none",
            }}
          >
            {/* Token avatar */}
            {token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-bg"
                style={{ background: `hsl(${avatarHue}, 55%, 50%)` }}
              >
                {token.symbol.charAt(0)}
              </div>
            )}

            {/* Name + symbol */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-text-1 truncate">{token.name}</p>
                {token.graduated && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider bg-status-graduated/12 text-status-graduated">
                    <Star className="h-2 w-2" />
                    GRAD
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-text-3">${token.symbol}</p>
            </div>

            {/* Virtual SOL */}
            <div className="text-right hidden sm:block">
              <p className="font-mono text-[12px] font-medium tabular-nums text-text-1">
                {token.virtualSol.toFixed(1)}
                <span className="ml-0.5 text-[10px] font-normal text-text-3">SOL</span>
              </p>
              <p className="text-[10px] text-text-3">Pool</p>
            </div>

            {/* Graduation progress */}
            <div className="flex items-center gap-2 min-w-[90px]">
              <div className="relative h-[4px] w-14 bg-border/50 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${
                    token.graduated
                      ? "bg-status-graduated"
                      : token.graduationPct > 80
                        ? "bg-status-graduating"
                        : "bg-buy/60"
                  }`}
                  style={{ width: `${token.graduationPct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] tabular-nums text-text-3 w-7 text-right">
                {token.graduationPct}%
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REFERRALS TAB
   ═══════════════════════════════════════════════ */

function ReferralsTab({
  mounted,
  isOwnProfile,
  address,
}: {
  mounted: boolean;
  isOwnProfile: boolean;
  address: string;
}) {
  const { connection } = useConnection();
  const { client: walletClient, connected } = useTokenLaunchpad();
  const toast = useToast();
  const [linkCopied, setLinkCopied] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [onChainEarned, setOnChainEarned] = useState<number>(0);
  const [onChainTradeCount, setOnChainTradeCount] = useState<number>(0);
  const [claimable, setClaimable] = useState<number>(0);
  const [loadingRef, setLoadingRef] = useState(true);

  // Read-only client for fetching referral data (works without wallet)
  const readClient = useMemo(() => {
    const provider = new AnchorProvider(
      connection,
      { publicKey: PublicKey.default, signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any) => txs } as any,
      { commitment: "confirmed" },
    );
    return new TokenLaunchpadClient(provider);
  }, [connection]);

  // Use wallet client for write operations, read client for reads
  const client = walletClient || readClient;

  useEffect(() => {
    async function fetchReferral() {
      setLoadingRef(true);
      try {
        const pubkey = new PublicKey(address);
        const ref = await readClient.getReferral(pubkey);
        setIsRegistered(true);
        setOnChainEarned(ref.totalEarned.toNumber() / LAMPORTS_PER_SOL);
        setOnChainTradeCount(ref.tradeCount.toNumber());
        // Claimable = PDA lamports - rent
        const pda = getReferralPda(pubkey);
        const pdaBalance = await connection.getBalance(pda);
        const rentExempt = await connection.getMinimumBalanceForRentExemption(8 + 32 + 8 + 8 + 1); // Referral account size
        const claimableLamports = Math.max(0, pdaBalance - rentExempt);
        setClaimable(claimableLamports / LAMPORTS_PER_SOL);
      } catch {
        setIsRegistered(false);
      } finally {
        setLoadingRef(false);
      }
    }
    fetchReferral();
  }, [readClient, address]);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${address}`
    : `https://launch.app/?ref=${address}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleRegister() {
    if (!walletClient || !connected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    setRegistering(true);
    try {
      await walletClient.registerReferral();
      setIsRegistered(true);
      toast.success("Registered as referrer");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleClaim() {
    if (onChainEarned <= 0 || !walletClient || !connected) return;
    setClaiming(true);
    try {
      await walletClient.claimReferralFees();
      toast.success(`Claimed referral fees`);
      // Refresh
      const pubkey = new PublicKey(address);
      const ref = await readClient.getReferral(pubkey);
      setOnChainEarned(ref.totalEarned.toNumber() / LAMPORTS_PER_SOL);
      setClaimable(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Claim failed";
      toast.error(message);
    } finally {
      setClaiming(false);
    }
  }

  if (loadingRef) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="border border-border bg-surface/40 p-3">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Not registered + own profile ──
  if (!isRegistered && isOwnProfile) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 border border-border bg-surface/40"
        style={{ animation: "fade-in-up 0.3s ease-out both" }}
      >
        <div className="relative mb-5">
          <Gift className="h-12 w-12 text-brand/40" />
          <Sparkles
            className="absolute -top-1 -right-1 h-5 w-5 text-brand"
            style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
          />
        </div>
        <h3 className="text-[15px] font-display font-semibold text-text-1 mb-2">
          Referral Program
        </h3>
        <p className="text-[13px] text-text-3 text-center max-w-sm mb-6 leading-relaxed">
          Share your referral link and earn <span className="text-brand font-semibold">10%</span> of
          all trading fees generated by wallets you refer.
        </p>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="group relative overflow-hidden px-6 py-2.5 text-[13px] font-semibold text-bg transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
        >
          <span
            className="absolute inset-0 bg-gradient-to-r from-brand via-brand-bright to-brand"
            style={{
              backgroundSize: "200% 100%",
              animation: "gradient-x 4s ease infinite",
            }}
          />
          <span className="relative flex items-center gap-2">
            {registering ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                Register as Referrer
              </>
            )}
          </span>
        </button>
      </div>
    );
  }

  // ── Not own profile + not registered ──
  if (!isRegistered && !isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-3">
        <Gift className="h-8 w-8 mb-3 opacity-40" />
        <p className="text-[13px]">No referral earnings</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Referral Link (own profile only) ── */}
      {isOwnProfile && isRegistered && (
        <div
          className="mb-6 border border-brand/20 bg-brand/5 p-4"
          style={{ animation: "fade-in-up 0.3s ease-out both" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-brand" />
            <h4 className="text-[13px] font-semibold text-text-1">Your Referral Link</h4>
          </div>
          <p className="text-[11px] text-text-3 mb-3">
            Share this link — earn <span className="text-brand">10%</span> of trading fees from
            every wallet that trades through it.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden border border-border bg-bg/60 px-3 py-2">
              <p className="font-mono text-[12px] text-text-2 truncate">{referralLink}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
            >
              {linkCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className={`grid gap-3 mb-6 ${isOwnProfile ? "grid-cols-3" : "grid-cols-2"}`}>
        <div
          className="border border-border bg-surface/40 p-3"
          style={{ animation: "fade-in-up 0.3s ease-out both" }}
        >
          <p className="text-[10px] uppercase tracking-wider text-text-3">Total Earned</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-brand">
            <SolAmount value={onChainEarned} />
            <span className="ml-0.5 text-[10px] font-normal text-text-3">SOL</span>
          </p>
        </div>
        {isOwnProfile && (
          <div
            className="border border-border bg-surface/40 p-3"
            style={{ animation: "fade-in-up 0.3s ease-out both 100ms" }}
          >
            <p className="text-[10px] uppercase tracking-wider text-text-3">Claimable</p>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-buy">
              <SolAmount value={claimable} />
              <span className="ml-0.5 text-[10px] font-normal text-text-3">SOL</span>
            </p>
          </div>
        )}
        <div
          className="border border-border bg-surface/40 p-3"
          style={{ animation: "fade-in-up 0.3s ease-out both 200ms" }}
        >
          <p className="text-[10px] uppercase tracking-wider text-text-3">Referred Trades</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-text-1">
            {onChainTradeCount}
          </p>
        </div>
      </div>

      {/* ── Claim Button (own profile only) ── */}
      {isOwnProfile && claimable > 0 && (
        <div
          className="mb-6"
          style={{ animation: "fade-in-up 0.3s ease-out both 350ms" }}
        >
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-semibold transition-all bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20 hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60"
          >
            {claiming ? (
              <>
                <div className="h-4 w-4 border-2 border-brand/40 border-t-brand rounded-full animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Claim Referral Fees
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
