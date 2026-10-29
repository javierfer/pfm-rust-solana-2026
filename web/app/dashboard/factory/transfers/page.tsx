"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import { useTransfers } from "@/lib/hooks/useTransfers";
import { acceptTransfer } from "@/lib/solana/instructions";
import { TransferForm } from "@/components/transfer/TransferForm";
import { formatAddress, formatAmount } from "@/lib/utils/format";
import { formatDistance } from "date-fns";

export default function FactoryTransfersPage() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { balances, refetch: refetchBalances } = useTokenBalances(publicKey!);
  const { sentTransfers, receivedTransfers, refetch: refetchTransfers } = useTransfers(publicKey!);
  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");
  const [acceptingTransfer, setAcceptingTransfer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);

  const handleAcceptTransfer = async (tokenMint: string, sender: string) => {
    if (!program || !publicKey) return;
    setAcceptingTransfer(tokenMint);
    setError(null);
    try {
      const { PublicKey } = require("@solana/web3.js");
      await acceptTransfer(program, publicKey, new PublicKey(tokenMint), new PublicKey(sender));
      await refetchTransfers();
      await refetchBalances();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept transfer");
    } finally {
      setAcceptingTransfer(null);
    }
  };

  useEffect(() => {
    const enrich = async () => {
      if (!program || !program.account || balances.length === 0) { setTokens([]); return; }
      try {
        const enriched = await Promise.all(balances.map(async (balance) => {
          try {
            const accounts = await (program.account as any).traceToken.all([{ memcmp: { offset: 8, bytes: balance.tokenMint.toBase58() } }]);
            const t = accounts.length > 0 ? await (program.account as any).traceToken.fetch(accounts[0].publicKey) : null;
            return { mint: balance.tokenMint, amount: balance.balance, metadata: t?.metadata || balance.tokenMint.toString(), creator: publicKey!, creatorRole: "factory", currentOwner: publicKey!, status: "created", sourceTokens: [], createdAt: balance.lastUpdated, pda: balance.pda };
          } catch { return { mint: balance.tokenMint, amount: balance.balance, metadata: balance.tokenMint.toString(), creator: publicKey!, creatorRole: "factory", currentOwner: publicKey!, status: "created", sourceTokens: [], createdAt: balance.lastUpdated, pda: balance.pda }; }
        }));
        setTokens(enriched);
      } catch { setTokens([]); }
    };
    enrich();
  }, [program, balances, publicKey]);

  const activeTransfers = activeTab === "sent" ? sentTransfers : receivedTransfers;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#8A5030", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Transfers</h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>Receive lots from producers and send products to retailers</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--divider)" }}>Send Product</div>
          {program && publicKey ? (
            <TransferForm program={program} from={publicKey} tokens={tokens} onSuccess={() => { refetchTransfers(); }} />
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Connect your wallet to transfer</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 16 }}>History</div>
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--divider)" }}>
            {[{ key: "received" as const, label: "Received", count: receivedTransfers.length }, { key: "sent" as const, label: "Sent", count: sentTransfers.length }].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: "8px 16px", fontSize: 12, fontWeight: activeTab === t.key ? 600 : 400, color: activeTab === t.key ? "var(--text)" : "var(--text-2)", background: "none", border: "none", borderBottom: activeTab === t.key ? "2px solid var(--gold)" : "2px solid transparent", marginBottom: -1, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {t.label}
                <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: activeTab === t.key ? "rgba(192,144,56,0.15)" : "rgba(90,74,53,0.2)", color: activeTab === t.key ? "var(--gold)" : "var(--text-3)", fontWeight: 600 }}>{t.count}</span>
              </button>
            ))}
          </div>
          {error && <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeTransfers.length === 0 ? (
              <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 32, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
                No {activeTab === "sent" ? "sent" : "received"} transfers
              </div>
            ) : activeTransfers.map((transfer) => (
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
                {activeTab === "received" && (
                  <button onClick={() => handleAcceptTransfer(transfer.tokenMint.toString(), transfer.from.toString())}
                    disabled={acceptingTransfer !== null}
                    style={{ marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: acceptingTransfer !== null ? "not-allowed" : "pointer", background: "#3A5A3A", color: "#7DC86A", border: "1px solid rgba(74,122,58,0.5)", opacity: acceptingTransfer !== null ? 0.6 : 1 }}>
                    {acceptingTransfer === transfer.tokenMint.toString() ? "Accepting…" : "Accept Transfer"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
