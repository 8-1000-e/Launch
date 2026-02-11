"use client";

import { useEffect, useState } from "react";

interface Trade {
  id: number;
  type: "buy" | "sell";
  amountSol: number;
  amountTokens: number;
  price: number;
  time: string;
  wallet: string;
  isNew?: boolean;
}

function randomWallet() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const start = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const end = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${start}…${end}`;
}

function generateInitialTrades(basePrice: number): Trade[] {
  const trades: Trade[] = [];
  for (let i = 0; i < 20; i++) {
    const isBuy = Math.random() > 0.35;
    const sol = Math.round((0.1 + Math.random() * 5) * 100) / 100;
    const price = basePrice * (0.95 + Math.random() * 0.1);
    trades.push({
      id: i,
      type: isBuy ? "buy" : "sell",
      amountSol: sol,
      amountTokens: Math.floor(sol / price),
      price,
      time: `${Math.floor(Math.random() * 59) + 1}m ago`,
      wallet: randomWallet(),
    });
  }
  return trades;
}

export function TradeHistory({
  tokenSymbol,
  basePrice,
}: {
  tokenSymbol: string;
  basePrice: number;
}) {
  const [trades, setTrades] = useState<Trade[]>(() => generateInitialTrades(basePrice));
  const [nextId, setNextId] = useState(20);

  // Simulate live trades
  useEffect(() => {
    const interval = setInterval(() => {
      setTrades((prev) => {
        const isBuy = Math.random() > 0.35;
        const sol = Math.round((0.1 + Math.random() * 5) * 100) / 100;
        const price = basePrice * (0.97 + Math.random() * 0.06);
        const newTrade: Trade = {
          id: nextId,
          type: isBuy ? "buy" : "sell",
          amountSol: sol,
          amountTokens: Math.floor(sol / price),
          price,
          time: "just now",
          wallet: randomWallet(),
          isNew: true,
        };
        setNextId((n) => n + 1);
        return [newTrade, ...prev.slice(0, 29)];
      });
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [basePrice, nextId]);

  // Clear "isNew" flash after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setTrades((prev) => prev.map((t) => (t.isNew ? { ...t, isNew: false } : t)));
    }, 600);
    return () => clearTimeout(timer);
  }, [trades[0]?.id]);

  return (
    <div className="border border-border bg-surface/40">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-text-3">
          Recent Trades
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-buy opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-buy" />
          </span>
          <span className="text-[10px] font-mono text-text-3">LIVE</span>
        </div>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[52px_1fr_1fr_80px_72px] gap-x-2 border-b border-border px-4 py-2 text-[10px] uppercase tracking-wider text-text-3">
        <span>Type</span>
        <span className="text-right">SOL</span>
        <span className="text-right">{tokenSymbol}</span>
        <span className="text-right">Price</span>
        <span className="text-right">Wallet</span>
      </div>

      {/* Trade rows */}
      <div className="max-h-[320px] overflow-y-auto">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className={`grid grid-cols-[52px_1fr_1fr_80px_72px] gap-x-2 px-4 py-1.5 text-[12px] font-mono transition-colors ${
              trade.isNew
                ? trade.type === "buy"
                  ? "bg-buy/8"
                  : "bg-sell/8"
                : "hover:bg-surface-hover/50"
            }`}
          >
            <span
              className="font-medium"
              style={{ color: trade.type === "buy" ? "var(--buy)" : "var(--sell)" }}
            >
              {trade.type === "buy" ? "BUY" : "SELL"}
            </span>
            <span className="text-right text-text-2">{trade.amountSol.toFixed(2)}</span>
            <span className="text-right text-text-2">
              {trade.amountTokens.toLocaleString()}
            </span>
            <span className="text-right text-text-3">
              {trade.price.toFixed(6)}
            </span>
            <span className="text-right text-text-3">{trade.wallet}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
