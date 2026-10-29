"use client";

import { useState, useMemo } from "react";
import { Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useTokensByRole } from "@/lib/hooks/useTokensByRole";
import { createToken } from "@/lib/solana/instructions";
import { formatAddress } from "@/lib/utils/format";

const PROCESSING_TYPES = [
  "Light Roast", "Medium Roast", "Dark Roast",
  "Espresso Grind", "Filter Grind", "French Press Grind",
  "Special Blend", "Single Origin", "Torrefacto",
  "Decaf", "Cold Brew Concentrate", "Capsules", "Instant",
];

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

export default function CreateTokenFactoryPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { tokens: producerTokens } = useTokensByRole("producer");

  const [metadata, setMetadata] = useState("");
  const [amount, setAmount] = useState("");
  const [processingType, setProcessingType] = useState("Medium Roast");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSources = useMemo(
    () => producerTokens.filter(t => t.creatorRole === "producer" && t.status !== "inTransfer"),
    [producerTokens]
  );

  const handleSourceToggle = (mint: string) => {
    setSelectedSources(prev =>
      prev.includes(mint) ? prev.filter(m => m !== mint) : [...prev, mint]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !program || selectedSources.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { PublicKey } = await import("@solana/web3.js");
      const mint = Keypair.generate();
      await createToken(program, publicKey, mint, {
        amount: BigInt(amount),
        metadata: `${metadata} (${processingType})`,
        coffeeType: processingType,
        farmName: "Factory Blend",
        harvestDate: 0,
        originCountry: "Processed",
        altitudeMeters: 0,
        temperature: null,
        humidity: null,
        latitude: 0, // 0,0 = no oracle data (oracle_verified stays false)
        longitude: 0,
        sourceTokenMints: selectedSources.map(s => new PublicKey(s)),
      });
      router.push("/dashboard/factory/my-tokens");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#8A5030", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Create Processed Product
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Blend origin lots to register a new product on the blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Identification */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
              Identification
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input
                  type="text" value={metadata} onChange={e => setMetadata(e.target.value)}
                  placeholder="e.g. Premium Roasted Coffee" maxLength={256}
                  style={fieldStyle} required
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Quantity (units) *</label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 500" min="1"
                  style={fieldStyle} required
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--gold)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--divider-strong)"; }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Processing Type *</label>
            <select value={processingType} onChange={e => setProcessingType(e.target.value)}
              style={{ ...fieldStyle, cursor: "pointer" }}
              onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--gold)"; }}
              onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--divider-strong)"; }}
            >
              {PROCESSING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ height: 1, background: "var(--divider)" }} />

          {/* Source tokens */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
              Origin Lots * <span style={{ opacity: 0.6, fontWeight: 400 }}>(min. 1, max. 10)</span>
            </div>
            <div style={{ background: "var(--ink-3)", border: "1px solid var(--divider-strong)", borderRadius: 6, overflow: "hidden" }}>
              {availableSources.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
                  No producer lots available
                </div>
              ) : (
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {availableSources.map((token, i) => {
                    const isSelected = selectedSources.includes(token.mint.toString());
                    return (
                      <label
                        key={token.mint.toString()}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: i < availableSources.length - 1 ? "1px solid var(--divider)" : "none",
                          background: isSelected ? "var(--ink-4)" : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSourceToggle(token.mint.toString())}
                          style={{ marginTop: 2, accentColor: "var(--gold)" }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 500 : 400, color: isSelected ? "var(--text)" : "var(--text-2)" }}>
                            {token.metadata}
                          </div>
                          <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                            {formatAddress(token.mint.toString())}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
              {selectedSources.length} selected of 10 max
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={isSubmitting || !metadata || !amount || selectedSources.length === 0}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: (isSubmitting || !metadata || !amount || selectedSources.length === 0) ? "not-allowed" : "pointer",
                background: (isSubmitting || !metadata || !amount || selectedSources.length === 0) ? "var(--ink-4)" : "var(--gold)",
                color: (isSubmitting || !metadata || !amount || selectedSources.length === 0) ? "var(--text-3)" : "var(--ink)",
                border: "none",
                transition: "all 0.15s",
              }}
            >
              {isSubmitting ? "Creating product…" : "Register Product on Blockchain"}
            </button>
            <button
              type="button" onClick={() => router.back()}
              style={{ padding: "11px 24px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", color: "var(--text-2)", border: "1px solid var(--divider-strong)", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--divider-strong)"; }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
