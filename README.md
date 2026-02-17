# Token Launchpad — Solana/Anchor

A pump.fun-style token launchpad on Solana. Create tokens with automatic bonding curve pricing, trade them trustlessly, refer friends for fee sharing, and graduate to Raydium when the market cap threshold is reached.

## How It Works

### Token Lifecycle

1. **Create** — Anyone can launch a token. A bonding curve is initialized with virtual reserves, giving the token a price from block zero. No seed liquidity needed.
2. **Trade** — Buyers and sellers trade against the bonding curve (constant product `x * y = k`). Price rises as more SOL flows in.
3. **Graduate** — When real SOL reserves hit 85 SOL, the curve completes. The token is ready for migration.
4. **Migrate** — Admin migrates liquidity to a Raydium CPMM pool. 100% of LP tokens are burned — no rug pulls possible.

### Fee System

Every trade has a 1% fee, split three ways:

| Recipient | Share | Description |
|-----------|-------|-------------|
| Creator | 65% | The wallet that launched the token |
| Protocol | 25% | Accumulates in the fee vault, withdrawable by admin |
| Referrer | 10% | The referrer who brought the trader (if any) |

### Referral System

Anyone can register as a referrer — this creates an on-chain PDA linked to their wallet. When a trade includes a referral, 10% of the fee is routed to the referrer's PDA. Referrers can claim their accumulated fees at any time.

### Anti-Snipe

Token creators can use `create_and_buy` to atomically create a token and place the first buy in a single instruction. This prevents bots from front-running the creator's initial purchase.

### Migration Security

When a token graduates and migrates to Raydium, all LP tokens are burned on-chain. This means the liquidity is locked forever — nobody (not even the admin) can pull it. This is the same model pump.fun uses.

## Architecture

### On-chain Program (Anchor)

**Handmade.** Every instruction, every account struct, every line of bonding curve math — written from scratch.

10 instructions across 5 modules:

```
programs/token-lp/src/
├── lib.rs                    # Program entrypoint
├── constants.rs              # PDA seeds, defaults, fee config
├── errors.rs                 # Custom error codes
├── events.rs                 # TradeEvent, CreateEvent, CompleteEvent, MigrateEvent
├── state/
│   ├── global.rs             # Protocol config (fees, thresholds, status, authority)
│   ├── bonding_curve.rs      # Per-token curve state (reserves, supply, flags)
│   └── referral.rs           # Referral tracking (earned, trade count)
├── instructions/
│   ├── admin/                # initialize, update_config, withdraw_fees
│   ├── launch/               # create_token, create_and_buy_token
│   ├── trade/                # buy_token, sell_token
│   ├── migration/            # migrate_to_raydium (LP burn)
│   └── referral/             # register_referral, claim_referral_fees
└── utils/
    └── math.rs               # Checked arithmetic (constant product formula)
```

### Frontend

**UI by Claude Opus 4.6.** 3D WebGL bonding curve visualization (Three.js), scroll-driven cinematic transitions, and gold dust particle effects.

```
app/src/
├── app/
│   ├── layout.tsx               # Root layout (providers, fonts)
│   ├── page.tsx                 # Landing — hero + token grid
│   ├── globals.css              # Design system tokens
│   ├── create/                  # Token creation form
│   ├── token/[id]/              # Token detail — chart, trade, history
│   ├── leaderboard/             # Top tokens, traders, creators
│   ├── profile/[address]/       # User profile, stats, referral dashboard
│   └── api/                     # API routes
└── components/
    ├── wallet-provider.tsx      # Solana wallet connection (Phantom, Solflare)
    ├── referral-provider.tsx    # Referral context (detect, store, apply)
    ├── navbar.tsx               # Sticky nav + wallet dropdown
    ├── hero.tsx                 # Hero with parallax scroll
    ├── bonding-curve-3d.tsx     # Three.js 3D bonding curve
    ├── bonding-curve-mini.tsx   # Mini 3D curve for cards
    ├── token-card.tsx           # Token listing card
    ├── token-chart.tsx          # Price chart (lightweight-charts)
    ├── trade-form.tsx           # Buy/sell form
    ├── trade-history.tsx        # Recent trades list
    ├── sparkline.tsx            # Mini sparkline chart
    ├── ticker-price.tsx         # Live price ticker
    ├── register-referral-modal.tsx   # Register as referrer
    ├── incoming-referral-modal.tsx   # Accept referral link
    ├── celebration-modal.tsx    # Graduation celebration
    ├── toast.tsx                # Toast notifications
    ├── button-particles.tsx     # Gold particle effects
    └── footer.tsx               # Footer
```

### SDK (TypeScript)

**Handmade.** Client-side SDK for interacting with the program. Wraps all 10 instructions + account fetch methods + bonding curve math.

```
sdk/src/
├── client.ts                 # TokenLaunchpadClient class (all instructions + fetch)
├── math.ts                   # Client-side curve math (calculateBuyAmount, calculateSellAmount)
├── pda.ts                    # PDA derivation (global, bonding curve, fee vault, referral)
├── types.ts                  # TypeScript interfaces (Global, BondingCurve, Referral)
├── events.ts                 # Trade history parser (getTradeHistory from program logs)
├── constants.ts              # Program ID, seeds, defaults
└── index.ts                  # Barrel export
```

## Bonding Curve Model

Constant product with virtual reserves (`virtual_sol * virtual_token = k`).

- **Virtual reserves** give a non-zero starting price without seed liquidity
- **Graduation** at 85 SOL real reserves triggers migration to Raydium CPMM
- **1% trade fee** split: creator 65%, protocol 25%, referrer 10%
- **Freeze authority** revoked at token creation — nobody can freeze transfers
- **Metadata immutable** — token info cannot be changed after creation

## Stack

- **Program**: Anchor 0.32.1, Rust
- **Frontend**: Next.js, React 19, Tailwind CSS v4, Three.js (vanilla)
- **SDK**: TypeScript — handmade
- **Tests**: TypeScript (ts-mocha), 4 test suites (admin, launch, trade, referral)

## Status

Program deployed on devnet. SDK complete. Tests 01-04 passing (28/28). Frontend connected — referral system tested end-to-end. Migration test in backlog.
