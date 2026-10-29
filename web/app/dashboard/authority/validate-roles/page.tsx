"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { usePendingRoles } from "@/lib/hooks/usePendingRoles";
import { useValidatedRoles } from "@/lib/hooks/useValidatedRoles";
import { validateRole } from "@/lib/solana/instructions";
import { formatAddress, formatRole } from "@/lib/utils/format";

const ROLE_ACCENT: Record<string, string> = {
  producer: "#4A7A3A",
  factory: "#8A5030",
  retailer: "#9A7830",
  consumer: "#3A5A8A",
};

export default function ValidateRolesPage() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { pendingRoles, loading: pendingLoading, error: pendingError, refetch: refetchPending } = usePendingRoles();
  const { validatedRoles, loading: validatedLoading, error: validatedError, refetch: refetchValidated } = useValidatedRoles();

  const [tab, setTab] = useState<"pending" | "validated">("pending");
  const [validatingWallet, setValidatingWallet] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValidate = async (walletFullStr: string) => {
    if (!publicKey || !program) return;
    setValidatingWallet(walletFullStr);
    setValidationError(null);
    try {
      const targetWallet = new PublicKey(walletFullStr);
      await validateRole(program, publicKey, targetWallet);
      await refetchPending();
      await refetchValidated();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Failed to validate role");
    } finally {
      setValidatingWallet(null);
    }
  };

  const handleRefresh = async () => {
    await refetchPending();
    await refetchValidated();
  };

  const loading = pendingLoading || validatedLoading;
  const error = pendingError || validatedError;

  if (loading && pendingRoles.length === 0 && validatedRoles.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12, color: "var(--text-2)", fontSize: 13 }}>
        <div style={{ width: 16, height: 16, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading roles...
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 3, height: 24, background: "#8A3A3A", borderRadius: 2 }} />
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
              Validate Roles
            </h1>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
            Review and approve network access requests
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            background: "var(--ink-3)",
            color: "var(--text)",
            border: "1px solid var(--divider-strong)",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--ink-4)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--ink-3)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--divider-strong)";
          }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Error messages */}
      {(error || validationError) && (
        <div style={{ padding: "12px 16px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 13, marginBottom: 20 }}>
          {validationError || error}
        </div>
      )}

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--divider)" }}>
        {[
          { key: "pending" as const, label: "Pending", count: pendingRoles.length },
          { key: "validated" as const, label: "Validated", count: validatedRoles.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--text)" : "var(--text-2)",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--gold)" : "2px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 3,
              background: tab === t.key ? "rgba(192,144,56,0.15)" : "rgba(90,74,53,0.2)",
              color: tab === t.key ? "var(--gold)" : "var(--text-3)",
              fontWeight: 600,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Pending tab */}
      {tab === "pending" && (
        <div>
          {pendingRoles.length === 0 ? (
            <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>No pending requests</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>All requests have been processed</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingRoles.map((request) => {
                const accent = ROLE_ACCENT[request.requestedRole] || "var(--gold)";
                return (
                  <div key={request.pda} style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                            {request.wallet}
                          </div>
                          <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                            {request.walletFull}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 10px",
                          borderRadius: 3,
                          background: `${accent}20`,
                          color: accent,
                          border: `1px solid ${accent}50`,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}>
                          {formatRole(request.requestedRole)}
                        </span>
                        <button
                          onClick={() => handleValidate(request.walletFull)}
                          disabled={validatingWallet !== null}
                          style={{
                            padding: "7px 18px",
                            borderRadius: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: validatingWallet !== null ? "not-allowed" : "pointer",
                            background: validatingWallet === request.walletFull ? "var(--ink-4)" : "#3A5A3A",
                            color: "#7DC86A",
                            border: "1px solid rgba(74,122,58,0.5)",
                            opacity: validatingWallet !== null && validatingWallet !== request.walletFull ? 0.5 : 1,
                            transition: "all 0.15s",
                          }}
                        >
                          {validatingWallet === request.walletFull ? "Validating…" : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Validated tab */}
      {tab === "validated" && (
        <div>
          {validatedRoles.length === 0 ? (
            <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>No validated roles yet</div>
            </div>
          ) : (
            <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", padding: "10px 20px", borderBottom: "1px solid var(--divider)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <span>Wallet</span>
                <span>Full address</span>
                <span>Role</span>
                <span>Status</span>
              </div>
              {validatedRoles.map((role, i) => {
                const accent = ROLE_ACCENT[role.role] || "var(--gold)";
                return (
                  <div key={role.pda} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    padding: "12px 20px",
                    alignItems: "center",
                    borderBottom: i < validatedRoles.length - 1 ? "1px solid var(--divider)" : "none",
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{role.wallet}</span>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text-3)" }}>{formatAddress(role.pda)}</span>
                    <span style={{
                      display: "inline-flex",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 10px",
                      borderRadius: 3,
                      background: `${accent}20`,
                      color: accent,
                      border: `1px solid ${accent}50`,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      width: "fit-content",
                    }}>
                      {formatRole(role.role)}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 3,
                      background: "var(--green-dim)",
                      color: "#7DC86A",
                      border: "1px solid rgba(74,122,58,0.4)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}>
                      Validated
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
