"use client";

import { Buffer } from "buffer";
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { ToastProvider } from "./toast";

export function WalletProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    return key
      ? `https://devnet.helius-rpc.com/?api-key=${key}`
      : clusterApiUrl("devnet");
  }, []);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <ToastProvider>{children}</ToastProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
