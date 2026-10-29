"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Token } from "@/lib/hooks/useTokens";
import { initiateTransfer } from "@/lib/solana/instructions";
import { Program } from "@coral-xyz/anchor";
import { Traza } from "@/types/traza";
import { formatAddress } from "@/lib/utils/format";

interface TransferFormProps {
  program: Program<Traza>;
  from: PublicKey;
  tokens: Token[];
  onSuccess?: () => void;
}

const fieldStyle: React.CSSProperties = {
  background: "var(--ink-3)",
  border: "1px solid var(--divider-strong)",
  borderRadius: 6,
  color: "var(--text)",
  padding: "10px 14px",
  width: "100%",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "var(--text-3)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
};

export function TransferForm({ program, from, tokens, onSuccess }: TransferFormProps) {
  const [selectedTokenMint, setSelectedTokenMint] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedToken = selectedTokenMint ? tokens.find(t => t.mint.toString() === selectedTokenMint) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedToken || !recipientAddress || !transferAmount) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const recipient = new PublicKey(recipientAddress);
      if (!PublicKey.isOnCurve(recipient.toBytes())) throw new Error("Invalid recipient address");
      const amount = BigInt(transferAmount);
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      if (amount > selectedToken.amount) throw new Error(`Amount exceeds the available balance (${selectedToken.amount.toString()} units)`);
      await initiateTransfer(program, from, recipient, selectedToken.mint, amount);
      setSelectedTokenMint("");
      setTransferAmount("");
      setRecipientAddress("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>Token to transfer</label>
        {tokens.length === 0 ? (
          <div style={{ ...fieldStyle, color: "var(--text-3)", cursor: "default" }}>
            No tokens available
          </div>
        ) : (
          <select
            value={selectedTokenMint}
            onChange={(e) => { setSelectedTokenMint(e.target.value); setTransferAmount(""); }}
            style={{ ...fieldStyle, cursor: "pointer" }}
            required
            onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--gold)"; }}
            onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--divider-strong)"; }}
          >
            <option value="">Select token…</option>
            {tokens.map((token) => (
              <option key={token.mint.toString()} value={token.mint.toString()}>
                {token.metadata} ({token.amount.toString()} units)
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedToken && (
        <div>
          <label style={labelStyle}>Amount</label>
          <input
            type="number" value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="e.g. 100" min="1" max={selectedToken.amount.toString()}
            style={fieldStyle} required
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
          />
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
            Available: {selectedToken.amount.toString()} units
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Recipient address</label>
        <input
          type="text" value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="e.g. 9B5X…"
          style={{ ...fieldStyle, fontFamily: "var(--font-jetbrains)", fontSize: 11 }}
          required
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
        />
      </div>

      {selectedToken && transferAmount && recipientAddress && (
        <div style={{ background: "var(--ink-3)", border: "1px solid var(--divider)", borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Summary
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text-2)" }}>
            <span>Token: <span style={{ color: "var(--text)" }}>{selectedToken.metadata}</span></span>
            <span>Amount: <span style={{ color: "var(--text)" }}>{transferAmount} units</span></span>
            <span>To: <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text)" }}>{formatAddress(recipientAddress)}</span></span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !selectedToken || !transferAmount || !recipientAddress}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: (isSubmitting || !selectedToken || !transferAmount || !recipientAddress) ? "not-allowed" : "pointer",
          background: (isSubmitting || !selectedToken || !transferAmount || !recipientAddress) ? "var(--ink-4)" : "var(--gold)",
          color: (isSubmitting || !selectedToken || !transferAmount || !recipientAddress) ? "var(--text-3)" : "var(--ink)",
          border: "none",
          transition: "all 0.15s",
        }}
      >
        {isSubmitting ? "Starting transfer…" : "Start Transfer"}
      </button>
    </form>
  );
}
