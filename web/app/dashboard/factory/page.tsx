"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRole } from "@/lib/hooks/useRole";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";

const ACCENT = "#8A5030";
const ACCENT_DIM = "rgba(138,80,48,0.1)";

const actions = [
  {
    href: "/dashboard/factory/transfers",
    title: "Receive Products",
    desc: "Accept incoming lot transfers from producers and suppliers.",
    cta: "View transfers →",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M9 14V4M5 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/factory/create-token",
    title: "Create Product",
    desc: "Blend origin lots and mint new processed-product tokens.",
    cta: "Create →",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="3" y="5" width="12" height="9" rx="1.5"/>
        <path d="M6 5V4a3 3 0 016 0v1" strokeLinecap="round"/>
        <circle cx="9" cy="9.5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/factory/my-tokens",
    title: "My Inventory",
    desc: "Manage all your processed products and their distribution to retailers.",
    cta: "View inventory →",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M4 5h10M4 9h10M4 13h6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/factory/transfers",
    title: "Send to Retailers",
    desc: "Transfer finished products to retailers for sale.",
    cta: "Manage →",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M3 6h12M10 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 12H3M8 9l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function FactoryDashboard() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { role, loading: roleLoading } = useRole();
  const { balances, loading: balancesLoading } = useTokenBalances(publicKey!);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!roleLoading && role && role !== "factory") {
      router.push("/dashboard");
    }
  }, [role, roleLoading, router]);

  if (!isClient || roleLoading || balancesLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12, color: "var(--text-2)", fontSize: 13 }}>
        <div style={{ width: 16, height: 16, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading dashboard...
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--text-2)", fontSize: 13 }}>
        Connect your wallet to continue
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: ACCENT, borderRadius: 2 }} />
          <h1 style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 38,
            fontWeight: 500,
            color: "var(--text)",
            letterSpacing: "-0.01em",
          }}>
            Roaster Dashboard
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Process origin lots and manage coffee production
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Processed Products", value: String(balances.length), sub: "in inventory" },
          { label: "Capacity", value: "∞", sub: "unlimited processing" },
          { label: "Network", value: "active", sub: "Solana" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 36, fontWeight: 500, color: "var(--text)", lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {actions.map((a) => (
            <button key={a.href + a.title} onClick={() => router.push(a.href)}
              style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24, textAlign: "left", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 12 }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "var(--ink-3)"; el.style.borderColor = `${ACCENT}50`; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "var(--ink-2)"; el.style.borderColor = "var(--divider)"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: ACCENT_DIM, display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{a.desc}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{a.cta}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Workflow</div>
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { n: "01", title: "Receive Raw Materials", desc: "Accept the lots producers transfer to you for processing." },
            { n: "02", title: "Create Final Product", desc: "Blend origin lots to mint roasted or processed product tokens." },
            { n: "03", title: "Distribute", desc: "Transfer your finished products to authorized retailers." },
          ].map((step, i) => (
            <div key={i} style={{ padding: 28, borderRight: i < 2 ? "1px solid var(--divider)" : "none" }}>
              <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 42, fontWeight: 300, color: "var(--gold-dim)", lineHeight: 1, marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
