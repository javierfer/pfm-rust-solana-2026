import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import { AnchorProvider, Program, BorshCoder } from "@coral-xyz/anchor";
import idl from "./idl/traza.json" with { type: "json" };

// ── Config ──────────────────────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey("f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX");
const RPC_ENDPOINT = process.env.SOLANA_RPC ?? "http://localhost:8899";

const connection = new Connection(RPC_ENDPOINT, "confirmed");
const coder = new BorshCoder(idl as any);

// ── Discriminator helpers ────────────────────────────────────────────────────
function discriminatorForAccount(name: string): Buffer {
  const account = (idl as any).accounts.find((a: any) => a.name === name);
  return Buffer.from(account.discriminator);
}

async function fetchProgramAccounts(accountName: string) {
  const disc = discriminatorForAccount(accountName);
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ memcmp: { offset: 0, bytes: disc.toString("base64"), encoding: "base64" } }],
  });
  return accounts.map(({ pubkey, account }) => ({
    pubkey: pubkey.toBase58(),
    data: coder.accounts.decode(accountName, account.data),
  }));
}

// ── Tool handlers ────────────────────────────────────────────────────────────

async function getBalance(address: string) {
  const pubkey = new PublicKey(address);
  const lamports = await connection.getBalance(pubkey);
  return {
    address,
    sol: lamports / LAMPORTS_PER_SOL,
    lamports,
  };
}

async function getProgramConfig() {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  const info = await connection.getAccountInfo(pda);
  if (!info) return { error: "Program not initialized" };
  const data = coder.accounts.decode("ProgramConfig", info.data);
  return {
    pda: pda.toBase58(),
    authority: data.authority.toBase58(),
    initialized: data.initialized,
  };
}

async function getRoleRegistry(wallet: string) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("role_registry"), new PublicKey(wallet).toBuffer()],
    PROGRAM_ID
  );
  const info = await connection.getAccountInfo(pda);
  if (!info) return { error: "No role registered for this wallet" };
  const data = coder.accounts.decode("RoleRegistry", info.data);
  return {
    wallet: data.wallet.toBase58(),
    role: formatEnum(data.role),
    validated_at: new Date(data.validated_at.toNumber() * 1000).toISOString(),
  };
}

async function listRoleRegistries() {
  const accounts = await fetchProgramAccounts("RoleRegistry");
  return accounts.map(({ pubkey, data }) => ({
    pda: pubkey,
    wallet: data.wallet.toBase58(),
    role: formatEnum(data.role),
    validated_at: new Date(data.validated_at.toNumber() * 1000).toISOString(),
  }));
}

async function listPendingRoles() {
  const accounts = await fetchProgramAccounts("PendingRoleRegistration");
  return accounts.map(({ pubkey, data }) => ({
    pda: pubkey,
    wallet: data.wallet.toBase58(),
    requested_role: formatEnum(data.requested_role),
    created_at: new Date(data.created_at.toNumber() * 1000).toISOString(),
  }));
}

async function listTraceTokens() {
  const accounts = await fetchProgramAccounts("TraceToken");
  return accounts.map(({ pubkey, data }) => formatTraceToken(pubkey, data));
}

async function getTraceToken(mintAddress: string) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trace_token"), new PublicKey(mintAddress).toBuffer()],
    PROGRAM_ID
  );
  const info = await connection.getAccountInfo(pda);
  if (!info) return { error: "TraceToken not found for mint: " + mintAddress };
  const data = coder.accounts.decode("TraceToken", info.data);
  return formatTraceToken(pda.toBase58(), data);
}

async function getTraceEvents(mintAddress: string) {
  const mint = new PublicKey(mintAddress);
  const disc = discriminatorForAccount("TraceEvent");
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { memcmp: { offset: 0, bytes: disc.toString("base64"), encoding: "base64" } },
      { memcmp: { offset: 8, bytes: mint.toBase58() } },
    ],
  });
  const events = accounts.map(({ pubkey, account }) => {
    const data = coder.accounts.decode("TraceEvent", account.data);
    return {
      pda: pubkey.toBase58(),
      index: data.index,
      event_type: formatEnum(data.event_type),
      description: data.description,
      timestamp: new Date(data.timestamp.toNumber() * 1000).toISOString(),
      recorder: data.recorder.toBase58(),
      temperature: data.temperature ?? null,
      humidity: data.humidity ?? null,
    };
  });
  return events.sort((a, b) => a.index - b.index);
}

async function getTokenBalance(mintAddress: string, walletAddress: string) {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("token_balance"),
      new PublicKey(mintAddress).toBuffer(),
      new PublicKey(walletAddress).toBuffer(),
    ],
    PROGRAM_ID
  );
  const info = await connection.getAccountInfo(pda);
  if (!info) return { balance: 0, message: "No balance account (never held this token)" };
  const data = coder.accounts.decode("TokenBalance", info.data);
  return {
    token_mint: data.token_mint.toBase58(),
    owner: data.owner.toBase58(),
    balance: data.balance.toNumber(),
    last_updated: new Date(data.last_updated.toNumber() * 1000).toISOString(),
  };
}

async function listCertificates(mintAddress?: string) {
  const disc = discriminatorForAccount("Certificate");
  const filters: any[] = [
    { memcmp: { offset: 0, bytes: disc.toString("base64"), encoding: "base64" } },
  ];
  if (mintAddress) {
    filters.push({ memcmp: { offset: 8, bytes: new PublicKey(mintAddress).toBase58() } });
  }
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });
  return accounts.map(({ pubkey, account }) => {
    const data = coder.accounts.decode("Certificate", account.data);
    return {
      pda: pubkey.toBase58(),
      token_mint: data.token_mint.toBase58(),
      cert_type: formatEnum(data.cert_type),
      status: formatEnum(data.status),
      requester: data.requester.toBase58(),
      requested_at: new Date(data.requested_at.toNumber() * 1000).toISOString(),
      resolved_at: data.resolved_at
        ? new Date(data.resolved_at.toNumber() * 1000).toISOString()
        : null,
      notes: data.notes,
    };
  });
}

async function listPendingTransfers() {
  const accounts = await fetchProgramAccounts("PendingTransfer");
  return accounts.map(({ pubkey, data }) => ({
    pda: pubkey,
    token_mint: data.token_mint.toBase58(),
    from: data.from.toBase58(),
    to: data.to.toBase58(),
    amount: data.amount.toNumber(),
    initiated_at: new Date(data.initiated_at.toNumber() * 1000).toISOString(),
  }));
}

// ── Format helpers ───────────────────────────────────────────────────────────

function formatEnum(value: any): string {
  if (!value || typeof value !== "object") return String(value);
  return Object.keys(value)[0] ?? String(value);
}

function formatTraceToken(pubkey: string, data: any) {
  return {
    pda: pubkey,
    mint: data.mint.toBase58(),
    creator: data.creator.toBase58(),
    creator_role: formatEnum(data.creator_role),
    total_supply: data.total_supply.toNumber(),
    status: formatEnum(data.status),
    coffee_type: data.coffee_type,
    farm_name: data.farm_name,
    harvest_date: new Date(data.harvest_date.toNumber() * 1000).toISOString(),
    origin_country: data.origin_country,
    altitude_meters: data.altitude_meters,
    temperature: data.temperature ?? null,
    humidity: data.humidity ?? null,
    latitude: data.latitude,
    longitude: data.longitude,
    event_count: data.event_count,
    oracle_verified: data.oracle_verified,
    metadata: data.metadata,
    source_tokens: data.source_tokens.map((pk: any) => pk.toBase58()),
    created_at: new Date(data.created_at.toNumber() * 1000).toISOString(),
  };
}

// ── MCP server setup ─────────────────────────────────────────────────────────

const server = new Server(
  { name: "traza-solana-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_balance",
      description: "Get the SOL balance for a wallet address",
      inputSchema: {
        type: "object",
        properties: {
          address: { type: "string", description: "Solana wallet address (base58)" },
        },
        required: ["address"],
      },
    },
    {
      name: "get_program_config",
      description: "Get the Traza program configuration (authority, initialization status)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_role_registry",
      description: "Get the validated role for a specific wallet",
      inputSchema: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet address to look up" },
        },
        required: ["wallet"],
      },
    },
    {
      name: "list_roles",
      description: "List all wallets with validated roles (Producer, Factory, Retailer, Consumer)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_pending_roles",
      description: "List wallets with pending role registration requests awaiting authority approval",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_trace_tokens",
      description: "List all coffee batch tokens registered on-chain with their full metadata",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_trace_token",
      description: "Get a specific coffee batch token by its mint address",
      inputSchema: {
        type: "object",
        properties: {
          mint: { type: "string", description: "Mint address of the trace token" },
        },
        required: ["mint"],
      },
    },
    {
      name: "get_trace_events",
      description: "Get the traceability event history for a coffee batch (harvest, processing, roasting, transport, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          mint: { type: "string", description: "Mint address of the trace token" },
        },
        required: ["mint"],
      },
    },
    {
      name: "get_token_balance",
      description: "Get how many units of a token a specific wallet holds",
      inputSchema: {
        type: "object",
        properties: {
          mint: { type: "string", description: "Mint address of the trace token" },
          wallet: { type: "string", description: "Wallet address" },
        },
        required: ["mint", "wallet"],
      },
    },
    {
      name: "list_certificates",
      description: "List quality/sanitary/organic certificates, optionally filtered by token mint",
      inputSchema: {
        type: "object",
        properties: {
          mint: { type: "string", description: "Optional: filter by token mint address" },
        },
      },
    },
    {
      name: "list_pending_transfers",
      description: "List all pending token transfers awaiting acceptance",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "get_balance":
        result = await getBalance((args as any).address);
        break;
      case "get_program_config":
        result = await getProgramConfig();
        break;
      case "get_role_registry":
        result = await getRoleRegistry((args as any).wallet);
        break;
      case "list_roles":
        result = await listRoleRegistries();
        break;
      case "list_pending_roles":
        result = await listPendingRoles();
        break;
      case "list_trace_tokens":
        result = await listTraceTokens();
        break;
      case "get_trace_token":
        result = await getTraceToken((args as any).mint);
        break;
      case "get_trace_events":
        result = await getTraceEvents((args as any).mint);
        break;
      case "get_token_balance":
        result = await getTokenBalance((args as any).mint, (args as any).wallet);
        break;
      case "list_certificates":
        result = await listCertificates((args as any)?.mint);
        break;
      case "list_pending_transfers":
        result = await listPendingTransfers();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Traza MCP server running — RPC: ${RPC_ENDPOINT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
