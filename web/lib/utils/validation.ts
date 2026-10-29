import { PublicKey } from "@solana/web3.js";

/**
 * Validate transfer path based on role transition
 */
export function isValidTransferPath(fromRole: string, toRole: string): boolean {
  const validPaths: Record<string, string[]> = {
    producer: ["factory"],
    factory: ["retailer"],
    retailer: ["consumer"],
    consumer: [],
  };

  if (!validPaths[fromRole]) {
    return false;
  }

  return validPaths[fromRole].includes(toRole);
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse anchor program error
 */
export function parseAnchorError(error: any): string {
  if (error.code) {
    const errorMap: Record<number, string> = {
      6000: "Only the program authority can validate roles",
      6001: "User already has a validated role",
      6002: "Invalid role registry account",
      6003: "User already has a pending role registration",
      6004: "Invalid role: only Producer or Factory can create tokens",
      6005: "Factory must provide at least one source token from a Producer",
      6006: "Source token must be created by a Producer",
      6007: "Amount must be greater than zero",
      6008: "Transfer amount exceeds token amount",
      6009: "Invalid transfer: only Producer->Factory, Factory->Retailer, Retailer->Consumer allowed",
      6010: "Token is already in transfer",
      6011: "Token is not in transfer status",
      6012: "Only full amount transfer supported",
      6013: "Metadata exceeds maximum length",
    };
    return errorMap[error.code] || `Error code: ${error.code}`;
  }

  if (error.message) {
    return error.message;
  }

  return "Unknown error occurred";
}
