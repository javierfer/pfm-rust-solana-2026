"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useTokens } from "@/lib/hooks/useTokens";
import { useCertificates } from "@/lib/hooks/useCertificates";
import { requestCertificate } from "@/lib/solana/instructions";
import { formatAddress } from "@/lib/utils/format";

const CERT_TYPES = [
  { label: "Health", value: 0 },
  { label: "Quality", value: 1 },
  { label: "Organic", value: 2 },
];

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(192,144,56,0.15)", color: "var(--gold)", label: "Pending" },
  approved: { bg: "rgba(74,122,58,0.15)", color: "#7DC86A", label: "Approved" },
  rejected: { bg: "rgba(138,58,58,0.15)", color: "#C87A7A", label: "Rejected" },
};

export default function ProducerCertificatesPage() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { tokens } = useTokens(publicKey ?? undefined);
  const { certificates, refetch } = useCertificates();

  const [modal, setModal] = useState<{ mint: string; certType: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCert = (mintStr: string, certTypeNum: number) =>
    certificates.find(c => c.tokenMint.toString() === mintStr && c.certTypeNum === certTypeNum);

  const handleRequest = async () => {
    if (!publicKey || !program || !modal) return;
    setSubmitting(true);
    setError(null);
    try {
      const { PublicKey } = await import("@solana/web3.js");
      await requestCertificate(program, publicKey, new PublicKey(modal.mint), modal.certType, notes);
      setModal(null);
      setNotes("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request certificate");
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#4A7A3A", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>Certifications</h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>Request quality certificates for your lots recorded on the blockchain</p>
      </div>

      {tokens.length === 0 ? (
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 56, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>No lots registered</div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>Create a lot first to request certifications.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tokens.map(token => (
            <div key={token.mint.toString()} style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{token.metadata}</div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text-3)" }}>{formatAddress(token.mint.toString())}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
                {CERT_TYPES.map((ct, i) => {
                  const cert = getCert(token.mint.toString(), ct.value);
                  const statusCfg = cert ? STATUS_CONFIG[cert.status] : null;
                  return (
                    <div key={ct.value} style={{ padding: "16px 20px", borderRight: i < 2 ? "1px solid var(--divider)" : "none", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{ct.label}</div>
                      {cert && statusCfg ? (
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 3, background: statusCfg.bg, color: statusCfg.color, fontWeight: 600, alignSelf: "flex-start" }}>{statusCfg.label}</span>
                      ) : (
                        <button onClick={() => setModal({ mint: token.mint.toString(), certType: ct.value })}
                          style={{ fontSize: 11, padding: "5px 12px", borderRadius: 4, background: "rgba(58,90,138,0.12)", color: "#6A9AD4", border: "1px solid rgba(58,90,138,0.3)", cursor: "pointer", fontWeight: 600, alignSelf: "flex-start" }}>
                          Request
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(8,6,4,0.8)" }}>
          <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider-strong)", borderRadius: 10, padding: 32, maxWidth: 440, width: "100%", margin: "0 16px" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Request Certificate</div>
              <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 26, fontWeight: 500, color: "var(--text)" }}>
                {CERT_TYPES.find(c => c.value === modal.certType)?.label}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                Notes <span style={{ opacity: 0.6, fontWeight: 400 }}>(max. 200 characters)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Describe the reason or any additional information..."
                maxLength={200} rows={4}
                style={{ width: "100%", background: "var(--ink-3)", border: "1px solid var(--divider-strong)", borderRadius: 6, color: "var(--text)", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                onBlur={e => (e.target.style.borderColor = "var(--divider-strong)")}
              />
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, textAlign: "right" }}>{notes.length}/200</div>
            </div>
            {error && <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 12, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleRequest} disabled={submitting}
                style={{ flex: 1, padding: "10px 0", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", background: submitting ? "var(--ink-4)" : "var(--gold)", color: submitting ? "var(--text-3)" : "var(--ink)", border: "none", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Sending…" : "Send Request"}
              </button>
              <button onClick={() => { setModal(null); setNotes(""); setError(null); }}
                style={{ padding: "10px 20px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", background: "transparent", color: "var(--text-2)", border: "1px solid var(--divider-strong)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
