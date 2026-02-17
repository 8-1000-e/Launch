"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN, AnchorProvider } from "@coral-xyz/anchor";
import { fetchBatchMetadata, TokenMetadata } from "./use-token-metadata";
import { getCurrentPrice } from "@sdk/math";
import { getBondingCurvePda } from "@sdk/pda";
import { TokenLaunchpadClient } from "@sdk/client";
import type { BondingCurve } from "@sdk/types";

/* ─── RPC pool: round-robin across multiple Helius keys ─── */

function buildRpcPool(): Connection[] {
  const keys = [
    process.env.NEXT_PUBLIC_HELIUS_API_KEY,
    process.env.NEXT_PUBLIC_HELIUS_API_KEY_2,
    process.env.NEXT_PUBLIC_HELIUS_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) return [];

  return keys.map(
    (k) => new Connection(`https://devnet.helius-rpc.com/?api-key=${k}`, "confirmed"),
  );
}

let _rpcPool: Connection[] | null = null;
let _rpcIdx = 0;

function getRpcPool(): Connection[] {
  if (!_rpcPool) _rpcPool = buildRpcPool();
  return _rpcPool;
}

function nextRpcConnection(fallback: Connection): Connection {
  const pool = getRpcPool();
  if (pool.length === 0) return fallback;
  const conn = pool[_rpcIdx % pool.length];
  _rpcIdx++;
  return conn;
}

/* ─── Trade Event parsing (same as use-trade-data.ts) ─── */

const TRADE_DISCRIMINATOR = new Uint8Array([189, 219, 127, 211, 78, 230, 97, 238]);
const TOKEN_DECIMALS = 1_000_000;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

function bufferEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function readBNLE(buf: Uint8Array, offset: number): number {
  const bn = new BN(Array.from(buf.slice(offset, offset + 8)), "le");
  return bn.toNumber();
}

/* ─── Types ─── */

export interface ProfileTrade {
  signature: string;
  mint: string;
  type: "buy" | "sell";
  solAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: number;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
}

export interface ProfileHolding {
  mint: string;
  name: string;
  symbol: string;
  image: string | null;
  balance: number;
  valueSol: number;
  pnl: number; // percentage
  pctSupply: number;
  isSol?: boolean;
}

export interface ProfileCreatedToken {
  mint: string;
  name: string;
  symbol: string;
  image: string | null;
  virtualSol: number;
  graduationPct: number;
  graduated: boolean;
  completed: boolean;
}

export interface ProfileStats {
  pnl: number;
  winRate: number;
  trades: number;
  volume: number;
  tokensCreated: number;
  tokensGraduated: number;
}

export interface ProfileData {
  portfolio: ProfileHolding[];
  tradeHistory: ProfileTrade[];
  createdTokens: ProfileCreatedToken[];
  stats: ProfileStats;
  activityMap: number[]; // 91 days, trades per day
  loading: boolean;
  error: string | null;
}

/* ─── Parse trade from tx log ─── */

interface RawTrade {
  signature: string;
  mint: string;
  type: "buy" | "sell";
  solAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: number;
}

function parseTradeFromLog(
  logLine: string,
  signature: string,
  blockTime: number,
  filterWallet: string,
): RawTrade | null {
  const base64Data = logLine.slice("Program data: ".length);
  const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  if (buffer.length < 89) return null;
  if (!bufferEqual(buffer.slice(0, 8), TRADE_DISCRIMINATOR)) return null;

  let offset = 8;

  const mintBytes = buffer.slice(offset, offset + 32);
  const mint = new PublicKey(mintBytes).toBase58();
  offset += 32;

  const traderBytes = buffer.slice(offset, offset + 32);
  const trader = new PublicKey(traderBytes).toBase58();
  offset += 32;

  // Only keep trades by this wallet
  if (trader !== filterWallet) return null;

  const isBuy = buffer[offset] === 1;
  offset += 1;

  const solAmountRaw = readBNLE(buffer, offset);
  offset += 8;

  const tokenAmountRaw = readBNLE(buffer, offset);

  const solNum = solAmountRaw / LAMPORTS_PER_SOL;
  const tokenNum = tokenAmountRaw / TOKEN_DECIMALS;
  const price = tokenNum > 0 ? solNum / tokenNum : 0;

  return {
    signature,
    mint,
    type: isBuy ? "buy" : "sell",
    solAmount: solNum,
    tokenAmount: tokenNum,
    price,
    timestamp: blockTime,
  };
}

/* ─── Activity heatmap helper ─── */

function buildActivityMap(trades: RawTrade[]): number[] {
  const now = Math.floor(Date.now() / 1000);
  const dayMs = 86400;
  const days = 91;
  const map = new Array(days).fill(0);

  for (const t of trades) {
    const daysAgo = Math.floor((now - t.timestamp) / dayMs);
    if (daysAgo >= 0 && daysAgo < days) {
      map[days - 1 - daysAgo]++;
    }
  }

  return map;
}

/* ─── PnL computation ─── */

interface PnLResult {
  totalPnl: number;
  winRate: number;
  volume: number;
}

function computePnL(
  trades: RawTrade[],
  currentPrices: Map<string, number>,
): PnLResult {
  let volume = 0;

  // Group by mint
  const byMint = new Map<string, RawTrade[]>();
  for (const t of trades) {
    volume += t.solAmount;
    const arr = byMint.get(t.mint) || [];
    arr.push(t);
    byMint.set(t.mint, arr);
  }

  let totalPnl = 0;
  let wins = 0;
  let tokensCounted = 0;

  for (const [mint, mintTrades] of byMint) {
    let totalBuySol = 0;
    let totalBuyTokens = 0;
    let totalSellSol = 0;

    for (const t of mintTrades) {
      if (t.type === "buy") {
        totalBuySol += t.solAmount;
        totalBuyTokens += t.tokenAmount;
      } else {
        totalSellSol += t.solAmount;
      }
    }

    // Realized PnL from sells
    const avgBuyPrice = totalBuyTokens > 0 ? totalBuySol / totalBuyTokens : 0;
    const realizedPnl = totalSellSol - (totalBuySol > 0 ? totalSellSol * (avgBuyPrice > 0 ? avgBuyPrice / avgBuyPrice : 1) : 0);

    // Unrealized: remaining tokens * (current price - avg buy price)
    const currentPrice = currentPrices.get(mint) || 0;
    const remainingTokens = totalBuyTokens - (totalSellSol / (avgBuyPrice || 1)) * (avgBuyPrice > 0 ? 1 : 0);

    // Simple PnL: total sol from sells + value of remaining tokens - total sol spent on buys
    const holdingValue = remainingTokens > 0 ? remainingTokens * currentPrice : 0;
    const mintPnl = totalSellSol + holdingValue - totalBuySol;

    totalPnl += mintPnl;
    if (mintPnl > 0) wins++;
    tokensCounted++;
  }

  const winRate = tokensCounted > 0 ? Math.round((wins / tokensCounted) * 100) : 0;

  return { totalPnl, winRate, volume };
}

/* ─── Graduation percentage helper ─── */

const GRADUATION_THRESHOLD = 85_000_000_000; // 85 SOL in lamports

function getGraduationPct(curve: BondingCurve): number {
  const realSol = curve.realSolReserves.toNumber();
  const pct = Math.min(100, Math.round((realSol / GRADUATION_THRESHOLD) * 100));
  return pct;
}

/* ─── Main hook ─── */

export function useProfileData(address: string): ProfileData {
  const { connection } = useConnection();

  // Create a read-only client that works without a connected wallet
  const client = useMemo(() => {
    const readOnlyProvider = new AnchorProvider(
      connection,
      { publicKey: PublicKey.default, signTransaction: async (tx: any) => tx, signAllTransactions: async (txs: any) => txs } as any,
      { commitment: "confirmed" },
    );
    return new TokenLaunchpadClient(readOnlyProvider);
  }, [connection]);

  const [portfolio, setPortfolio] = useState<ProfileHolding[]>([]);
  const [tradeHistory, setTradeHistory] = useState<ProfileTrade[]>([]);
  const [createdTokens, setCreatedTokens] = useState<ProfileCreatedToken[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    pnl: 0,
    winRate: 0,
    trades: 0,
    volume: 0,
    tokensCreated: 0,
    tokensGraduated: 0,
  });
  const [activityMap, setActivityMap] = useState<number[]>(new Array(91).fill(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    abortRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const walletPk = new PublicKey(address);

      // ── 1. Fetch all bonding curves ──
      const allCurves = await client.listAllBondingCurves();
      if (abortRef.current) return;

      // Build mint→curve map
      const curveByMint = new Map<string, BondingCurve>();
      for (const c of allCurves) {
        curveByMint.set(c.account.mint.toBase58(), c.account as BondingCurve);
      }

      // ── 2. Fetch trade history via bonding curve PDAs ──
      // Instead of scanning ALL wallet signatures (1000+), we scan each
      // bonding curve PDA (much fewer tx). Then filter for this wallet's trades.
      const rawTrades: RawTrade[] = [];
      const seenSigs = new Set<string>();

      // Collect signatures from all bonding curve PDAs in parallel
      const pdaSignaturePromises = allCurves.map(async (c) => {
        const pda = getBondingCurvePda(c.account.mint);
        const sigs: { signature: string }[] = [];
        let before: string | undefined;

        for (let page = 0; page < 5; page++) {
          if (abortRef.current) return sigs;
          const opts: { limit: number; before?: string } = { limit: PAGE_SIZE };
          if (before) opts.before = before;

          const result = await nextRpcConnection(connection).getSignaturesForAddress(pda, opts);
          if (result.length === 0) break;
          sigs.push(...result);
          before = result[result.length - 1].signature;
          if (result.length < PAGE_SIZE) break;
        }
        return sigs;
      });

      const allPdaSigs = await Promise.all(pdaSignaturePromises);
      if (abortRef.current) return;

      // Flatten and deduplicate
      const allSignatures: { signature: string }[] = [];
      for (const sigs of allPdaSigs) {
        for (const sig of sigs) {
          if (!seenSigs.has(sig.signature)) {
            seenSigs.add(sig.signature);
            allSignatures.push(sig);
          }
        }
      }

      // Parse transactions in parallel batches
      const TX_BATCH = 10;
      for (let i = 0; i < allSignatures.length; i += TX_BATCH) {
        if (abortRef.current) return;

        const batch = allSignatures.slice(i, i + TX_BATCH);
        const results = await Promise.allSettled(
          batch.map((sig) =>
            nextRpcConnection(connection).getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            }),
          ),
        );

        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status !== "fulfilled" || !result.value?.meta?.logMessages) continue;

          const tx = result.value;
          const dataLogs = tx.meta!.logMessages!.filter((l: string) =>
            l.startsWith("Program data: "),
          );
          for (const log of dataLogs) {
            const trade = parseTradeFromLog(log, batch[j].signature, tx.blockTime ?? 0, address);
            if (trade) rawTrades.push(trade);
          }
        }
      }

      if (abortRef.current) return;

      // ── 3. Collect all unique mints ──
      const tradeMints = new Set(rawTrades.map((t) => t.mint));

      // ── 4. Token holdings ──
      let tokenAccounts: { mint: string; amount: number }[] = [];
      try {
        const resp = await connection.getTokenAccountsByOwner(walletPk, {
          programId: TOKEN_PROGRAM_ID,
        });

        for (const { account } of resp.value) {
          const data = account.data;
          // SPL Token account layout: mint (32) + owner (32) + amount (u64 LE at offset 64)
          const mintAddr = new PublicKey(data.slice(0, 32)).toBase58();
          const amountBuf = data.slice(64, 72);
          const amount = new BN(Array.from(amountBuf), "le").toNumber() / TOKEN_DECIMALS;

          // Only include tokens from our launchpad
          if (curveByMint.has(mintAddr) && amount > 0) {
            tokenAccounts.push({ mint: mintAddr, amount });
          }
        }
      } catch {
        // Token accounts fetch failed — continue with empty
      }

      if (abortRef.current) return;

      // ── 5. Created tokens ──
      const createdCurves = allCurves.filter(
        (c) => c.account.creator.toBase58() === address,
      );

      // ── 6. Batch fetch metadata ──
      const allMints = new Set<string>([
        ...tradeMints,
        ...tokenAccounts.map((t) => t.mint),
        ...createdCurves.map((c) => c.account.mint.toBase58()),
      ]);

      const metadataMap = await fetchBatchMetadata(
        connection,
        Array.from(allMints),
      );

      if (abortRef.current) return;

      // ── 7. Build current prices map ──
      const currentPrices = new Map<string, number>();
      for (const mint of allMints) {
        const curve = curveByMint.get(mint);
        if (curve) {
          currentPrices.set(mint, getCurrentPrice(curve.virtualSol, curve.virtualToken));
        }
      }

      // ── 8. Fetch SOL balance ──
      let solBalance = 0;
      try {
        solBalance = (await connection.getBalance(walletPk)) / LAMPORTS_PER_SOL;
      } catch {
        // ignore
      }

      // ── 9. Build portfolio ──
      const holdingsResult: ProfileHolding[] = [];

      // Add native SOL as first entry
      if (solBalance > 0) {
        holdingsResult.push({
          mint: "So11111111111111111111111111111111111111112",
          name: "Solana",
          symbol: "SOL",
          image: null,
          balance: solBalance,
          valueSol: solBalance,
          pnl: 0,
          pctSupply: 0,
          isSol: true,
        });
      }

      // Add launchpad tokens
      holdingsResult.push(...tokenAccounts.map((ta) => {
        const meta = metadataMap.get(ta.mint);
        const curve = curveByMint.get(ta.mint);
        const price = currentPrices.get(ta.mint) || 0;
        const valueSol = ta.amount * price;

        // Compute PnL for this holding
        const mintTrades = rawTrades.filter((t) => t.mint === ta.mint);
        let totalBuySol = 0;
        let totalBuyTokens = 0;
        for (const t of mintTrades) {
          if (t.type === "buy") {
            totalBuySol += t.solAmount;
            totalBuyTokens += t.tokenAmount;
          }
        }
        const avgCost = totalBuyTokens > 0 ? totalBuySol / totalBuyTokens : 0;
        const pnlPct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0;

        const totalSupply = curve
          ? curve.tokenTotalSupply.toNumber() / TOKEN_DECIMALS
          : 1;
        const pctSupply = totalSupply > 0 ? (ta.amount / totalSupply) * 100 : 0;

        return {
          mint: ta.mint,
          name: meta?.name || `Token ${ta.mint.slice(0, 6)}`,
          symbol: meta?.symbol || ta.mint.slice(0, 4).toUpperCase(),
          image: meta?.image || null,
          balance: ta.amount,
          valueSol,
          pnl: Math.round(pnlPct * 10) / 10,
          pctSupply: Math.round(pctSupply * 100) / 100,
          isSol: false,
        };
      }));

      // ── 10. Build trade history with metadata ──
      const tradesResult: ProfileTrade[] = rawTrades.map((t) => {
        const meta = metadataMap.get(t.mint);
        return {
          ...t,
          tokenName: meta?.name || `Token ${t.mint.slice(0, 6)}`,
          tokenSymbol: meta?.symbol || t.mint.slice(0, 4).toUpperCase(),
          tokenImage: meta?.image || null,
        };
      });

      // ── 10. Build created tokens ──
      const createdResult: ProfileCreatedToken[] = createdCurves.map((c) => {
        const mint = c.account.mint.toBase58();
        const meta = metadataMap.get(mint);
        const curve = c.account as BondingCurve;

        return {
          mint,
          name: meta?.name || `Token ${mint.slice(0, 6)}`,
          symbol: meta?.symbol || mint.slice(0, 4).toUpperCase(),
          image: meta?.image || null,
          virtualSol: curve.virtualSol.toNumber() / LAMPORTS_PER_SOL,
          graduationPct: getGraduationPct(curve),
          graduated: curve.completed || curve.migrated,
          completed: curve.completed,
        };
      });

      // ── 11. Compute stats ──
      const { totalPnl, winRate, volume } = computePnL(rawTrades, currentPrices);

      const statsResult: ProfileStats = {
        pnl: Math.round(totalPnl * 100) / 100,
        winRate,
        trades: rawTrades.length,
        volume: Math.round(volume * 100) / 100,
        tokensCreated: createdCurves.length,
        tokensGraduated: createdCurves.filter(
          (c) => c.account.completed || c.account.migrated,
        ).length,
      };

      // ── 12. Build activity map ──
      const activity = buildActivityMap(rawTrades);

      // ── Set state ──
      if (!abortRef.current) {
        setPortfolio(holdingsResult);
        setTradeHistory(tradesResult);
        setCreatedTokens(createdResult);
        setStats(statsResult);
        setActivityMap(activity);
      }
    } catch (err) {
      if (!abortRef.current) {
        console.error("Failed to fetch profile data:", err);
        setError("Failed to load profile data");
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [connection, client, address]);

  useEffect(() => {
    abortRef.current = true;
    fetchAll();
    return () => {
      abortRef.current = true;
    };
  }, [fetchAll]);

  return { portfolio, tradeHistory, createdTokens, stats, activityMap, loading, error };
}
