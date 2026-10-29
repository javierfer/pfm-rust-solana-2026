import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/context/ProgramProvider";
import { Traza } from "@/types/traza";

type TokenStatus = Traza["types"][10]["type"]["variants"][number]["name"];
type Role = Traza["types"][7]["type"]["variants"][number]["name"];

/**
 * Normalize enum objects to strings
 */
function normalizeEnumValue(value: any): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value) {
    return Object.keys(value)[0] || "";
  }
  return "";
}

export interface Token {
  mint: PublicKey;
  creator: PublicKey;
  creatorRole: string; // Normalized to string
  currentOwner: PublicKey;
  amount: bigint;
  status: string; // Normalized to string
  sourceTokens: PublicKey[];
  metadata: string;
  createdAt: number;
  pda: PublicKey;
}

interface UseTokensReturn {
  tokens: Token[];
  ownedTokens: Token[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokens(userWallet?: PublicKey): UseTokensReturn {
  const { program } = useProgram();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [ownedTokens, setOwnedTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    if (!program || !userWallet) {
      setTokens([]);
      setOwnedTokens([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch all tokens from the program
      const allTokenAccounts = await program.account.traceToken.all();

      const formatTokens = (accounts: any[]): Token[] =>
        accounts.map((account) => ({
          mint: account.account.mint,
          creator: account.account.creator,
          creatorRole: normalizeEnumValue(account.account.creatorRole),
          currentOwner: account.account.creator,
          amount: BigInt(account.account.totalSupply.toString()),
          status: normalizeEnumValue(account.account.status),
          sourceTokens: account.account.sourceTokens,
          metadata: account.account.metadata,
          createdAt: account.account.createdAt.toNumber(),
          pda: account.publicKey,
        }));

      // Filter tokens created by user
      const createdByUser = allTokenAccounts.filter(
        (account) => account.account.creator.toString() === userWallet.toString()
      );

      // Show all tokens for ownedByUser (no currentOwner field; use creator as proxy)
      const ownedByUser = createdByUser;

      setTokens(formatTokens(createdByUser));
      setOwnedTokens(formatTokens(ownedByUser));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [program, userWallet]);

  return {
    tokens,
    ownedTokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}
