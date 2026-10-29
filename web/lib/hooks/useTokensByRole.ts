import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/context/ProgramProvider";
import { Traza } from "@/types/traza";

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
  creatorRole: string;
  currentOwner: PublicKey;
  amount: bigint;
  status: string;
  sourceTokens: PublicKey[];
  metadata: string;
  createdAt: number;
  pda: PublicKey;
}

interface UseTokensByRoleReturn {
  tokens: Token[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch all tokens created by a specific role
 */
export function useTokensByRole(role: Role): UseTokensByRoleReturn {
  const { program } = useProgram();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    if (!program) {
      setTokens([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch all tokens from the program
      const allTokenAccounts = await (program.account as any).traceToken.all();

      // Filter tokens by creator role
      const filteredTokens = allTokenAccounts
        .map((account: any) => ({
          mint: account.account.mint,
          creator: account.account.creator,
          creatorRole: normalizeEnumValue(account.account.creatorRole),
          currentOwner: account.account.creator, // Use creator as currentOwner since it's not stored separately
          amount: BigInt(account.account.totalSupply.toString()),
          status: normalizeEnumValue(account.account.status),
          sourceTokens: account.account.sourceTokens,
          metadata: account.account.metadata,
          createdAt: account.account.createdAt.toNumber(),
          pda: account.publicKey,
        }))
        .filter((token: any) => token.creatorRole === role);

      setTokens(filteredTokens as Token[]);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tokens");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [program, role]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}
