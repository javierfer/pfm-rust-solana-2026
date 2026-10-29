"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/hooks/useRole";
import { formatRole } from "@/lib/utils/format";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const ROLE_ACCENT: Record<string, string> = {
  authority: "#8A3A3A",
  producer: "#4A7A3A",
  factory: "#8A5030",
  retailer: "#C09038",
  consumer: "#3A5A8A",
};

const PATH_LABELS: Record<string, string> = {
  "/dashboard/authority/initialize": "Initialize Program",
  "/dashboard/authority/validate-roles": "Validate Roles",
  "/dashboard/authority/certificates": "Certifications",
  "/dashboard/producer/create-token": "Create Lot",
  "/dashboard/producer/my-tokens": "My Lots",
  "/dashboard/producer/transfers": "Transfers",
  "/dashboard/producer/certificates": "Certifications",
  "/dashboard/factory/create-token": "Create Product",
  "/dashboard/factory/my-tokens": "My Products",
  "/dashboard/factory/transfers": "Transfers",
  "/dashboard/retailer/my-tokens": "My Inventory",
  "/dashboard/retailer/transfers": "Transfers",
  "/dashboard/consumer/my-tokens": "My Products",
  "/dashboard/consumer/transfers": "Transfers",
};

export function Header() {
  const { role, hasPendingRequest } = useRole();
  const pathname = usePathname();

  const roleKey = typeof role === "string" ? role :
    (role && typeof role === "object" ? Object.keys(role)[0] : null);
  const accent = roleKey ? (ROLE_ACCENT[roleKey] || "var(--gold)") : "var(--gold)";
  const pageLabel = PATH_LABELS[pathname] || "";

  return (
    <header style={{
      height: 52,
      borderBottom: "1px solid var(--divider)",
      background: "var(--ink-1)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      flexShrink: 0,
      gap: 16,
    }}>
      {/* Breadcrumb */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        {roleKey && (
          <span style={{
            fontSize: 11,
            color: "var(--text-3)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            {formatRole(role)}
          </span>
        )}
        {pageLabel && (
          <>
            <span style={{ color: "var(--divider-strong)", fontSize: 12 }}>›</span>
            <span style={{ fontSize: 13, color: "var(--text-2)" }}>{pageLabel}</span>
          </>
        )}
        {hasPendingRequest && (
          <span style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 3,
            background: "rgba(192,144,56,0.1)",
            color: "var(--gold)",
            border: "1px solid var(--gold-dim)",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}>
            PENDING APPROVAL
          </span>
        )}
      </div>

      {/* Role indicator */}
      {roleKey && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: accent,
          }} />
          <span style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em" }}>
            {formatRole(role)}
          </span>
        </div>
      )}

      <WalletMultiButton />
    </header>
  );
}
