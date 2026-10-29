"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useTokenBalances, TokenBalance } from "@/lib/hooks/useTokenBalances";
import { TokenBalanceCard } from "@/components/token/TokenBalanceCard";

interface TokenInfo { balance: TokenBalance; metadata: string; totalSupply: bigint; }

export default function FactoryMyTokensPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { balances, loading, error } = useTokenBalances(publicKey!);
  const [tokensInfo, setTokensInfo] = useState<TokenInfo[]>([]);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    const enrichBalances = async () => {
      if (!program || !program.account || balances.length === 0) { setTokensInfo([]); return; }
      setEnriching(true);
      try {
        const enriched = await Promise.all(balances.map(async (balance) => {
          try {
            const accounts = await (program.account as any).traceToken.all([{ memcmp: { offset: 8, bytes: balance.tokenMint.toBase58() } }]);
            if (accounts.length === 0) return { balance, metadata: balance.tokenMint.toString(), totalSupply: balance.balance };
            const t = await (program.account as any).traceToken.fetch(accounts[0].publicKey);
            return { balance, metadata: t.metadata || balance.tokenMint.toString(), totalSupply: BigInt(t.totalSupply.toString()) };
          } catch { return { balance, metadata: balance.tokenMint.toString(), totalSupply: balance.balance }; }
        }));
        setTokensInfo(enriched);
      } catch {
        setTokensInfo(balances.map(b => ({ balance: b, metadata: b.tokenMint.toString(), totalSupply: b.balance })));
      } finally { setEnriching(false); }
    };
    enrichBalances();
  }, [program, balances]);

  const isLoading = loading || enriching;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 3, height: 24, background: "#8A5030", borderRadius: 2 }} />
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: 38, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.01em" }}>My Products</h1>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginLeft: 13 }}>Processed products recorded on the blockchain</p>
        </div>
        <button onClick={() => router.push("/dashboard/factory/create-token")}
          style={{ padding: "9px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--gold)", color: "var(--ink)", border: "none" }}>
          + Create Product
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", borderRadius: 6, background: "var(--crimson-dim)", border: "1px solid rgba(138,58,58,0.4)", color: "#C87A7A", fontSize: 13, marginBottom: 20 }}>{error}</div>}

      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12, color: "var(--text-2)", fontSize: 13 }}>
          <div style={{ width: 16, height: 16, border: "1.5px solid var(--divider-strong)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading products...
        </div>
      ) : tokensInfo.length === 0 ? (
        <div style={{ background: "var(--ink-2)", border: "1px solid var(--divider)", borderRadius: 8, padding: 56, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>No products created</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24 }}>Receive lots from producers and create your first processed product.</div>
          <button onClick={() => router.push("/dashboard/factory/create-token")}
            style={{ padding: "10px 24px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "var(--gold)", color: "var(--ink)", border: "none" }}>
            Create first product
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>{tokensInfo.length} product{tokensInfo.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {tokensInfo.map((info) => (
              <TokenBalanceCard
                key={info.balance.tokenMint.toString()}
                balance={info.balance} totalSupply={info.totalSupply} metadata={info.metadata}
                onTransfer={(b) => router.push(`/dashboard/factory/transfers?tokenMint=${b.tokenMint.toString()}`)}
                onDetail={(b) => router.push(`/dashboard/factory/token/${b.tokenMint.toString()}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
