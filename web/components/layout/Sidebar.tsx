"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/hooks/useRole";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

// Minimal SVG icons
const Icons = {
  initialize: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7.5" cy="7.5" r="2"/>
      <path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M2.9 2.9l1.4 1.4M10.7 10.7l1.4 1.4M2.9 12.1l1.4-1.4M10.7 4.3l1.4-1.4"/>
    </svg>
  ),
  validate: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  certificate: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="2" width="11" height="8" rx="1.5"/>
      <path d="M5 13v-2.5a2.5 2.5 0 015 0V13M5 13l2.5-1.5L10 13" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M7.5 2v11M2 7.5h11" strokeLinecap="round"/>
    </svg>
  ),
  list: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M5 4h8M5 7.5h8M5 11h8M2 4h.5M2 7.5h.5M2 11h.5" strokeLinecap="round"/>
    </svg>
  ),
  transfer: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 5h9M9 2.5L12 5l-3 2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 10H3M6 7.5L3 10l3 2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  home: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2 6.5L7.5 2L13 6.5V13H9.5V9H5.5V13H2V6.5z" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7.5" cy="7.5" r="5.5"/>
      <path d="M7.5 4.5v3.5l2 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const ROLE_ACCENT: Record<string, string> = {
  authority: "#8A3A3A",
  producer: "#4A7A3A",
  factory: "#8A5030",
  retailer: "#C09038",
  consumer: "#3A5A8A",
};

const ROLE_LABELS: Record<string, string> = {
  authority: "Authority",
  producer: "Producer",
  factory: "Roaster",
  retailer: "Retailer",
  consumer: "Consumer",
};

export function Sidebar() {
  const pathname = usePathname();
  const { role, hasPendingRequest, isAuthority, loading } = useRole();

  const getRoleKey = (): string => {
    if (isAuthority) return "authority";
    if (!role) return "none";
    return typeof role === "string" ? role : Object.keys(role)[0] || "none";
  };

  const roleKey = getRoleKey();
  const accent = ROLE_ACCENT[roleKey] || "var(--gold)";
  const roleLabel = ROLE_LABELS[roleKey] || "No Role";

  let navItems: NavItem[] = [];

  if (loading) {
    return (
      <aside style={{ width: 220, minHeight: "100vh", background: "var(--ink-1)", borderRight: "1px solid var(--divider)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 600, color: "var(--gold)", fontStyle: "italic" }}>
            CaféChain
          </div>
        </div>
        <div style={{ padding: "20px", color: "var(--text-3)", fontSize: 13 }}>
          Loading...
        </div>
      </aside>
    );
  }

  if (!role && hasPendingRequest) {
    navItems = [{ label: "Request Pending", href: "/register-role", icon: Icons.clock, badge: "pending" }];
  } else if (isAuthority) {
    navItems = [
      { label: "Initialize", href: "/dashboard/authority/initialize", icon: Icons.initialize },
      { label: "Validate Roles", href: "/dashboard/authority/validate-roles", icon: Icons.validate },
      { label: "Certifications", href: "/dashboard/authority/certificates", icon: Icons.certificate },
    ];
  } else if (roleKey === "producer") {
    navItems = [
      { label: "Create Lot", href: "/dashboard/producer/create-token", icon: Icons.plus },
      { label: "My Lots", href: "/dashboard/producer/my-tokens", icon: Icons.list },
      { label: "Transfers", href: "/dashboard/producer/transfers", icon: Icons.transfer },
      { label: "Certifications", href: "/dashboard/producer/certificates", icon: Icons.certificate },
    ];
  } else if (roleKey === "factory") {
    navItems = [
      { label: "Create Product", href: "/dashboard/factory/create-token", icon: Icons.plus },
      { label: "My Products", href: "/dashboard/factory/my-tokens", icon: Icons.list },
      { label: "Transfers", href: "/dashboard/factory/transfers", icon: Icons.transfer },
    ];
  } else if (roleKey === "retailer") {
    navItems = [
      { label: "My Inventory", href: "/dashboard/retailer/my-tokens", icon: Icons.list },
      { label: "Transfers", href: "/dashboard/retailer/transfers", icon: Icons.transfer },
    ];
  } else if (roleKey === "consumer") {
    navItems = [
      { label: "My Products", href: "/dashboard/consumer/my-tokens", icon: Icons.list },
      { label: "Transfers", href: "/dashboard/consumer/transfers", icon: Icons.transfer },
    ];
  }

  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: "var(--ink-1)",
      borderRight: "1px solid var(--divider)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--gold)",
            fontStyle: "italic",
            letterSpacing: "0.02em",
            marginBottom: 10,
          }}>
            CaféChain
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {roleLabel}
            </span>
          </div>
        </div>
        <svg width="64" height="64" viewBox="0 0 280 280" fill="none" style={{ opacity: 0.95, flexShrink: 0 }}>
          <circle cx="140" cy="140" r="130" fill="rgba(192,144,56,0.08)"/>
          <circle cx="140" cy="140" r="127" stroke="#C09038" strokeWidth="1.8"/>
          <circle cx="140" cy="140" r="118" stroke="#C09038" strokeOpacity="0.4" strokeWidth="1"/>
          <line x1="140" y1="6" x2="140" y2="17" stroke="#C09038" strokeWidth="2.5"/>
          <line x1="274" y1="140" x2="263" y2="140" stroke="#C09038" strokeWidth="2.5"/>
          <line x1="140" y1="274" x2="140" y2="263" stroke="#C09038" strokeWidth="2.5"/>
          <line x1="6" y1="140" x2="17" y2="140" stroke="#C09038" strokeWidth="2.5"/>
          <circle cx="140" cy="18" r="3" fill="#C09038"/>
          <circle cx="262" cy="140" r="3" fill="#C09038"/>
          <circle cx="140" cy="262" r="3" fill="#C09038"/>
          <circle cx="18" cy="140" r="3" fill="#C09038"/>
          <circle cx="140" cy="140" r="108" stroke="#C09038" strokeOpacity="0.6" strokeWidth="1.2"/>
          <circle cx="140" cy="140" r="98" stroke="#C09038" strokeOpacity="0.35" strokeWidth="0.8"/>

          {/* Cup rim */}
          <ellipse cx="140" cy="112" rx="38" ry="7" fill="#0D0905" stroke="#C09038" strokeWidth="1.2"/>
          <ellipse cx="140" cy="112" rx="34" ry="6" fill="#1C1005"/>

          {/* Cup body */}
          <path d="M102 112 L108 158 L172 158 L178 112Z"
            stroke="#C09038" strokeWidth="1.5" fill="rgba(18,11,4,0.92)" strokeLinejoin="round"/>

          {/* Handle */}
          <path d="M178 122 C190 122 195 130 195 137 C195 144 190 152 178 152"
            stroke="#C09038" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

          {/* Saucer */}
          <ellipse cx="140" cy="162" rx="42" ry="7" fill="rgba(18,12,5,0.9)" stroke="#C09038" strokeWidth="1"/>
        </svg>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {/* Home button at top */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "9px 12px",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-2)",
            background: "var(--ink-3)",
            border: "1px solid var(--divider-strong)",
            textDecoration: "none",
            transition: "all 0.15s",
            marginBottom: 12,
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
          {Icons.home}
          <span>Home</span>
        </Link>

        {navItems.length === 0 && !hasPendingRequest ? (
          <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-3)" }}>
            No role assigned
          </div>
        ) : (
          navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 7,
                  marginBottom: 4,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#fff" : "var(--text)",
                  background: isActive ? accent : "var(--ink-3)",
                  border: isActive ? "none" : "1px solid var(--divider-strong)",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--ink-4)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = accent;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--ink-3)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--divider-strong)";
                  }
                }}
              >
                <span style={{ color: isActive ? "rgba(255,255,255,0.85)" : "var(--text-2)", flexShrink: 0, display: "flex" }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge === "pending" && (
                  <span style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: "rgba(192,144,56,0.15)",
                    color: "var(--gold)",
                    border: "1px solid var(--gold-dim)",
                    fontWeight: 600,
                  }}>
                    Pend.
                  </span>
                )}
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7, flexShrink: 0 }}>
                    <path d="M4.5 3L7.5 6L4.5 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "10px", borderTop: "1px solid var(--divider)" }}>
        <div style={{ fontSize: 10, color: "var(--text-3)", padding: "0 10px", letterSpacing: "0.08em", opacity: 0.6 }}>
          v1.0 · localnet
        </div>
      </div>
    </aside>
  );
}
