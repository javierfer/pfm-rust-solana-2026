import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Traza } from "@/types/traza";
import {
  getRoleRegistryPDA,
  getPendingRolePDA,
  getConfigPDA,
  getTraceTokenPDA,
  getPendingTransferPDA,
  getTokenBalancePDA,
  getTraceEventPDA,
  getCertificatePDA,
} from "@/lib/utils/pda";

type Role = Traza["types"][7]["type"]["variants"][number]["name"];

export async function registerRole(
  program: Program<Traza>,
  wallet: PublicKey,
  role: Role
): Promise<string> {
  const [pendingRolePDA] = getPendingRolePDA(wallet);
  const [roleRegistryPDA] = getRoleRegistryPDA(wallet);
  const roleVariant: any = {};
  roleVariant[role] = {};
  return program.methods
    .registerRole(roleVariant)
    .accounts({
      pendingRole: pendingRolePDA,
      roleRegistry: roleRegistryPDA,
      wallet,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function validateRole(
  program: Program<Traza>,
  authority: PublicKey,
  targetWallet: PublicKey
): Promise<string> {
  const [configPDA] = getConfigPDA();
  const [pendingRolePDA] = getPendingRolePDA(targetWallet);
  const [roleRegistryPDA] = getRoleRegistryPDA(targetWallet);
  return program.methods
    .validateRole()
    .accounts({
      programConfig: configPDA,
      pendingRole: pendingRolePDA,
      roleRegistry: roleRegistryPDA,
      authority,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function initializeProgram(
  program: Program<Traza>,
  authority: PublicKey
): Promise<string> {
  const [configPDA] = getConfigPDA();
  return program.methods
    .initialize()
    .accounts({
      programConfig: configPDA,
      authority,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export interface CreateTokenParams {
  amount: bigint;
  metadata: string;
  coffeeType: string;
  farmName: string;
  harvestDate: number;
  originCountry: string;
  altitudeMeters: number;
  temperature: number | null;
  humidity: number | null;
  latitude: number;
  longitude: number;
  sourceTokenMints?: PublicKey[];
}

export async function createToken(
  program: Program<Traza>,
  creator: PublicKey,
  mint: Keypair,
  params: CreateTokenParams
): Promise<string> {
  const [traceTokenPDA] = getTraceTokenPDA(mint.publicKey);
  const [creatorBalancePDA] = getTokenBalancePDA(mint.publicKey, creator);
  const [roleRegistryPDA] = getRoleRegistryPDA(creator);
  return program.methods
    .createToken(
      new BN(params.amount.toString()),
      params.metadata,
      params.coffeeType,
      params.farmName,
      new BN(params.harvestDate),
      params.originCountry,
      params.altitudeMeters,
      params.temperature,
      params.humidity,
      params.latitude,
      params.longitude
    )
    .accounts({
      traceToken: traceTokenPDA,
      creatorBalance: creatorBalancePDA,
      mint: mint.publicKey,
      roleRegistry: roleRegistryPDA,
      creator,
      systemProgram: SystemProgram.programId,
    } as any)
    .signers([mint])
    .remainingAccounts(
      (params.sourceTokenMints || []).map((mintPk) => ({
        pubkey: getTraceTokenPDA(mintPk)[0],
        isSigner: false,
        isWritable: false,
      }))
    )
    .rpc();
}

export async function initiateTransfer(
  program: Program<Traza>,
  from: PublicKey,
  to: PublicKey,
  tokenMint: PublicKey,
  amount: bigint
): Promise<string> {
  const [traceTokenPDA] = getTraceTokenPDA(tokenMint);
  const [fromBalancePDA] = getTokenBalancePDA(tokenMint, from);
  const [pendingTransferPDA] = getPendingTransferPDA(tokenMint, from, to);
  const [fromRoleRegistryPDA] = getRoleRegistryPDA(from);
  const [toRoleRegistryPDA] = getRoleRegistryPDA(to);
  return program.methods
    .initiateTransfer(new BN(amount.toString()))
    .accounts({
      traceToken: traceTokenPDA,
      fromBalance: fromBalancePDA,
      pendingTransfer: pendingTransferPDA,
      fromRoleRegistry: fromRoleRegistryPDA,
      to,
      toRoleRegistry: toRoleRegistryPDA,
      from,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function acceptTransfer(
  program: Program<Traza>,
  receiver: PublicKey,
  tokenMint: PublicKey,
  sender: PublicKey
): Promise<string> {
  const [traceTokenPDA] = getTraceTokenPDA(tokenMint);
  const [fromBalancePDA] = getTokenBalancePDA(tokenMint, sender);
  const [toBalancePDA] = getTokenBalancePDA(tokenMint, receiver);
  const [pendingTransferPDA] = getPendingTransferPDA(tokenMint, sender, receiver);
  const [roleRegistryPDA] = getRoleRegistryPDA(receiver);
  return program.methods
    .acceptTransfer()
    .accounts({
      traceToken: traceTokenPDA,
      pendingTransfer: pendingTransferPDA,
      fromBalance: fromBalancePDA,
      toBalance: toBalancePDA,
      roleRegistry: roleRegistryPDA,
      to: receiver,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

// eventType: 0=Harvest,1=Processing,2=Roasting,3=Packaging,4=QualityCheck,5=Transport,6=Storage
export async function addTraceEvent(
  program: Program<Traza>,
  recorder: PublicKey,
  tokenMint: PublicKey,
  index: number,
  eventType: number,
  description: string,
  temperature: number | null,
  humidity: number | null
): Promise<string> {
  const [traceTokenPDA] = getTraceTokenPDA(tokenMint);
  const [traceEventPDA] = getTraceEventPDA(tokenMint, index);
  const [recorderBalancePDA] = getTokenBalancePDA(tokenMint, recorder);
  const [roleRegistryPDA] = getRoleRegistryPDA(recorder);

  const eventTypeVariants = ["harvest", "processing", "roasting", "packaging", "qualityCheck", "transport", "storage"];
  const eventTypeVariant: any = {};
  eventTypeVariant[eventTypeVariants[eventType]] = {};

  return program.methods
    .addTraceEvent(eventTypeVariant, description, temperature, humidity, index)
    .accounts({
      traceToken: traceTokenPDA,
      recorderBalance: recorderBalancePDA,
      traceEvent: traceEventPDA,
      roleRegistry: roleRegistryPDA,
      recorder,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

// certType: 0=Sanitary, 1=Quality, 2=Organic
export async function requestCertificate(
  program: Program<Traza>,
  producer: PublicKey,
  tokenMint: PublicKey,
  certType: number,
  notes: string
): Promise<string> {
  const [traceTokenPDA] = getTraceTokenPDA(tokenMint);
  const [certificatePDA] = getCertificatePDA(tokenMint, certType);
  const [requesterBalancePDA] = getTokenBalancePDA(tokenMint, producer);
  const [roleRegistryPDA] = getRoleRegistryPDA(producer);
  const [configPDA] = getConfigPDA();

  const certTypeVariants = ["sanitary", "quality", "organic"];
  const certTypeVariant: any = {};
  certTypeVariant[certTypeVariants[certType]] = {};

  return program.methods
    .requestCertificate(certTypeVariant, notes)
    .accounts({
      traceToken: traceTokenPDA,
      requesterBalance: requesterBalancePDA,
      certificate: certificatePDA,
      roleRegistry: roleRegistryPDA,
      programConfig: configPDA,
      requester: producer,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function resolveCertificate(
  program: Program<Traza>,
  authority: PublicKey,
  tokenMint: PublicKey,
  certType: number,
  approved: boolean,
  notes: string
): Promise<string> {
  const [certificatePDA] = getCertificatePDA(tokenMint, certType);
  const [configPDA] = getConfigPDA();

  const certTypeVariants = ["sanitary", "quality", "organic"];
  const certTypeVariant: any = {};
  certTypeVariant[certTypeVariants[certType]] = {};

  return program.methods
    .resolveCertificate(certTypeVariant, approved, notes)
    .accounts({
      certificate: certificatePDA,
      programConfig: configPDA,
      authority,
    } as any)
    .rpc();
}
