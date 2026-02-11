# Token Launchpad — CLAUDE.md

## Context Recovery

IMPORTANT: At session start, read all .md files in the /docs/ directory to restore full project context from the previous session.

## Current State

- **Branch**: main
- **Status**: Token detail page complete with 5 wow effects, landing page polished (footer, scroll CTA, floating button)
- **Last updated**: 2026-02-11
- **Dev server**: `npx next dev --webpack --port 3001` (MUST use --webpack flag, Turbopack hangs with dual lockfiles)

## Approach

**PEDAGOGICAL MODE** — Emile writes the program code himself, the backend mentor agent guides and reviews. The mentor does NOT write program code unless explicitly asked. Errors/events are added as needed (not pre-planned).

## Task Progress — Backend (Anchor Program)

### Phase 1: Foundation
- [x] Project architecture (all directories and files created)
- [x] `constants.rs` — PDA seeds, bonding curve defaults, fees, graduation
- [x] `state/global.rs` — Global config struct with InitSpace + ProgramStatus enum
- [x] `state/bonding_curve.rs` — BondingCurve struct with InitSpace
- [x] `state/referral.rs` — Referral struct with InitSpace (commented)
- [x] `state/mod.rs` — module exports
- [x] `instructions/admin/initialize.rs` — handler + Initialize accounts struct
- [x] All `mod.rs` files wired (instructions/, admin/, launch/, trade/, migration/, referral/, utils/)
- [x] `lib.rs` updated — declares all modules, exposes initialize instruction
- [ ] `instructions/admin/update_config.rs` ← NEXT
- [ ] `instructions/admin/withdraw_fees.rs`
- [ ] `errors.rs` (add errors as needed per instruction)
- [ ] `events.rs` (add events as needed per instruction)
- [ ] `utils/math.rs`
- [ ] Cargo.toml dependencies (anchor-spl, mpl-token-metadata)
- [ ] `anchor build` — first compilation test
- [ ] `01_admin.test.ts`

### Phase 2: Token Launch
- [ ] `create_token.rs` (mint + metadata + bonding curve init)
- [ ] `create_and_buy.rs`
- [ ] `02_launch.test.ts`

### Phase 3: Trading
- [ ] `buy.rs` (bonding curve math + fee split)
- [ ] `sell.rs`
- [ ] Graduation detection
- [ ] `03_trade.test.ts`

### Phase 4: Referrals
- [ ] `register_referral.rs`
- [ ] Integration into buy/sell
- [ ] `04_referral.test.ts`

### Phase 5: Migration
- [ ] `migrate_to_raydium.rs`
- [ ] `05_migration.test.ts`

### Phase 6: SDK
- [ ] `sdk/src/client.ts`, `math.ts`, `pda.ts`, `types.ts`, `constants.ts`

## Task Progress — Frontend

- [x] Landing page V10+ (hero with 3D bonding curve, token grid, scroll transitions)
- [x] Landing page polish: footer, scroll indicator in hero, floating CTA button
- [x] Token detail / trade page (`/token/[id]`) — full 2-column layout with 5 wow effects
- [ ] Create token page (`/create`) ← NEXT
- [ ] Clean up orphan files: `how-it-works.tsx`, `activity-ticker.tsx` (created then removed from page)

## Key Decisions — Backend

- **Anchor 0.32.1**: Kept the version from `anchor init` (plan said 0.30.1 but 0.32.1 is fine)
- **InitSpace over size_of**: Emile prefers `#[derive(InitSpace)]` + `Global::INIT_SPACE` — more reliable than `std::mem::size_of`
- **Errors added as-needed**: Not pre-defined. Add to `errors.rs` when writing each instruction.
- **Handler pattern**: Each instruction has its own file with `pub fn handler(ctx) -> Result<()>` + `#[derive(Accounts)]` struct. `lib.rs` delegates to handlers.
- **Program ID**: `HY3g1uQL2Zki1aFVJvJYZnMjZNveuMJhU22f9BucN3X`

## Key Decisions — Frontend

- **Vanilla Three.js over R3F**: @react-three/fiber v9 incompatible with React 19 + Next.js 16
- **--webpack flag**: Turbopack infinite-loops with dual lockfiles
- **Design system**: warm gold (#c9a84c) brand, dark theme (#0c0a09), Space Grotesk display, Geist Sans/Mono
- **No UI libraries**: Pure Tailwind CSS v4 only
- **3-layer parallax scroll**: bg orbs 0.3x, 3D curve 0.5x, HTML content 1x
- **lightweight-charts v5**: TradingView chart for token detail page. v5 API uses `chart.addSeries(AreaSeries, {...})` (NOT `chart.seriesType()`)
- **Next.js 16 dynamic params**: `params` is a `Promise<{id: string}>` — must unwrap with `use()` from React
- **Token detail wow effects**: odometer price ticker, trade pulse overlay, mini SVG bonding curve, graduation heat particles + border glow, button particle burst

## Pentagon Pod

- Pod ID: 3C9AC32C-7212-40A6-A862-ECE7904ACA9C
- Backend Mentor: Agent 6E9A0C3D (guides Emile, reviews code, coordinates frontend agent)
- Frontend Designer: Agent 0B779A7E (builds UI, takes orders via DISCUSSION.md)
- Communication: Pod DISCUSSION.md

## Critical File Paths

### Backend (programs/token-lp/src/)
- `lib.rs:12-19` — #[program] module with initialize
- `constants.rs` — all PDA seeds + defaults
- `state/global.rs` — Global struct + ProgramStatus enum
- `state/bonding_curve.rs` — BondingCurve struct
- `state/referral.rs` — Referral struct (commented)
- `instructions/admin/initialize.rs` — handler + Initialize accounts

### Frontend (app/src/)
- `components/bonding-curve-3d.tsx` (~988 lines) — vanilla Three.js 3D chart
- `components/hero.tsx` (~290 lines) — scroll-linked transitions + scroll indicator
- `app/page.tsx` (~400 lines) — home page with token grid, floating CTA, footer
- `app/token/[id]/page.tsx` (~480 lines) — token detail page with live price sim, trade pulse, graduation heat
- `components/token-chart.tsx` — TradingView lightweight-charts v5 area chart with timeframes
- `components/trade-form.tsx` — buy/sell form with particle burst
- `components/trade-history.tsx` — live simulated trade history table
- `components/ticker-price.tsx` — odometer-style digit rolling price animation
- `components/bonding-curve-mini.tsx` — SVG mini bonding curve with pulsing dot
- `components/button-particles.tsx` — canvas particle burst hook
- `components/footer.tsx` — 4-column footer with Solana badge
