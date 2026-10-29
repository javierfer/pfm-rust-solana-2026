"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRole } from "@/lib/hooks/useRole";
import { formatRole } from "@/lib/utils/format";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const roles = [
  {
    key: "producer",
    title: "Producer",
    subtitle: "Origin",
    desc: "Registers lots with farm, altitude, variety and harvest weather data.",
    accent: "#4A7A3A",
    accentDim: "rgba(74,122,58,0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M10 2C10 2 4 7 4 12a6 6 0 0012 0C16 7 10 2 10 2z"/>
        <path d="M10 12V6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "factory",
    title: "Roaster",
    subtitle: "Processing",
    desc: "Processes origin lots, creates roasted or ground products and manages production.",
    accent: "#8A5030",
    accentDim: "rgba(138,80,48,0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="7" width="14" height="10" rx="1.5"/>
        <path d="M7 7V5a3 3 0 016 0v2" strokeLinecap="round"/>
        <circle cx="10" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    key: "retailer",
    title: "Retailer",
    subtitle: "Distribution",
    desc: "Receives processed products and distributes them to the end consumer, keeping the chain intact.",
    accent: "#C09038",
    accentDim: "rgba(192,144,56,0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
        <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/>
        <circle cx="6" cy="10" r="1" fill="currentColor" stroke="none"/>
        <circle cx="6" cy="14" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    key: "consumer",
    title: "Consumer",
    subtitle: "Verification",
    desc: "Verifies the full origin of their coffee, from farm to point of sale, immutable on the blockchain.",
    accent: "#3A5A8A",
    accentDim: "rgba(58,90,138,0.12)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 14c0-2 2-4 4-4h6c2 0 4 2 4 4" strokeLinecap="round"/>
        <circle cx="10" cy="7" r="3"/>
      </svg>
    ),
  },
];

const steps = [
  {
    n: "01",
    title: "Register a Lot",
    desc: "The producer mints a token with farm, altitude, variety and harvest date. Immutable on Solana.",
  },
  {
    n: "02",
    title: "Process and Certify",
    desc: "The roaster processes the lot. The authority issues health, quality and organic certificates on-chain.",
  },
  {
    n: "03",
    title: "Verify Origin",
    desc: "The consumer sees the full timeline, from farm to cup, with every recorded event.",
  },
];

export default function Home() {
  const { publicKey } = useWallet();
  const { role } = useRole();

  return (
    <div style={{ background: "var(--ink)", color: "var(--text)", minHeight: "100vh" }}>
      {/* Top bar */}
      <header style={{
        borderBottom: "1px solid var(--divider)",
        background: "var(--ink-1)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--gold)",
              letterSpacing: "0.04em",
              fontStyle: "italic",
            }}>
              CaféChain
            </span>
            <span style={{
              height: 16,
              width: 1,
              background: "var(--divider-strong)",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Traceability · Solana
            </span>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{ padding: "80px 32px 72px", position: "relative", overflow: "hidden" }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "40%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 400,
            background: "radial-gradient(ellipse, rgba(192,144,56,0.07) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", display: "flex", alignItems: "center", gap: 64 }}>
            {/* Text column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "inline-block",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 24,
                padding: "4px 12px",
                border: "1px solid var(--gold-dim)",
                borderRadius: 4,
              }}>
                Blockchain · Value Chain
              </div>
              <h1 style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(48px, 6vw, 78px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                marginBottom: 28,
                fontStyle: "italic",
              }}>
                From Bean<br />to Cup
              </h1>
              <p style={{ fontSize: 16, color: "var(--text-2)", maxWidth: 460, marginBottom: 40, lineHeight: 1.7 }}>
                End-to-end coffee traceability on the Solana blockchain. Every lot certified and immutable, from farm to cup.
              </p>
              {publicKey ? (
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--gold)",
                    color: "var(--ink)",
                    padding: "13px 32px",
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    letterSpacing: "0.03em",
                    transition: "background 0.2s",
                  }}
                >
                  Open Dashboard
                  {role && (
                    <span style={{ opacity: 0.7, fontSize: 12 }}>— {formatRole(role)}</span>
                  )}
                </Link>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
                    Connect your Backpack wallet to start
                  </p>
                  <WalletMultiButton />
                </div>
              )}
            </div>

            {/* Coffee logo illustration */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="300" height="300" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ filter: "drop-shadow(0 0 48px rgba(192,144,56,0.14))" }}>
                {/* Outermost dashed ring */}
                <circle cx="140" cy="140" r="135" stroke="#C09038" strokeOpacity="0.18" strokeWidth="0.7" strokeDasharray="2 4"/>
                {/* Main medallion ring */}
                <circle cx="140" cy="140" r="127" stroke="#C09038" strokeOpacity="0.65" strokeWidth="1.5"/>
                {/* Background fill */}
                <circle cx="140" cy="140" r="125" fill="#0F0C09"/>
                {/* Inner decorative ring */}
                <circle cx="140" cy="140" r="118" stroke="#C09038" strokeOpacity="0.14" strokeWidth="0.8"/>

                {/* Cardinal tick marks */}
                <line x1="140" y1="6" x2="140" y2="17" stroke="#C09038" strokeOpacity="0.65" strokeWidth="2"/>
                <line x1="274" y1="140" x2="263" y2="140" stroke="#C09038" strokeOpacity="0.65" strokeWidth="2"/>
                <line x1="140" y1="274" x2="140" y2="263" stroke="#C09038" strokeOpacity="0.65" strokeWidth="2"/>
                <line x1="6" y1="140" x2="17" y2="140" stroke="#C09038" strokeOpacity="0.65" strokeWidth="2"/>
                {/* Diagonal minor ticks */}
                <line x1="234" y1="46" x2="227" y2="53" stroke="#C09038" strokeOpacity="0.3" strokeWidth="1"/>
                <line x1="234" y1="234" x2="227" y2="227" stroke="#C09038" strokeOpacity="0.3" strokeWidth="1"/>
                <line x1="46" y1="234" x2="53" y2="227" stroke="#C09038" strokeOpacity="0.3" strokeWidth="1"/>
                <line x1="46" y1="46" x2="53" y2="53" stroke="#C09038" strokeOpacity="0.3" strokeWidth="1"/>
                {/* Dot ornaments at cardinals */}
                <circle cx="140" cy="18" r="2.5" fill="#C09038" fillOpacity="0.55"/>
                <circle cx="262" cy="140" r="2.5" fill="#C09038" fillOpacity="0.55"/>
                <circle cx="140" cy="262" r="2.5" fill="#C09038" fillOpacity="0.55"/>
                <circle cx="18" cy="140" r="2.5" fill="#C09038" fillOpacity="0.55"/>

                {/* ── STEAM ── three S-curves */}
                <path d="M113 95 C111 87 116 80 114 74 C112 67 107 64 109 57"
                  stroke="#C09038" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5" fill="none"/>
                <path d="M140 90 C138 80 144 73 142 63 C140 54 135 51 137 42"
                  stroke="#C09038" strokeWidth="1.9" strokeLinecap="round" strokeOpacity="0.68" fill="none"/>
                <path d="M167 95 C169 87 164 80 166 74 C168 67 173 64 171 57"
                  stroke="#C09038" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5" fill="none"/>

                {/* ── CUP RIM ── */}
                <ellipse cx="140" cy="108" rx="52" ry="10" fill="#0D0905" stroke="#C09038" strokeWidth="1.5"/>
                {/* Coffee liquid */}
                <ellipse cx="140" cy="108" rx="47" ry="8.5" fill="#1C1005"/>
                {/* Latte art — rosetta */}
                <ellipse cx="140" cy="108" rx="30" ry="5.5" stroke="#C09038" strokeOpacity="0.28" strokeWidth="0.9" fill="none"/>
                <line x1="140" y1="102.5" x2="140" y2="113.5" stroke="#C09038" strokeOpacity="0.28" strokeWidth="0.9"/>
                <path d="M126 106 C132 107 136 108 140 108" stroke="#C09038" strokeOpacity="0.22" strokeWidth="0.8" fill="none"/>
                <path d="M154 106 C148 107 144 108 140 108" stroke="#C09038" strokeOpacity="0.22" strokeWidth="0.8" fill="none"/>
                <path d="M130 104 C134 106 137 108 140 108" stroke="#C09038" strokeOpacity="0.16" strokeWidth="0.7" fill="none"/>
                <path d="M150 104 C146 106 143 108 140 108" stroke="#C09038" strokeOpacity="0.16" strokeWidth="0.7" fill="none"/>

                {/* ── CUP BODY ── trapezoid */}
                <path d="M88 108 L95 178 L185 178 L192 108Z"
                  stroke="#C09038" strokeWidth="2" fill="rgba(18,11,4,0.92)" strokeLinejoin="round"/>

                {/* ── HANDLE ── */}
                <path d="M192 125 C220 125 228 141 228 151 C228 161 220 170 192 170"
                  stroke="#C09038" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d="M192 137 C212 137 217 149 217 153 C217 157 212 163 192 163"
                  stroke="#C09038" strokeWidth="0.9" strokeOpacity="0.3" fill="none" strokeLinecap="round"/>

                {/* ── SAUCER ── */}
                <ellipse cx="140" cy="183" rx="64" ry="11" fill="rgba(18,12,5,0.9)" stroke="#C09038" strokeWidth="1.5"/>
                <path d="M76 183 L83 196 L197 196 L204 183"
                  stroke="#C09038" strokeOpacity="0.42" strokeWidth="1" fill="none"/>

                {/* ── BEAN DECORATIONS ── at corners inside medallion */}
                <g transform="translate(56,66) rotate(-28)">
                  <ellipse cx="0" cy="0" rx="10" ry="6.5" stroke="#C09038" strokeOpacity="0.42" strokeWidth="1" fill="rgba(18,11,4,0.6)"/>
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#C09038" strokeOpacity="0.3" strokeWidth="0.8"/>
                </g>
                <g transform="translate(224,66) rotate(28)">
                  <ellipse cx="0" cy="0" rx="10" ry="6.5" stroke="#C09038" strokeOpacity="0.42" strokeWidth="1" fill="rgba(18,11,4,0.6)"/>
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#C09038" strokeOpacity="0.3" strokeWidth="0.8"/>
                </g>
                <g transform="translate(52,212) rotate(30)">
                  <ellipse cx="0" cy="0" rx="10" ry="6.5" stroke="#C09038" strokeOpacity="0.42" strokeWidth="1" fill="rgba(18,11,4,0.6)"/>
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#C09038" strokeOpacity="0.3" strokeWidth="0.8"/>
                </g>
                <g transform="translate(228,212) rotate(-30)">
                  <ellipse cx="0" cy="0" rx="10" ry="6.5" stroke="#C09038" strokeOpacity="0.42" strokeWidth="1" fill="rgba(18,11,4,0.6)"/>
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#C09038" strokeOpacity="0.3" strokeWidth="0.8"/>
                </g>

                {/* Text path along bottom arc */}
                <defs>
                  <path id="bottomArc" d="M 26,140 A 114,114 0 0 0 254,140"/>
                </defs>
                <text fontSize="9.5" fill="#C09038" fillOpacity="0.45" letterSpacing="4" textAnchor="middle" fontFamily="var(--font-dm-sans, sans-serif)" fontWeight="500">
                  <textPath href="#bottomArc" startOffset="50%">CAFÉCHAIN · SOLANA · TRACEABILITY</textPath>
                </text>
              </svg>
            </div>
          </div>
        </section>

        {/* Thin gold line */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ height: 1, background: "linear-gradient(to right, transparent, var(--gold-dim), transparent)" }} />
        </div>

        {/* Roles */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 48, display: "flex", alignItems: "baseline", gap: 16 }}>
              <h2 style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 36,
                fontWeight: 500,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}>
                Supply Chain Participants
              </h2>
              <span style={{ height: 1, flex: 1, background: "var(--divider)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {roles.map((r) => (
                <div
                  key={r.key}
                  style={{
                    background: "var(--ink-2)",
                    border: "1px solid var(--divider)",
                    borderRadius: 8,
                    padding: 24,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = r.accent + "60";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--divider)";
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: r.accentDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: r.accent,
                    marginBottom: 16,
                  }}>
                    {r.icon}
                  </div>
                  <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                    {r.subtitle}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    {r.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                    {r.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "80px 32px", background: "var(--ink-1)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 48, display: "flex", alignItems: "baseline", gap: 16 }}>
              <h2 style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 36,
                fontWeight: 500,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}>
                How It Works
              </h2>
              <span style={{ height: 1, flex: 1, background: "var(--divider)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--divider)" }}>
              {steps.map((s, i) => (
                <div key={i} style={{ background: "var(--ink-1)", padding: 40 }}>
                  <div style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: 56,
                    fontWeight: 300,
                    color: "var(--gold-dim)",
                    lineHeight: 1,
                    marginBottom: 24,
                    letterSpacing: "-0.02em",
                  }}>
                    {s.n}
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 12,
                  }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div style={{
              border: "1px solid var(--divider-strong)",
              borderRadius: 12,
              padding: "64px 48px",
              background: "linear-gradient(135deg, var(--ink-2) 0%, var(--ink-3) 100%)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                height: 200,
                background: "radial-gradient(ellipse, rgba(192,144,56,0.05) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <h2 style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: 40,
                fontWeight: 400,
                color: "var(--text)",
                marginBottom: 16,
                fontStyle: "italic",
              }}>
                Full Transparency
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 32, lineHeight: 1.7 }}>
                Solana · Anchor 0.32 · Backpack Wallet
              </p>
              {!publicKey ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <WalletMultiButton />
                </div>
              ) : (
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--gold)",
                    color: "var(--ink)",
                    padding: "12px 28px",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Go to Dashboard →
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--divider)", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 16,
            color: "var(--gold)",
            fontStyle: "italic",
          }}>
            CaféChain
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            Blockchain Master's Final Project · Solana
          </span>
        </div>
      </footer>
    </div>
  );
}
