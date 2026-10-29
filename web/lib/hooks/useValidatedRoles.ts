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

interface ValidatedRole {
  wallet: string;
  walletFull: string;
  role: string;
  pda: string;
}

interface UseValidatedRolesReturn {
  validatedRoles: ValidatedRole[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useValidatedRoles(): UseValidatedRolesReturn {
  const { program } = useProgram();
  const [validatedRoles, setValidatedRoles] = useState<ValidatedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchValidatedRoles = async () => {
    if (!program) {
      setValidatedRoles([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const accounts = await program.account.roleRegistry.all();

      console.log("Validated roles accounts:", accounts);

      const roles = accounts.map((account) => {
        const walletStr = account.account.wallet.toString();
        return {
          wallet: `${walletStr.slice(0, 4)}...${walletStr.slice(-4)}`,
          walletFull: walletStr,
          role: normalizeEnumValue(account.account.role),
          pda: account.publicKey.toString(),
        };
      });

      console.log("Formatted validated roles:", roles);
      setValidatedRoles(roles as ValidatedRole[]);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching validated roles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch validated roles");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidatedRoles();
  }, [program]);

  return {
    validatedRoles,
    loading,
    error,
    refetch: fetchValidatedRoles,
  };
}
