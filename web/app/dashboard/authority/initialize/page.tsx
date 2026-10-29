"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { initializeProgram } from "@/lib/solana/instructions";
import { getConfigPDA } from "@/lib/utils/pda";

export default function InitializeAuthorityPage() {
  const { publicKey } = useWallet();
  const { program } = useProgram();

  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyInitialized, setAlreadyInitialized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkInitialized = async () => {
      if (!program) { setChecking(false); return; }
      try {
        const [configPDA] = getConfigPDA();
        await (program.account as any).programConfig.fetch(configPDA);
        setAlreadyInitialized(true);
      } catch {
        setAlreadyInitialized(false);
      } finally {
        setChecking(false);
      }
    };
    checkInitialized();
  }, [program]);

  const handleInitialize = async () => {
    if (!publicKey || !program) return;
    setIsInitializing(true);
    setError(null);
    setSuccess(false);
    try {
      await initializeProgram(program, publicKey);
      setSuccess(true);
      setAlreadyInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: "#8A3A3A", borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Initialize Program
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Set up the program on Solana. This can only be done once.
        </p>
      </div>

      {/* Info card */}
      <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
          Permissions granted
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { title: "Program Authority", desc: "Your wallet is recorded as the permanent authority." },
            { title: "Role System", desc: "Enables on-chain role management and validation." },
            { title: "Token System", desc: "Initializes the token traceability system." },
          ].map((item, i) => (
            <div key={i} style={{ borderTop: "1px solid var(--divider)", paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status messages */}
      {checking && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-2)", fontSize: 13, marginBottom: 20, padding: "12px 16px", background: "var(--ink-2)", borderRadius: 6, border: "1px solid var(--divider)" }}>
          <div style={{ width: 14, height: 14, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Checking program status...
        </div>
      )}

      {!checking && alreadyInitialized && !success && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 6,
          background: "rgba(58,90,138,0.1)",
          border: "1px solid rgba(58,90,138,0.3)",
          color: "#7AA8E8",
          fontSize: 13,
          marginBottom: 20,
        }}>
          The program is already initialized. You can go on to validate roles.
        </div>
      )}

      {error && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 6,
          background: "var(--crimson-dim)",
          border: "1px solid rgba(138,58,58,0.4)",
          color: "#C87A7A",
          fontSize: 13,
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: "16px 20px",
          borderRadius: 6,
          background: "var(--green-dim)",
          border: "1px solid rgba(74,122,58,0.4)",
          color: "#7DC86A",
          fontSize: 13,
          marginBottom: 20,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Program initialized successfully</div>
          <div style={{ opacity: 0.8 }}>
            The traceability system is ready. You can go on to validate user roles.
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={handleInitialize}
          disabled={isInitializing || success || alreadyInitialized || checking}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            cursor: (isInitializing || success || alreadyInitialized || checking) ? "not-allowed" : "pointer",
            background: (success || alreadyInitialized) ? "var(--ink-4)" : "var(--gold)",
            color: (success || alreadyInitialized) ? "var(--text-3)" : "var(--ink)",
            border: "none",
            opacity: (isInitializing || checking) ? 0.6 : 1,
            transition: "all 0.15s",
          }}
        >
          {isInitializing ? "Initializing…" : (success || alreadyInitialized) ? "Already initialized" : "Initialize Program"}
        </button>

        <Link
          href="/dashboard/authority/validate-roles"
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
            background: "transparent",
            color: "var(--text-2)",
            border: "1px solid var(--divider-strong)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--gold-dim)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)";
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--divider-strong)";
          }}
        >
          Validate Roles →
        </Link>
      </div>

      {success && (
        <div style={{ marginTop: 32, background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {[
            { n: "01", title: "Validate User Roles", desc: "Approve requests from users who want to operate in the system." },
            { n: "02", title: "Monitor Activity", desc: "Oversee every certificate and operation on the network." },
          ].map((step, i) => (
            <div key={i} style={{ padding: 28, borderRight: i === 0 ? "1px solid var(--divider)" : "none" }}>
              <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 42, fontWeight: 300, color: "var(--gold-dim)", lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
