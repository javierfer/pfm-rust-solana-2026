import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/context/ProgramProvider";

export interface Certificate {
  pda: PublicKey;
  tokenMint: PublicKey;
  certType: string;
  certTypeNum: number;
  status: string;
  requester: PublicKey;
  authority: PublicKey;
  requestedAt: number;
  resolvedAt: number | null;
  notes: string;
}

function normalizeEnum(value: any): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value) return Object.keys(value)[0] || "";
  return "";
}

const CERT_TYPE_MAP: Record<string, number> = { sanitary: 0, quality: 1, organic: 2 };

export function useCertificates(mint?: PublicKey | null) {
  const { program } = useProgram();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    if (!program) {
      setCertificates([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const all = await program.account.certificate.all();
      const filtered = mint
        ? all.filter((a) => a.account.tokenMint.toString() === mint.toString())
        : all;
      const mapped = filtered.map((a) => {
        const certType = normalizeEnum(a.account.certType);
        return {
          pda: a.publicKey,
          tokenMint: a.account.tokenMint,
          certType,
          certTypeNum: CERT_TYPE_MAP[certType] ?? 0,
          status: normalizeEnum(a.account.status),
          requester: a.account.requester,
          authority: a.account.authority,
          requestedAt: a.account.requestedAt.toNumber(),
          resolvedAt: a.account.resolvedAt ? a.account.resolvedAt.toNumber() : null,
          notes: a.account.notes,
        };
      });
      setCertificates(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [program, mint?.toString()]);

  return { certificates, loading, error, refetch: fetchCertificates };
}

export function usePendingCertificates() {
  const { certificates, loading, error, refetch } = useCertificates();
  return {
    certificates: certificates.filter((c) => c.status === "pending"),
    loading,
    error,
    refetch,
  };
}
