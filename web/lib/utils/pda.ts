import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/solana/constants";

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function getRoleRegistryPDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("role_registry"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function getPendingRolePDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pending_role"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function getTraceTokenPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("trace_token"), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function getPendingTransferPDA(tokenMint: PublicKey, from?: PublicKey, to?: PublicKey): [PublicKey, number] {
  if (from && to) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("pending_transfer"), tokenMint.toBuffer(), from.toBuffer(), to.toBuffer()],
      PROGRAM_ID
    );
  }
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pending_transfer"), tokenMint.toBuffer()],
    PROGRAM_ID
  );
}

export function getTokenBalancePDA(tokenMint: PublicKey, owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("token_balance"), tokenMint.toBuffer(), owner.toBuffer()],
    PROGRAM_ID
  );
}

export function getTraceEventPDA(mint: PublicKey, index: number): [PublicKey, number] {
  const indexBuf = Buffer.alloc(4);
  indexBuf.writeUInt32LE(index);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("trace_event"), mint.toBuffer(), indexBuf],
    PROGRAM_ID
  );
}

// certType: 0=Sanitary, 1=Quality, 2=Organic
export function getCertificatePDA(mint: PublicKey, certType: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("certificate"), mint.toBuffer(), Buffer.from([certType])],
    PROGRAM_ID
  );
}
