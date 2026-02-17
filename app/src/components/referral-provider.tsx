"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTokenLaunchpad } from "@/hooks/use-token-launchpad";
import { useWallet } from "@solana/wallet-adapter-react";
import { CelebrationModal } from "./celebration-modal";
import { RegisterReferralModal } from "./register-referral-modal";
import { IncomingReferralModal } from "./incoming-referral-modal";

interface ReferralContextType {
  referrer: string | null;
  isRegistered: boolean;
}

const ReferralContext = createContext<ReferralContextType>({
  referrer: null,
  isRegistered: false,
});

const LS_KEY_REF = "referral";
const LS_KEY_REGISTERED = (wallet: string) => `ref_registered_${wallet}`;
const LS_KEY_CELEBRATED = (wallet: string) => `ref_celebrated_${wallet}`;
const LS_KEY_DISMISSED = (wallet: string) => `ref_dismissed_${wallet}`;
const LS_KEY_REF_ACCEPTED = "ref_accepted";

export function ReferralProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const { client, connected } = useTokenLaunchpad();
  const { publicKey } = useWallet();

  const [referrer, setReferrer] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIncomingRef, setShowIncomingRef] = useState(false);
  const [incomingRef, setIncomingRef] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  // ── Detect ?ref= in URL → show incoming referral modal ──
  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (!refFromUrl) {
      // No ref in URL — load from localStorage silently
      const stored = localStorage.getItem(LS_KEY_REF);
      setReferrer(stored);
      return;
    }

    const alreadyAccepted = localStorage.getItem(LS_KEY_REF);
    if (alreadyAccepted === refFromUrl) {
      // Same ref already accepted — no need to ask again
      setReferrer(refFromUrl);
      return;
    }

    // New ref detected → show the modal
    setIncomingRef(refFromUrl);
    setShowIncomingRef(true);
  }, [searchParams]);

  function handleAcceptRef() {
    if (incomingRef) {
      localStorage.setItem(LS_KEY_REF, incomingRef);
      setReferrer(incomingRef);
    }
    setShowIncomingRef(false);
    setIncomingRef(null);
  }

  function handleDeclineRef() {
    setShowIncomingRef(false);
    setIncomingRef(null);
    // Keep existing referral if any, don't overwrite
  }

  function handleClearRef() {
    localStorage.removeItem(LS_KEY_REF);
    setReferrer(null);
    setShowIncomingRef(false);
    setIncomingRef(null);
  }

  // ── Check registration status on wallet connect (read-only, no popup) ──
  useEffect(() => {
    if (!connected || !publicKey || !client) return;

    const walletAddr = publicKey.toBase58();

    // Already registered locally
    if (localStorage.getItem(LS_KEY_REGISTERED(walletAddr))) {
      setIsRegistered(true);
      return;
    }

    // User already dismissed for this session
    if (localStorage.getItem(LS_KEY_DISMISSED(walletAddr))) return;

    let cancelled = false;

    (async () => {
      try {
        await client.getReferral(publicKey);
        // Already registered on-chain — sync local flag
        localStorage.setItem(LS_KEY_REGISTERED(walletAddr), "1");
        if (!cancelled) setIsRegistered(true);
      } catch {
        // Not registered → show the explanation modal
        if (!cancelled) setShowRegister(true);
      }
    })();

    return () => { cancelled = true; };
  }, [connected, publicKey, client]);

  // ── User confirms registration from the modal ──
  const handleConfirmRegister = useCallback(async () => {
    if (!client || !publicKey) return;
    setRegistering(true);

    try {
      await client.registerReferral();
      const walletAddr = publicKey.toBase58();
      localStorage.setItem(LS_KEY_REGISTERED(walletAddr), "1");
      setIsRegistered(true);

      setShowRegister(false);

      // Show celebration
      if (!localStorage.getItem(LS_KEY_CELEBRATED(walletAddr))) {
        setShowCelebration(true);
      }
    } catch {
      // User rejected tx or it failed — close modal, don't retry automatically
      setShowRegister(false);
    } finally {
      setRegistering(false);
    }
  }, [client, publicKey]);

  function handleDismissRegister() {
    setShowRegister(false);
    if (publicKey) {
      localStorage.setItem(LS_KEY_DISMISSED(publicKey.toBase58()), "1");
    }
  }

  function handleCloseCelebration() {
    setShowCelebration(false);
    if (publicKey) {
      localStorage.setItem(LS_KEY_CELEBRATED(publicKey.toBase58()), "1");
    }
  }

  const referralLink = publicKey
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${publicKey.toBase58()}`
    : "";

  return (
    <ReferralContext.Provider value={{ referrer, isRegistered }}>
      {children}

      {showIncomingRef && incomingRef && (
        <IncomingReferralModal
          referrerAddress={incomingRef}
          existingRef={localStorage.getItem(LS_KEY_REF)}
          onAccept={handleAcceptRef}
          onDecline={handleDeclineRef}
          onClear={handleClearRef}
        />
      )}

      {showRegister && !showIncomingRef && (
        <RegisterReferralModal
          onConfirm={handleConfirmRegister}
          onDismiss={handleDismissRegister}
          loading={registering}
        />
      )}

      {showCelebration && (
        <CelebrationModal
          referralLink={referralLink}
          onClose={handleCloseCelebration}
        />
      )}
    </ReferralContext.Provider>
  );
}

export function useReferral(): ReferralContextType {
  return useContext(ReferralContext);
}
