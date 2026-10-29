# AGENTS.md - Traza Solana Traceability

## Project Structure
- `traza/` - Anchor Solana program (Rust)
- `web/` - Next.js frontend (React 19, Next.js 16)
- `test-ledger/` - Local validator data

## Dev Commands (3 terminals)

```bash
# Terminal 1: Local validator
solana-test-validator --ledger test-ledger

# Terminal 2: Build & deploy program
cd traza && anchor build && anchor deploy

# Terminal 3: Web app
cd web && npm run dev
```

## Key Workflows
- **After program changes**: `anchor build && anchor deploy` → copy IDL and types: `cp traza/target/idl/traza.json traza/target/types/traza.ts web/types/ && cp traza/target/idl/traza.json mcp-server/src/idl/`
- **Run tests**: `cd traza && anchor test --provider.cluster localnet --skip-local-validator` (validator running)
- **Get SOL**: `solana airdrop 10 <address>`

## Important Details
- Program ID: `f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX` (Anchor.toml:9)
- Rust toolchain: 1.89.0 (traza/rust-toolchain.toml)
- traza uses yarn; web uses npm
- Network: devnet by default (provider.cluster in Anchor.toml; web/lib/solana/constants.ts). Pass `--provider.cluster localnet` for local work

## Roles & Transitions
Producer → Factory → Retailer → Consumer (strict, no skipping)