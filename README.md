# Pulse AI

AI-guided, wallet-native risk management protocol for Solana.

Pulse AI combines:

- real-time portfolio and token risk analysis in the frontend,
- a Rust/Anchor on-chain protocol for trustless commitments and policy state,
- a migration path from app-first to protocol-first architecture.

---

## Why Pulse AI

Most trading assistants give generic suggestions. Pulse AI is designed to produce **wallet-specific** risk decisions:

- a wallet with `1 SOL` should not receive the same allocation advice as one with `0.001 SOL`,
- risk profile and policy constraints should be persisted and auditable,
- advice outputs should be commit-able on-chain for integrity and traceability.

---

## Current State

### Frontend

- React + Vite app
- Solana wallet adapter integration
- Dashboard, token discovery, AI insights, swap flow, positions

### On-Chain Protocol

- Rust/Anchor program scaffolded and deployed to devnet
- Program ID: `8CxcCkx2KxpYGQLice4r6LdjNjqsXB7eB5E8ZQMG89ig`

Implemented account domains:

- `UserRiskProfile`
- `RiskPolicy`
- `AdviceCommitment`
- `PositionIntent`

Implemented instruction flows in app:

- initialize/update user risk profile
- record advice commitment
- record position intent

### Important Devnet Note

On devnet, swap currently runs in **simulation + intent-recording mode**:

- it records on-chain `PositionIntent`,
- estimates quotes using price data,
- does **not** settle real token balances via a live devnet DEX execution path.

For real token settlement, use a production swap route (mainnet Jupiter path).

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind
- **Wallet:** `@solana/wallet-adapter-*`
- **Solana:** `@solana/web3.js`
- **Anchor TS client:** `@coral-xyz/anchor`
- **On-chain:** Rust, Anchor
- **Data/AI (current app layer):** Supabase + external AI provider integration

---

## Project Structure

```text
programs/pulse_ai_protocol/     # Anchor program (Rust)
src/components/                 # UI components
src/hooks/                      # App + protocol hooks
src/lib/                        # protocol helpers, client, schema
src/lib/idl/                    # static IDL used by frontend
tests/                          # protocol integration tests (JS/node test)
Anchor.toml                     # Anchor workspace config
Cargo.toml                      # Rust workspace config
MIGRATION_PROGRESS_LOG.md       # ongoing migration/handoff log
```

---

## Environment Variables

Create `.env` with at least:

```bash
VITE_GROQ_API_KEY=...
VITE_PROGRAM_ID=8CxcCkx2KxpYGQLice4r6LdjNjqsXB7eB5E8ZQMG89ig
VITE_HELIUS_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_CLUSTER=devnet
```

---

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Run frontend

```bash
npm run dev
```

### 3) Build check

```bash
npm run build
```

### 4) Run protocol integration tests

```bash
npm run test:protocol
```

---

## On-Chain Build and Deploy

Current reliable build path:

```bash
cargo build-sbf --manifest-path programs/pulse_ai_protocol/Cargo.toml --sbf-out-dir target/deploy
```

Deploy:

```bash
solana program deploy target/deploy/pulse_ai_protocol.so --program-id target/deploy/pulse_ai_protocol-keypair.json
```

Inspect deployed program:

```bash
solana program show 8CxcCkx2KxpYGQLice4r6LdjNjqsXB7eB5E8ZQMG89ig
```

---

## Product Modes

### Devnet (current default)

- wallet-native protocol testing
- on-chain profile/commitment/intent recording
- simulated swap balances from recorded intents

### Mainnet (target execution mode)

- real Jupiter route execution
- real token settlement in wallet
- production policy enforcement and observability

---

## Roadmap

### Near-term

- admin flow to initialize/update `RiskPolicy`
- richer explorer links and transaction telemetry in UI
- consolidated simulated holdings/positions UX polish
- e2e wallet tests (devnet)

### Mainnet Preparation

- finalize swap execution path for production
- security hardening and review of protocol constraints
- finalize deterministic commitment schema contract
- upgrade authority and operational policy decisions
- monitoring + alerting for protocol transaction failures

### Mainnet Deployment

- final integration and regression testing
- deploy protocol with audited configuration
- migrate app defaults from devnet simulation to mainnet execution

---

## Disclaimer

Pulse AI is experimental software. Trading and smart contract interaction involve financial and technical risk. Validate all transactions and test thoroughly before production use.
