import { useEffect, useState } from "react";
import { useProgram } from "@/lib/context/ProgramProvider";

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

interface PendingRole {
  wallet: string;
  walletFull: string;
  requestedRole: string;
  createdAt: number;
  pda: string;
}

interface UsePendingRolesReturn {
  pendingRoles: PendingRole[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePendingRoles(): UsePendingRolesReturn {
  const { program } = useProgram();
  const [pendingRoles, setPendingRoles] = useState<PendingRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRoles = async () => {
    if (!program) {
      setPendingRoles([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const accounts = await program.account.pendingRoleRegistration.all();

      console.log("Pending roles accounts:", accounts);

      const roles = accounts.map((account) => {
        const walletStr = account.account.wallet.toString();
        return {
          wallet: `${walletStr.slice(0, 4)}...${walletStr.slice(-4)}`,
          walletFull: walletStr,
          requestedRole: normalizeEnumValue(account.account.requestedRole),
          createdAt: typeof account.account.createdAt === "number"
            ? account.account.createdAt
            : account.account.createdAt.toNumber(),
          pda: account.publicKey.toString(),
        };
      });

      console.log("Formatted pending roles:", roles);
      setPendingRoles(roles as PendingRole[]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching pending roles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pending roles");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRoles();
  }, [program]);

  return {
    pendingRoles,
    loading,
    error,
    refetch: fetchPendingRoles,
  };
}
