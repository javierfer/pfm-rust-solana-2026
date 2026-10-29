"use client";

import React, { useMemo, ReactNode } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Traza } from "@/types/traza";
import TrazaIDL from "@/types/traza.json";
import { PROGRAM_ID } from "@/lib/solana/constants";

interface ProgramContextType {
  program: Program<Traza> | null;
  provider: AnchorProvider | null;
  isReady: boolean;
}

const ProgramContext = React.createContext<ProgramContextType>({
  program: null,
  provider: null,
  isReady: false,
});

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const { program, provider, isReady } = useMemo(() => {
    if (!anchorWallet) {
      return { program: null, provider: null, isReady: false };
    }

    try {
      const newProvider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });

      const program = new Program<Traza>(TrazaIDL as any, newProvider);

      return { program, provider: newProvider, isReady: true };
    } catch (error) {
      console.error("Failed to initialize program:", error);
      return { program: null, provider: null, isReady: false };
    }
  }, [connection, anchorWallet]);

  return (
    <ProgramContext.Provider value={{ program, provider, isReady }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const context = React.useContext(ProgramContext);
  if (!context) {
    throw new Error("useProgram must be used within ProgramProvider");
  }
  return context;
}
