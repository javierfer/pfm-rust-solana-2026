"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useRole } from "@/lib/hooks/useRole";
import { registerRole } from "@/lib/solana/instructions";
import { Traza } from "@/types/traza";

type Role = Traza["types"][7]["type"]["variants"][number]["name"];

interface RoleOption {
  value: Role;
  label: string;
  accent: string;
  accentDim: string;
  description: string;
  capabilities: string[];
}

const ROLES: RoleOption[] = [
  {
    value: "producer",
    label: "Producer",
    accent: "#4A7A3A",
    accentDim: "rgba(74,122,58,0.12)",
    description: "Registers coffee lots at origin",
    capabilities: ["Create lots", "Define metadata", "Start transfers"],
  },
  {
    value: "factory",
    label: "Roaster",
    accent: "#8A5030",
    accentDim: "rgba(138,80,48,0.12)",
    description: "Processes and blends origin lots",
    capabilities: ["Receive lots", "Blend origins", "Create processed products"],
  },
  {
    value: "retailer",
    label: "Retailer",
    accent: "#9A7830",
    accentDim: "rgba(154,120,48,0.12)",
    description: "Distributes products to the end consumer",
    capabilities: ["Accept transfers", "View history", "Distribute products"],
  },
  {
    value: "consumer",
    label: "Consumer",
    accent: "#3A5A8A",
    accentDim: "rgba(58,90,138,0.12)",
    description: "Verifies authenticity and traceability",
    capabilities: ["Track products", "Verify origin", "Full history"],
  },
];

export default function RegisterRolePage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { hasPendingRequest, loading } = useRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (role: Role) => {
    if (!publicKey || !program) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await registerRole(program, publicKey, role);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register role");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-2)", fontSize: 13 }}>
          <div style={{ width: 16, height: 16, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading…
        </div>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 10, padding: 48, maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 32, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Connect your Wallet</div>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>Connect your Solana wallet to register on the network.</p>
        </div>
      </div>
    );
  }

  if (hasPendingRequest) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 10, padding: 48, maxWidth: 440, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(192,144,56,0.15)", border: "1px solid var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="var(--gold)" strokeWidth="1.5"/><path d="M10 6v4l3 2" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 28, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Request Pending</div>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 8 }}>Your request is under review. The network authority will validate your registration shortly.</p>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>You can open the dashboard once it is approved.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 10, padding: 48, maxWidth: 440, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(74,122,58,0.15)", border: "1px solid rgba(74,122,58,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-7" stroke="#7DC86A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 28, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Request Sent</div>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>Your role request was recorded on the blockchain. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", padding: "64px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 52, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 14 }}>
            Choose your Role
          </div>
          <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Select your position in the coffee supply chain. Each role has its own capabilities and responsibilities.
          </p>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 13, marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>{error}</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 48 }}>
          {ROLES.map((role) => (
            <button key={role.value} onClick={() => handleSubmit(role.value)} disabled={isSubmitting}
              style={{ background: "var(--ink-2)", border: `1px solid var(--divider)`, borderRadius: 8, padding: 24, textAlign: "left", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1, transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 12 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = role.accent; (e.currentTarget as HTMLButtonElement).style.background = role.accentDim; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--divider)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--ink-2)"; }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: role.accent }} />
              <div>
                <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{role.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{role.description}</div>
              </div>
              <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {role.capabilities.map((cap, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-3)" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke={role.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {cap}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: role.accent, fontWeight: 600, marginTop: "auto" }}>
                {isSubmitting ? "Sending…" : "Select →"}
              </div>
            </button>
          ))}
        </div>

        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 32 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20, textAlign: "center" }}>Registration Process</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { n: "01", title: "Send Request", desc: "Record your role request on the Solana blockchain." },
              { n: "02", title: "Review", desc: "The network authority reviews and validates your request." },
              { n: "03", title: "Access", desc: "Once approved, you get every feature of your role." },
            ].map((step) => (
              <div key={step.n} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 36, fontWeight: 300, color: "var(--divider-strong)", marginBottom: 8 }}>{step.n}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
