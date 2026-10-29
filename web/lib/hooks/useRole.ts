import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/context/ProgramProvider";
import { getRoleRegistryPDA, getPendingRolePDA, getConfigPDA } from "@/lib/utils/pda";

/**
 * Normalize role enum object to string
 */
function normalizeRole(role: any): string | null {
  if (!role) return null;
  if (typeof role === "string") return role;
  if (typeof role === "object") {
    const roleKey = Object.keys(role)[0];
    return roleKey || null;
  }
  return null;
}

interface UseRoleReturn {
  role: string | null;
  hasPendingRequest: boolean;
  pendingRole: string | null;
  isAuthority: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRole(): UseRoleReturn {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [role, setRole] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isAuthority, setIsAuthority] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    if (!publicKey || !program) {
      setRole(null);
      setPendingRole(null);
      setHasPendingRequest(false);
      setIsAuthority(false);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let roleValue: string | null = null;
      let hasPendingRequestValue = false;
      let pendingRoleValue: string | null = null;

      // Fetch RoleRegistry to check if user has an approved role
      const [roleRegistryPDA] = getRoleRegistryPDA(publicKey);
      try {
        const roleRegistry = await program.account.roleRegistry.fetch(
          roleRegistryPDA
        );
        roleValue = normalizeRole(roleRegistry.role);
      } catch {
        roleValue = null;
      }
      setRole(roleValue);

      // Fetch PendingRoleRegistration to check if user has a pending request
      const [pendingRolePDA] = getPendingRolePDA(publicKey);
      try {
        const pendingRoleReg = await program.account.pendingRoleRegistration.fetch(
          pendingRolePDA
        );
        hasPendingRequestValue = true;
        pendingRoleValue = normalizeRole(pendingRoleReg.requestedRole);
      } catch {
        hasPendingRequestValue = false;
        pendingRoleValue = null;
      }
      setHasPendingRequest(hasPendingRequestValue);
      setPendingRole(pendingRoleValue);

      // Check if user is authority
      const [configPDA] = getConfigPDA();
      try {
        const config = await program.account.programConfig.fetch(configPDA);
        setIsAuthority(config.authority.equals(publicKey));
      } catch {
        // If config doesn't exist, check if user has a validated role
        // If user has NO validated role and NO pending request, they could be the authority
        if (!roleValue && !hasPendingRequestValue) {
          setIsAuthority(true); // Allow user to initialize program
        } else {
          setIsAuthority(false);
        }
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch role");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [publicKey, program]);

  return {
    role,
    hasPendingRequest,
    pendingRole,
    isAuthority,
    loading,
    error,
    refetch: fetchRole,
  };
}
