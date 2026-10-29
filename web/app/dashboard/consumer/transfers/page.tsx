"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useTransfers } from "@/lib/hooks/useTransfers";
import { acceptTransfer } from "@/lib/solana/instructions";
import { formatAddress, formatAmount } from "@/lib/utils/format";
import { formatDistance } from "date-fns";

export default function ConsumerTransfersPage() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { receivedTransfers, refetch } = useTransfers(publicKey!);
  const [acceptingTransfer, setAcceptingTransfer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptTransfer = async (tokenMint: string, sender: string) => {
    if (!program || !publicKey) return;
    setAcceptingTransfer(tokenMint);
    setError(null);
    try {
      const { PublicKey } = require("@solana/web3.js");
      await acceptTransfer(program, publicKey, new PublicKey(tokenMint), new PublicKey(sender));
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept transfer");
    } finally { setAcceptingTransfer(null); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#3A5A8A", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Transfers</h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>Products sent by retailers awaiting acceptance</p>
      </div>
      {error && <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12, marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {receivedTransfers.length === 0 ? (
          <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>No pending transfers</div>
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>Products that retailers send you will appear here for you to accept.</div>
          </div>
        ) : receivedTransfers.map((transfer) => (
          <div key={transfer.pda.toString()} style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>{formatAddress(transfer.tokenMint.toString())}</div>
                <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 24, fontWeight: 500, color: "var(--text)" }}>{formatAmount(transfer.amount)} <span style={{ fontSize: 14, color: "var(--text-2)", fontFamily: "inherit" }}>units</span></div>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{formatDistance(new Date(transfer.initiatedAt * 1000), new Date(), { addSuffix: true })}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 10, fontSize: 11, color: "var(--text-3)", display: "flex", flexDirection: "column", gap: 3 }}>
              <span>From: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{formatAddress(transfer.from.toString())}</span></span>
              <span>To: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{formatAddress(transfer.to.toString())}</span></span>
            </div>
            <button onClick={() => handleAcceptTransfer(transfer.tokenMint.toString(), transfer.from.toString())}
              disabled={acceptingTransfer !== null}
              style={{ marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: acceptingTransfer !== null ? "not-allowed" : "pointer", background: "#3A5A3A", color: "#7DC86A", border: "1px solid rgba(74,122,58,0.5)", opacity: acceptingTransfer !== null ? 0.6 : 1 }}>
              {acceptingTransfer === transfer.tokenMint.toString() ? "Accepting…" : "Accept Transfer"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
