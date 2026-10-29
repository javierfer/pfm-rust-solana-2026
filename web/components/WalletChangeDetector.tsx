"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

export function WalletChangeDetector() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const previousPublicKey = useRef<string | null>(null);

  useEffect(() => {
    const currentPublicKey = publicKey?.toString() ?? null;

    // If publicKey changed (not just initialization)
    if (
      previousPublicKey.current !== null &&
      previousPublicKey.current !== currentPublicKey
    ) {
      // Wallet changed, redirect to home
      router.push("/");
    }

    previousPublicKey.current = currentPublicKey;
  }, [publicKey, router]);

  return null; // This component doesn't render anything
}
