import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/context/ProgramProvider";

export interface TokenBalance {
  tokenMint: PublicKey;
  owner: PublicKey;
  balance: bigint;
  pda: PublicKey;
  lastUpdated: number;
}

interface UseTokenBalancesReturn {
  balances: TokenBalance[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getBalance: (tokenMint: PublicKey) => bigint;
}

export function useTokenBalances(userWallet?: PublicKey): UseTokenBalancesReturn {
  const { program } = useProgram();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!program || !userWallet) {
      setBalances([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch all TokenBalance accounts with memcmp filter for owner
      const allBalances = await (program.account as any).tokenBalance.all([
        {
          memcmp: {
            // offset: discriminator(8) + token_mint(32)
            offset: 40,
            bytes: userWallet.toBase58(),
          },
        },
      ]);

      const formattedBalances: TokenBalance[] = allBalances.map((account: any) => ({
        tokenMint: account.account.tokenMint,
        owner: account.account.owner,
        balance: BigInt(account.account.balance.toString()),
        pda: account.publicKey,
        lastUpdated: account.account.lastUpdated.toNumber(),
      }));

      setBalances(formattedBalances);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [program, userWallet]);

  const getBalance = (tokenMint: PublicKey): bigint => {
    const balance = balances.find((b) => b.tokenMint.equals(tokenMint));
    return balance ? balance.balance : BigInt(0);
  };

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
    getBalance,
  };
}
