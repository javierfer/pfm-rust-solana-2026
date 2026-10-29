# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CaféChain** — a Solana blockchain traceability system for coffee supply chains. Built as a TFM (Master's Thesis). Tracks coffee batches from farm to consumer via immutable on-chain records of transfers, events, and certifications.

**Program ID:** `f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX`
**Deployed on:** Solana Devnet (also runnable on localnet)

---

## Commands

```bash
# Build the Anchor program
anchor build

# Deploy to configured cluster
anchor deploy

# Run all tests (uses ts-mocha with 1M ms timeout)
yarn test
# or directly:
NODE_NO_WARNINGS=1 yarn run ts-mocha -p ./tsconfig.json -t 1000000 "tests/**/*.ts"

# Seed demo data (creates roles, tokens, transfers for all 4 actors)
yarn seed

# Lint TypeScript/JavaScript
yarn lint

# Auto-fix lint issues
yarn lint:fix
```

### Local development setup

```bash
# Terminal 1 — run local validator
solana-test-validator --reset

# Terminal 2
solana config set --url localhost
anchor build
anchor deploy
yarn test
```

To target Devnet, update `cluster` in `Anchor.toml` to `devnet` and ensure the wallet has enough SOL.

---

## Architecture

### Smart Contract (`programs/traza/src/`)

**`lib.rs`** — all 9 instruction handlers in one file:

| Instruction | Who can call | What it does |
|---|---|---|
| `initialize` | Authority | Sets up ProgramConfig |
| `register_role` | Anyone | Requests a role (Producer/Factory/Retailer/Consumer) |
| `validate_role` | Authority | Approves a pending role request |
| `create_token` | Producer, Factory | Creates a coffee batch TraceToken |
| `initiate_transfer` | Token holder | Opens escrow (PendingTransfer) |
| `accept_transfer` | Recipient | Closes escrow, updates TokenBalance |
| `add_trace_event` | Token holder | Appends a TraceEvent to a batch |
| `request_certificate` | Authority | Requests a Certificate for a token |
| `resolve_certificate` | Authority | Approves or rejects a Certificate |

**`state/`** — one file per account type:
- `ProgramConfig` — authority pubkey + initialized flag
- `RoleRegistry` — validated role per wallet (PDA: `[b"role_registry", wallet]`)
- `PendingRoleRegistration` — pending role request
- `TraceToken` — coffee batch with metadata (origin, altitude, GPS coords, humidity/temp, source_tokens for factory lineage)
- `TokenBalance` — balance per (mint, owner) pair
- `PendingTransfer` — escrow record (PDA: `[b"pending_transfer", mint, from, to]`)
- `TraceEvent` — timestamped event with EventType and metadata
- `Certificate` — cert request with CertType and CertStatus

**`error.rs`** — all custom error codes.

### Key design patterns

- **PDA derivation** — all accounts are PDAs with deterministic seeds
- **Role hierarchy** — valid transfer path is strictly Producer→Factory→Retailer→Consumer
- **Escrow transfers** — PendingTransfer holds amount until recipient calls `accept_transfer`
- **Factory lineage** — Factory tokens record `source_tokens` (producer batch pubkeys)
- **Event timeline** — TraceEvents are indexed per token (Harvest→Processing→Roasting→Packaging→QualityCheck→Transport→Storage)

### Tests (`tests/traza.ts`)

Single Mocha test file covering the full lifecycle: initialization, role management, token creation, transfers, events, and certificates. Each test run generates fresh keypairs and airdrops 1 SOL to each actor.

### Scripts (`scripts/seed.ts`)

Loads or creates keypairs from `~/.config/solana/` for each actor (producer, factory, retailer, consumer), then seeds a realistic supply chain scenario: 3 producer batches, 2 factory products with lineage, and sample transfers. Run with `yarn seed`.

---

## Rust toolchain

Pinned to `1.89.0` via `rust-toolchain.toml`. Components: `rustfmt`, `clippy`.

## TypeScript

`tsconfig.json` targets ES6/CommonJS. Types: `mocha`, `chai`. All scripts use `ts-node`.
