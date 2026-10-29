import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/context/ProgramProvider";

export interface PendingTransfer {
  tokenMint: PublicKey;
  from: PublicKey;
  to: PublicKey;
  amount: bigint;
  initiatedAt: number;
  pda: PublicKey;
}

interface UseTransfersReturn {
  sentTransfers: PendingTransfer[];
  receivedTransfers: PendingTransfer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransfers(userWallet?: PublicKey): UseTransfersReturn {
  const { program } = useProgram();
  const [sentTransfers, setSentTransfers] = useState<PendingTransfer[]>([]);
  const [receivedTransfers, setReceivedTransfers] = useState<PendingTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    if (!program || !userWallet) {
      setSentTransfers([]);
      setReceivedTransfers([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch transfers sent by user (from = userWallet)
      const sentData = await program.account.pendingTransfer.all([
        {
          memcmp: {
            offset: 8 + 32, // discriminator (8) + tokenMint (32)
            bytes: userWallet.toBase58(),
          },
        },
      ]);

      // Fetch transfers to user (to = userWallet)
      const receivedData = await program.account.pendingTransfer.all([
        {
          memcmp: {
            offset: 8 + 32 + 32, // discriminator (8) + tokenMint (32) + from (32)
            bytes: userWallet.toBase58(),
          },
        },
      ]);

      const formatTransfers = (accounts: any[]): PendingTransfer[] =>
        accounts.map((account) => ({
          tokenMint: account.account.tokenMint,
          from: account.account.from,
          to: account.account.to,
          amount: account.account.amount,
          initiatedAt: account.account.initiatedAt.toNumber(),
          pda: account.publicKey,
        }));

      setSentTransfers(formatTransfers(sentData));
      setReceivedTransfers(formatTransfers(receivedData));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transfers");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [program, userWallet]);

  return {
    sentTransfers,
    receivedTransfers,
    loading,
    error,
    refetch: fetchTransfers,
  };
}
