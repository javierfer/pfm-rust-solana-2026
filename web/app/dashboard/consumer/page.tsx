"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRole } from "@/lib/hooks/useRole";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";

const ACCENT = "#3A5A8A";
const ACCENT_DIM = "rgba(58,90,138,0.1)";

export default function ConsumerDashboard() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { role, loading: roleLoading } = useRole();
  const { balances, loading: balancesLoading } = useTokenBalances(publicKey!);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    if (!roleLoading && role && role !== "consumer") router.push("/dashboard");
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

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 3, height: 24, background: ACCENT, borderRadius: 2 }} />
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Consumer Dashboard
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>
          Verify the full origin of your coffee on the blockchain
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Traceable Products", value: String(balances.length), sub: "verified on blockchain" },
          { label: "Transparency", value: "100%", sub: "verifiable origin" },
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
          {[
            { href: "/dashboard/consumer/my-tokens", title: "My Products", desc: "See all your products with their full traceability chain.", cta: `View products (${balances.length}) →` },
            { href: "/dashboard/consumer/transfers", title: "Transfers", desc: "Review received shipments and their chain-of-custody status.", cta: "View transfers →" },
          ].map((a) => (
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

      <div style={{ marginTop: 32, background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>
          Origin Verification
        </div>
        <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
          Every product you own was recorded on the Solana blockchain. You can see the full timeline of its journey:
          from the producer's farm, through the roaster, to your hands.
          Every certificate issued by the authority is verifiable and permanent.
        </p>
      </div>
    </div>
  );
}
