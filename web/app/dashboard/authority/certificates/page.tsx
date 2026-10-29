"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { usePendingCertificates } from "@/lib/hooks/useCertificates";
import { resolveCertificate } from "@/lib/solana/instructions";
import { formatAddress } from "@/lib/utils/format";

const CERT_LABELS: Record<string, string> = { sanitary: "Health", quality: "Quality", organic: "Organic" };

export default function AuthorityCertificatesPage() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { certificates, loading, refetch } = usePendingCertificates();

  const [resolving, setResolving] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (cert: typeof certificates[0], approved: boolean) => {
    if (!publicKey || !program) return;
    const key = cert.pda.toString();
    setResolving(key);
    setError(null);
    try {
      const { PublicKey } = await import("@solana/web3.js");
      await resolveCertificate(
        program, publicKey,
        new PublicKey(cert.tokenMint),
        cert.certTypeNum,
        approved,
        resolutionNotes[key] || ""
      );
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve certificate");
    } finally {
      setResolving(null);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#8A3A3A", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Certification Management
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Approve or reject pending certificate requests
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: "var(--text-2)", fontSize: 13 }}>
          <div style={{ width: 16, height: 16, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading requests...
        </div>
      ) : certificates.length === 0 ? (
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 6 }}>No pending requests</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>All certifications are resolved</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {certificates.map(cert => {
            const key = cert.pda.toString();
            const isResolving = resolving === key;
            return (
              <div key={key} style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                        {CERT_LABELS[cert.certType] || cert.certType}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 3,
                        background: "rgba(192,144,56,0.15)",
                        color: "var(--gold)",
                        border: "1px solid var(--gold-dim)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}>
                        Pending
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-3)" }}>
                      <span>Lot: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{formatAddress(cert.tokenMint.toString())}</span></span>
                      <span>Requester: <span style={{ fontFamily: "var(--font-jetbrains)" }}>{formatAddress(cert.requester.toString())}</span></span>
                      <span>{new Date(cert.requestedAt * 1000).toLocaleString("en-US")}</span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {cert.notes && (
                    <div style={{ background: "var(--ink-3)", borderRadius: 6, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                        Requester notes
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-2)" }}>{cert.notes}</div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>
                      Resolution notes
                    </div>
                    <textarea
                      value={resolutionNotes[key] || ""}
                      onChange={e => setResolutionNotes(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="Reason for approval or rejection…"
                      maxLength={200}
                      rows={2}
                      style={{
                        width: "100%",
                        background: "var(--ink-3)",
                        border: "1px solid var(--divider-strong)",
                        borderRadius: 6,
                        color: "var(--text)",
                        padding: "10px 14px",
                        fontSize: 13,
                        resize: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => handleResolve(cert, true)}
                      disabled={isResolving}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isResolving ? "not-allowed" : "pointer",
                        background: "#3A5A3A",
                        color: "#7DC86A",
                        border: "1px solid rgba(74,122,58,0.5)",
                        opacity: isResolving ? 0.6 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {isResolving ? "Processing…" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleResolve(cert, false)}
                      disabled={isResolving}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isResolving ? "not-allowed" : "pointer",
                        background: "#5A2020",
                        color: "#C87A7A",
                        border: "1px solid rgba(138,58,58,0.5)",
                        opacity: isResolving ? 0.6 : 1,
                        transition: "opacity 0.15s",
                      }}
                    >
                      {isResolving ? "Processing…" : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
