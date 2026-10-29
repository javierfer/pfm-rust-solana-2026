import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/lib/context/ProgramProvider";

export interface TraceEvent {
  pda: PublicKey;
  tokenMint: PublicKey;
  recorder: PublicKey;
  eventType: string;
  description: string;
  timestamp: number;
  temperature: number | null;
  humidity: number | null;
  index: number;
}

function normalizeEnum(value: any): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value) return Object.keys(value)[0] || "";
  return "";
}

export function useTraceEvents(mint: PublicKey | null) {
  const { program } = useProgram();
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!program || !mint) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const all = await program.account.traceEvent.all();
      const filtered = all
        .filter((a) => a.account.tokenMint.toString() === mint.toString())
        .map((a) => ({
          pda: a.publicKey,
          tokenMint: a.account.tokenMint,
          recorder: a.account.recorder,
          eventType: normalizeEnum(a.account.eventType),
          description: a.account.description,
          timestamp: a.account.timestamp.toNumber(),
          temperature: a.account.temperature ?? null,
          humidity: a.account.humidity ?? null,
          index: a.account.index,
        }))
        .sort((a, b) => a.timestamp - b.timestamp || a.index - b.index);
      setEvents(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [program, mint?.toString()]);

  return { events, loading, error, refetch: fetchEvents };
}
