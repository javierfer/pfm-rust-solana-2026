/**
 * Seed script — loads demo data into the CaféChain program (localnet).
 *
 * What it does:
 *   1. Loads the authority keypair from ~/.config/solana/id.json and the
 *      Producer, Factory, Retailer and Consumer keypairs from
 *      roles/wallet-{producer,factory,retailer,consumer}.json
 *   2. Funds each wallet with SOL (airdrop)
 *   3. Initializes the program if it is not initialized yet
 *   4. Registers and validates the 4 roles
 *   5. Creates 3 Producer lots with realistic harvest events
 *   6. Creates 2 Factory products (with source tokens) and their events
 *   7. Transfers a product Factory→Retailer→Consumer
 *
 * Usage:
 *   cd traza
 *   yarn seed
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Traza } from "../target/types/traza";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const IDL = require("../target/idl/traza.json");

const PROGRAM_ID = new PublicKey("f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX");
const SOLANA_DIR = path.join(os.homedir(), ".config", "solana");
const ROLES_DIR = path.resolve(__dirname, "../../roles");

// ─── PDA helpers ─────────────────────────────────────────────────────────────

const cfgPda = () =>
  PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0];

const roleRegPda = (w: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("role_registry"), w.toBuffer()], PROGRAM_ID)[0];

const pendRolePda = (w: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("pending_role"), w.toBuffer()], PROGRAM_ID)[0];

const tracePda = (mint: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("trace_token"), mint.toBuffer()], PROGRAM_ID)[0];

const balPda = (mint: PublicKey, owner: PublicKey) =>
  PublicKey.findProgramAddressSync([Buffer.from("token_balance"), mint.toBuffer(), owner.toBuffer()], PROGRAM_ID)[0];

const eventPda = (mint: PublicKey, idx: number) => {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(idx);
  return PublicKey.findProgramAddressSync([Buffer.from("trace_event"), mint.toBuffer(), buf], PROGRAM_ID)[0];
};

const pendTransferPda = (mint: PublicKey, from: PublicKey, to: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("pending_transfer"), mint.toBuffer(), from.toBuffer(), to.toBuffer()],
    PROGRAM_ID
  )[0];

// certType: 0=Sanitary, 1=Quality, 2=Organic
const certPda = (mint: PublicKey, certType: number) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("certificate"), mint.toBuffer(), Buffer.from([certType])],
    PROGRAM_ID
  )[0];

// ─── Utilities ───────────────────────────────────────────────────────────────

function loadRoleKeypair(roleName: string): Keypair {
  const fp = path.join(ROLES_DIR, `wallet-${roleName}.json`);
  if (!fs.existsSync(fp)) throw new Error(`Keypair not found: ${fp}`);
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(fp, "utf-8"))));
}

async function fund(conn: Connection, pubkey: PublicKey) {
  const bal = await conn.getBalance(pubkey);
  if (bal < 1e9) {
    const sig = await conn.requestAirdrop(pubkey, 2e9);
    const lb = await conn.getLatestBlockhash();
    await conn.confirmTransaction({ signature: sig, ...lb });
  }
}

function makeProgram(conn: Connection, kp: Keypair): Program<Traza> {
  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(kp), {
    commitment: "confirmed",
    skipPreflight: true,
    preflightCommitment: "confirmed",
  });
  return new anchor.Program(IDL, provider) as Program<Traza>;
}

// ─── Domain helpers ──────────────────────────────────────────────────────────

async function createToken(
  prog: Program<Traza>,
  creator: Keypair,
  params: {
    name: string; coffeeType: string; farmName: string;
    country: string; altitude: number; harvestTs: number;
    temp: number | null; hum: number | null; supply: number;
    lat?: number; lon?: number;
    sourceMints?: Keypair[];
  }
): Promise<Keypair> {
  const mint = Keypair.generate();
  const call = prog.methods.createToken(
    new anchor.BN(params.supply),
    params.name,
    params.coffeeType,
    params.farmName,
    new anchor.BN(params.harvestTs),
    params.country,
    params.altitude,
    params.temp,
    params.hum,
    params.lat ?? 0,
    params.lon ?? 0
  );

  if (params.sourceMints?.length) {
    call.remainingAccounts(
      params.sourceMints.map(sm => ({ pubkey: tracePda(sm.publicKey), isSigner: false, isWritable: false }))
    );
  }

  await call.accounts({
    traceToken: tracePda(mint.publicKey),
    creatorBalance: balPda(mint.publicKey, creator.publicKey),
    mint: mint.publicKey,
    roleRegistry: roleRegPda(creator.publicKey),
    creator: creator.publicKey,
    systemProgram: SystemProgram.programId,
  } as any).signers([creator, mint]).rpc();

  return mint;
}

async function addEvent(
  prog: Program<Traza>,
  mint: Keypair,
  recorder: Keypair,
  eventArg: any,
  description: string,
  temp: number | null,
  hum: number | null
) {
  const token = await prog.account.traceToken.fetch(tracePda(mint.publicKey));
  const idx = token.eventCount as number;
  await prog.methods.addTraceEvent(eventArg, description, temp, hum, idx)
    .accounts({
      traceToken: tracePda(mint.publicKey),
      recorderBalance: balPda(mint.publicKey, recorder.publicKey),
      traceEvent: eventPda(mint.publicKey, idx),
      roleRegistry: roleRegPda(recorder.publicKey),
      recorder: recorder.publicKey,
      systemProgram: SystemProgram.programId,
    } as any).signers([recorder]).rpc();
}

async function requestCert(
  requesterProg: Program<Traza>,
  authProg: Program<Traza>,
  mint: Keypair,
  requester: Keypair,
  authKp: Keypair,
  certTypeArg: any,
  certTypeIdx: number,
  requestNotes: string,
  approve: boolean,
  resolveNotes: string
) {
  const cfg = cfgPda();
  await requesterProg.methods.requestCertificate(certTypeArg, requestNotes)
    .accounts({
      traceToken: tracePda(mint.publicKey),
      requesterBalance: balPda(mint.publicKey, requester.publicKey),
      certificate: certPda(mint.publicKey, certTypeIdx),
      roleRegistry: roleRegPda(requester.publicKey),
      programConfig: cfg,
      requester: requester.publicKey,
      systemProgram: SystemProgram.programId,
    } as any).signers([requester]).rpc();

  await authProg.methods.resolveCertificate(certTypeArg, approve, resolveNotes)
    .accounts({
      certificate: certPda(mint.publicKey, certTypeIdx),
      programConfig: cfg,
      authority: authKp.publicKey,
    } as any).rpc();
}

async function transfer(
  fromProg: Program<Traza>,
  toProg: Program<Traza>,
  mint: Keypair,
  from: Keypair,
  to: Keypair,
  amount: number
) {
  await fromProg.methods.initiateTransfer(new anchor.BN(amount))
    .accounts({
      traceToken: tracePda(mint.publicKey),
      fromBalance: balPda(mint.publicKey, from.publicKey),
      pendingTransfer: pendTransferPda(mint.publicKey, from.publicKey, to.publicKey),
      fromRoleRegistry: roleRegPda(from.publicKey),
      to: to.publicKey,
      toRoleRegistry: roleRegPda(to.publicKey),
      from: from.publicKey,
      systemProgram: SystemProgram.programId,
    } as any).signers([from]).rpc();

  await toProg.methods.acceptTransfer()
    .accounts({
      traceToken: tracePda(mint.publicKey),
      pendingTransfer: pendTransferPda(mint.publicKey, from.publicKey, to.publicKey),
      fromBalance: balPda(mint.publicKey, from.publicKey),
      toBalance: balPda(mint.publicKey, to.publicKey),
      roleRegistry: roleRegPda(to.publicKey),
      to: to.publicKey,
      systemProgram: SystemProgram.programId,
    } as any).signers([to]).rpc();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const conn = new Connection("http://127.0.0.1:8899", {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 120_000,
  });

  // Keypairs
  console.log("\n🔑 Keypairs");
  const authRaw = JSON.parse(fs.readFileSync(path.join(SOLANA_DIR, "id.json"), "utf-8"));
  const authKp   = Keypair.fromSecretKey(Uint8Array.from(authRaw));
  const prodKp   = loadRoleKeypair("producer");
  const factKp   = loadRoleKeypair("factory");
  const retailKp = loadRoleKeypair("retailer");
  const consKp   = loadRoleKeypair("consumer");

  console.log(`  Authority : ${authKp.publicKey.toBase58()}`);
  console.log(`  Producer  : ${prodKp.publicKey.toBase58()}`);
  console.log(`  Factory   : ${factKp.publicKey.toBase58()}`);
  console.log(`  Retailer  : ${retailKp.publicKey.toBase58()}`);
  console.log(`  Consumer  : ${consKp.publicKey.toBase58()}`);

  // Programs per role
  const authProg   = makeProgram(conn, authKp);
  const prodProg   = makeProgram(conn, prodKp);
  const factProg   = makeProgram(conn, factKp);
  const retailProg = makeProgram(conn, retailKp);
  const consProg   = makeProgram(conn, consKp);

  // Fund all wallets
  console.log("\n💰 Funding");
  for (const [label, kp] of [["Producer", prodKp], ["Factory", factKp], ["Retailer", retailKp], ["Consumer", consKp]] as const) {
    await fund(conn, kp.publicKey);
    console.log(`  ${label} OK`);
  }

  // Initialize
  console.log("\n🚀 Initialize program");
  const cfg = cfgPda();
  if (!(await conn.getAccountInfo(cfg))) {
    await authProg.methods.initialize()
      .accounts({ programConfig: cfg, authority: authKp.publicKey, systemProgram: SystemProgram.programId } as any)
      .rpc();
    console.log("  Initialized");
  } else {
    console.log("  Already initialized, skip");
  }

  // Register + validate roles
  console.log("\n👥 Roles");
  for (const [label, kp, roleArg] of [
    ["Producer", prodKp,   { producer: {} }],
    ["Factory",  factKp,   { factory:  {} }],
    ["Retailer", retailKp, { retailer: {} }],
    ["Consumer", consKp,   { consumer: {} }],
  ] as const) {
    if (await conn.getAccountInfo(roleRegPda(kp.publicKey))) {
      console.log(`  ${label}: already validated, skip`);
      continue;
    }
    const progForRole = makeProgram(conn, kp);
    if (!(await conn.getAccountInfo(pendRolePda(kp.publicKey)))) {
      await progForRole.methods.registerRole(roleArg as any)
        .accounts({
          pendingRole: pendRolePda(kp.publicKey),
          roleRegistry: roleRegPda(kp.publicKey),
          wallet: kp.publicKey,
          systemProgram: SystemProgram.programId,
        } as any).signers([kp]).rpc();
    }
    await authProg.methods.validateRole()
      .accounts({
        programConfig: cfg,
        pendingRole: pendRolePda(kp.publicKey),
        roleRegistry: roleRegPda(kp.publicKey),
        authority: authKp.publicKey,
        systemProgram: SystemProgram.programId,
      } as any).rpc();
    console.log(`  ${label}: OK`);
  }

  // ── Producer: 3 lots ───────────────────────────────────────────────────────
  console.log("\n🌱 Producer lots");

  console.log("  [1/3] Geisha Special Reserve 2025...");
  const lot1 = await createToken(prodProg, prodKp, {
    name: "Geisha Special Reserve 2025", coffeeType: "Geisha",
    farmName: "El Paraíso Farm", country: "Colombia",
    altitude: 1950, harvestTs: 1741996800, // 2025-03-15
    temp: 20, hum: 72, supply: 300, lat: 1.8747, lon: -76.0523,
  });
  await addEvent(prodProg, lot1, prodKp, { harvest: {} },
    "Selective hand-picking, cherries at peak ripeness. Yield 94%", 20, 72);
  await addEvent(prodProg, lot1, prodKp, { qualityCheck: {} },
    "Sorted by size and density. 8% discarded for minor defects. Bean moisture 11.5%", 19, null);
  await addEvent(prodProg, lot1, prodKp, { storage: {} },
    "Stored in jute sacks in a ventilated warehouse. Controlled temperature and humidity", 18, 60);
  console.log("    ✓ 3 events");

  console.log("  [2/3] Arabica Natural Huila...");
  const lot2 = await createToken(prodProg, prodKp, {
    name: "Arabica Natural Huila", coffeeType: "Arabica",
    farmName: "La Esperanza Farm", country: "Colombia",
    altitude: 1750, harvestTs: 1740096000, // 2025-02-21
    temp: 22, hum: 68, supply: 500, lat: 2.5359, lon: -75.5277,
  });
  await addEvent(prodProg, lot2, prodKp, { harvest: {} },
    "Hand harvest complete. Arabica variety at optimal ripeness. 500 kg processed", 22, 68);
  await addEvent(prodProg, lot2, prodKp, { qualityCheck: {} },
    "Bean moisture check: 11.2%. No primary defects. Approved for roasting", null, null);
  await addEvent(prodProg, lot2, prodKp, { transport: {} },
    "Shipped to the roastery in a climate-controlled vehicle. Held at 15°C. Time: 6h", 15, null);
  console.log("    ✓ 3 events");

  console.log("  [3/3] Yellow Bourbon Honduras...");
  const lot3 = await createToken(prodProg, prodKp, {
    name: "Yellow Bourbon Honduras", coffeeType: "Yellow Bourbon",
    farmName: "Santa Rosa Farm", country: "Honduras",
    altitude: 1600, harvestTs: 1735689600, // 2025-01-01
    temp: 24, hum: 75, supply: 400, lat: 14.0723, lon: -87.2062,
  });
  await addEvent(prodProg, lot3, prodKp, { harvest: {} },
    "Machine-assisted harvest, yellow cherries at perfect ripeness. BRIX: 22°", 24, 75);
  await addEvent(prodProg, lot3, prodKp, { processing: {} },
    "Wet processing: pulping, 48h fermentation in clean water, washing and sorting", 26, 80);
  await addEvent(prodProg, lot3, prodKp, { qualityCheck: {} },
    "Preliminary cupping: SCA score 84.5. Notes: yellow fruit, cane honey, soft vanilla", 20, null);
  console.log("    ✓ 3 events");

  // ── Factory: 2 products ────────────────────────────────────────────────────
  console.log("\n🏭 Factory products");

  console.log("  [1/2] Intense Dark Roast 250g (source: Arabica Huila)...");
  const prod1 = await createToken(factProg, factKp, {
    name: "Intense Dark Roast 250g", coffeeType: "Dark Roast",
    farmName: "CaféChain Craft Roastery", country: "Spain",
    altitude: 0, harvestTs: 0, temp: null, hum: null, supply: 500,
    sourceMints: [lot2],
  });
  await addEvent(factProg, prod1, factKp, { processing: {} },
    "Dried on African beds for 21 days. Daily moisture checks down to 11%. Turned every 4h", 25, 55);
  await addEvent(factProg, prod1, factKp, { roasting: {} },
    "Dark roast profile: 222°C, 21% development time. Fast crack. Forced drum cooling", 222, null);
  await addEvent(factProg, prod1, factKp, { qualityCheck: {} },
    "SCA cupping: 86 points. Notes: dark chocolate, roasted nuts, bitter caramel. Low acidity", 20, null);
  await addEvent(factProg, prod1, factKp, { packaging: {} },
    "Packed 48h after roasting in a kraft bag with degassing valve. Net weight 250g", 20, 40);
  console.log("    ✓ 4 events");

  console.log("  [2/2] Single Origin Geisha Espresso (source: Geisha Reserve)...");
  const prod2 = await createToken(factProg, factKp, {
    name: "Single Origin Geisha Espresso", coffeeType: "Single Origin",
    farmName: "CaféChain Craft Roastery", country: "Spain",
    altitude: 0, harvestTs: 0, temp: null, hum: null, supply: 200,
    sourceMints: [lot1],
  });
  await addEvent(factProg, prod2, factKp, { processing: {} },
    "Natural honey process. Dried on raised beds for 25 days with controlled daily turning", 28, 50);
  await addEvent(factProg, prod2, factKp, { roasting: {} },
    "Light roast at 190°C, gentle 12-min curve. Profile designed to keep floral aromas", 190, null);
  await addEvent(factProg, prod2, factKp, { qualityCheck: {} },
    "SCA cupping: 91 points. Specialty grade. Notes: jasmine, peach, bergamot, black tea", 20, null);
  await addEvent(factProg, prod2, factKp, { packaging: {} },
    "Biodegradable bag with one-way valve. Coarse grind for classic espresso. 200g", 19, 38);
  console.log("    ✓ 4 events");

  // ── Certificates ──────────────────────────────────────────────────────────
  console.log("\n🏆 Certificates");

  // lot1 (Geisha): all 3 certificates approved
  console.log("  lot1 Geisha → Health + Quality + Organic...");
  await requestCert(prodProg, authProg, lot1, prodKp, authKp,
    { sanitary: {} }, 0,
    "Negative microbiological and residue analysis. ISO 17025 accredited laboratory.",
    true, "Health certificate granted. No pesticide or heavy-metal residues.");
  await requestCert(prodProg, authProg, lot1, prodKp, authKp,
    { quality: {} }, 1,
    "SCA score 90+ in blind cupping. Specialty grade verified by a certified Q-Grader.",
    true, "Exceptional quality confirmed. SCA 91 points. Qualifies as Specialty.");
  await requestCert(prodProg, authProg, lot1, prodKp, authKp,
    { organic: {} }, 2,
    "Farm free of synthetic pesticides since 2019. Biodynamic soil management.",
    true, "Organic certification granted. Complies with EU 2018/848 and USDA NOP.");
  console.log("    ✓ 3 certificates approved");

  // lot2 (Arabica Huila): quality only
  console.log("  lot2 Arabica → Quality only...");
  await requestCert(prodProg, authProg, lot2, prodKp, authKp,
    { quality: {} }, 1,
    "Lot assessed by an in-house cupping panel. Consistent, clean cup profile.",
    true, "Quality certificate approved. Cup profile fit for premium export.");
  console.log("    ✓ 1 certificate approved");

  // lot3 (Yellow Bourbon): no certificates
  console.log("  lot3 Yellow Bourbon → no certificates (skip)");

  // prod1 (Dark Roast): quality certificate
  console.log("  prod1 Dark Roast → Quality...");
  await requestCert(factProg, authProg, prod1, factKp, authKp,
    { quality: {} }, 1,
    "Product cupped by a Q-Grader. Consistent roast profile, no defects.",
    true, "Finished-product quality certificate granted. Cupping score: 86 SCA.");
  console.log("    ✓ 1 certificate approved");

  // prod2 (Single Origin Geisha): quality certificate
  console.log("  prod2 Single Origin Geisha → Quality...");
  await requestCert(factProg, authProg, prod2, factKp, authKp,
    { quality: {} }, 1,
    "Specialty Geisha scoring 91 SCA. Honey process certified by an independent cupper.",
    true, "Quality certificate granted. Specialty grade confirmed. Fit for the premium market.");
  console.log("    ✓ 1 certificate approved");

  // ── Chain Factory → Retailer → Consumer ───────────────────────────────────
  console.log("\n🔄 Transferring Dark Roast: Factory → Retailer");
  await transfer(factProg, retailProg, prod1, factKp, retailKp, 250);
  await addEvent(retailProg, prod1, retailKp, { storage: {} },
    "Received at the central warehouse. Seal and label check. Temperature held at 16°C", 16, 55);
  await addEvent(retailProg, prod1, retailKp, { qualityCheck: {} },
    "Visual inspection of the whole lot. No packaging damage. Expiry date checked", null, null);
  console.log("  ✓ Retailer received 250 units + 2 events recorded");

  console.log("\n🔄 Transferring 1 unit: Retailer → Consumer");
  await transfer(retailProg, consProg, prod1, retailKp, consKp, 1);
  console.log("  ✓ Consumer received 1 unit (can verify full traceability)");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                  SEED COMPLETE ✅                        ║
╠══════════════════════════════════════════════════════════╣
║  Producer  │ 3 lots · lot1: 3 certs · lot2: 1 cert      ║
║  Factory   │ 2 products · 1 quality cert each           ║
║  Retailer  │ 249 units Dark Roast + 2 events            ║
║  Consumer  │ 1 unit with full traceability              ║
╠══════════════════════════════════════════════════════════╣
║  Keypairs read from roles/                              ║
║    wallet-producer.json  │  wallet-factory.json         ║
║    wallet-retailer.json  │  wallet-consumer.json        ║
╚══════════════════════════════════════════════════════════╝
`);
}

main().catch(e => {
  console.error("\n❌ Error en seed:", e?.message ?? e);
  process.exit(1);
});
