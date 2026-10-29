"use client";

import { TokenBalance } from "@/lib/hooks/useTokenBalances";
import { formatAddress, formatAmount } from "@/lib/utils/format";

interface TokenBalanceCardProps {
  balance: TokenBalance;
  totalSupply: bigint;
  metadata?: string;
  onTransfer?: (balance: TokenBalance) => void;
  onDetail?: (balance: TokenBalance) => void;
}

export function TokenBalanceCard({
  balance,
  totalSupply,
  metadata,
  onTransfer,
  onDetail,
}: TokenBalanceCardProps) {
  const percentage =
    totalSupply > BigInt(0) ? (Number(balance.balance) / Number(totalSupply)) * 100 : 0;
  const isEmpty = balance.balance === BigInt(0);

  return (
    <div style={{
      background: "var(--ink-2)",
      border: "1px solid var(--divider)",
      borderRadius: 8,
      padding: 20,
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--divider-strong)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--divider)"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text)",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {metadata && metadata.length > 30
              ? metadata.substring(0, 32) + "…"
              : metadata || formatAddress(balance.tokenMint.toString())}
          </div>
          <div style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: 10,
            color: "var(--text-3)",
            letterSpacing: "0.04em",
          }}>
            {formatAddress(balance.tokenMint.toString())}
          </div>
        </div>
        {isEmpty && (
          <span style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 3,
            background: "rgba(90,74,53,0.3)",
            color: "var(--text-3)",
            border: "1px solid rgba(90,74,53,0.5)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            flexShrink: 0,
            marginLeft: 8,
          }}>
            EMPTY
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Your Balance
          </div>
          <div style={{ fontSize: 22, fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "var(--text)" }}>
            {formatAmount(balance.balance)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Total Supply
          </div>
          <div style={{ fontSize: 22, fontFamily: "var(--font-cormorant)", fontWeight: 600, color: "var(--text)" }}>
            {formatAmount(totalSupply)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Share
          </span>
          <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 2, background: "var(--ink-4)", borderRadius: 1 }}>
          <div style={{
            height: 2,
            background: percentage > 0 ? "var(--gold)" : "var(--ink-5)",
            borderRadius: 1,
            width: `${Math.min(percentage, 100)}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14 }}>
        Updated {new Date(balance.lastUpdated * 1000).toLocaleDateString("en-US")}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        {onDetail && (
          <button
            onClick={() => onDetail(balance)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              color: "var(--text-2)",
              border: "1px solid var(--divider-strong)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--divider-strong)";
            }}
          >
            View Details
          </button>
        )}
        {onTransfer && !isEmpty && (
          <button
            onClick={() => onTransfer(balance)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: "var(--gold)",
              color: "var(--ink)",
              border: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-bright)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--gold)";
            }}
          >
            Transfer
          </button>
        )}
      </div>
    </div>
  );
}
