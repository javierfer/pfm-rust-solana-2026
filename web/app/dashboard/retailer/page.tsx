"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRole } from "@/lib/hooks/useRole";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";

const ACCENT = "#9A7830";
const ACCENT_DIM = "rgba(154,120,48,0.1)";

export default function RetailerDashboard() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { role, loading: roleLoading } = useRole();
  const { balances, loading: balancesLoading } = useTokenBalances(publicKey!);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    if (!roleLoading && role && role !== "retailer") router.push("/dashboard");
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

  if (!publicKey) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--text-2)", fontSize: 13 }}>
      Connect your wallet to continue
    </div>
  );

  const actions = [
    { href: "/dashboard/retailer/my-tokens", title: "My Inventory", desc: "See every product in stock received from roasters.", cta: `View products (${balances.length}) →` },
    { href: "/dashboard/retailer/transfers", title: "Transfers", desc: "Accept incoming shipments and distribute to end consumers.", cta: "Manage →" },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: ACCENT, borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Retailer Dashboard
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Manage inventory and coffee distribution to consumers
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Products in Stock", value: String(balances.length), sub: "ready to distribute" },
          { label: "Reach", value: "∞", sub: "consumers" },
          { label: "Network", value: "active", sub: "Solana" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 36, fontWeight: 500, color: "var(--text)", lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {actions.map((a) => (
            <button key={a.href} onClick={() => router.push(a.href)}
              style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 24, textAlign: "left", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 12 }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "var(--ink-3)"; el.style.borderColor = `${ACCENT}80`; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "var(--ink-2)"; el.style.borderColor = "var(--divider)"; }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{a.desc}</div>
              </div>
              <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{a.cta}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
