# CaféChain — Anchor program

Blockchain traceability for coffee supply chains, built on Solana with Anchor. Records coffee lots from farm to consumer as immutable on-chain transfers, events and certifications.

**Program ID:** `f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX`
**Network:** Solana Devnet (also runs on localnet)

See the [root README](../README.md) for the full setup, including how to use your own program ID.

---

## Commands

```bash
# Build the Anchor program
anchor build

# Deploy to the cluster set in Anchor.toml (devnet), or override it
anchor deploy --provider.cluster localnet

# Run all tests against a running local validator
anchor test --provider.cluster localnet --skip-local-validator

# Load demo data on localnet (roles, tokens and transfers for the 4 actors)
yarn seed

# Check TypeScript/JavaScript formatting
yarn lint

# Fix formatting
yarn lint:fix
```

### Local environment

```bash
# Terminal 1 — start a local validator
solana-test-validator --reset

# Terminal 2
solana config set --url localhost
anchor build
anchor deploy --provider.cluster localnet
anchor test --provider.cluster localnet --skip-local-validator
```

---

## Architecture

### On-chain program (`programs/traza/src/`)

**`lib.rs`** — the program's 9 instruction handlers:

| Instruction | Who can call it | What it does |
|---|---|---|
| `initialize` | Authority | Sets up the initial ProgramConfig |
| `register_role` | Anyone | Requests a role (Producer/Factory/Retailer/Consumer) |
| `validate_role` | Authority | Approves a pending role request |
| `create_token` | Producer, Factory | Creates a coffee lot (TraceToken) |
| `initiate_transfer` | Token holder | Opens an escrow (PendingTransfer) |
| `accept_transfer` | Recipient | Closes the escrow and updates the balance |
| `add_trace_event` | Token holder | Adds a TraceEvent to the lot's history |
| `request_certificate` | Token holder | Requests a certificate for a token |
| `resolve_certificate` | Authority | Approves or rejects a certificate |

### Accounts (`state/`)

- `ProgramConfig` — authority pubkey + initialization flag
- `RoleRegistry` — validated role per wallet (PDA: `[b"role_registry", wallet]`)
- `PendingRoleRegistration` — pending role request
- `TraceToken` — coffee lot with metadata (origin, altitude, GPS coordinates, humidity/temperature, `source_tokens` for factory lineage)
- `TokenBalance` — balance per (mint, owner) pair
- `PendingTransfer` — escrow record (PDA: `[b"pending_transfer", mint, from, to]`)
- `TraceEvent` — timestamped event with EventType and metadata
- `Certificate` — certificate with CertType and CertStatus

### Design patterns

- **Deterministic PDAs** — every account uses a program-derived address with fixed seeds
- **Role hierarchy** — the only valid transfer flow is Producer→Factory→Retailer→Consumer
- **Escrow transfers** — `PendingTransfer` holds the amount until the recipient calls `accept_transfer`
- **Factory lineage** — factory tokens store `source_tokens` (pubkeys of the producer lots they came from)
- **Event timeline** — TraceEvents indexed per token (Harvest→Processing→Roasting→Packaging→QualityCheck→Transport→Storage)

### Tests (`tests/traza.ts`)

Mocha suite covering the full cycle: initialization, role management, token creation, transfers, events and certificates. Each run generates fresh keypairs and airdrops SOL to each actor.

### Seed script (`scripts/seed.ts`)

Loads the authority keypair from `~/.config/solana/id.json` and one keypair per actor from `../roles/wallet-*.json`, then builds a realistic scenario: 3 producer lots, 2 factory products with lineage, certificates and sample transfers. Run with `yarn seed`.

---

## Technologies

| Layer | Technology |
|---|---|
| Blockchain | Solana |
| Smart contract | Rust + Anchor 0.32.1 |
| Rust toolchain | 1.89.0 (via `rust-toolchain.toml`) |
| Frontend | Next.js + Tailwind CSS (`/web`) |
| Tests | Mocha + Chai (TypeScript) |
| Formatting | Prettier |
| Package manager | Yarn |
