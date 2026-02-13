# Setup

## Tech Stack
- Next.js 16.1.6 (App Router)
- React 19.2.3
- Tailwind CSS v4 (with @theme inline)
- Three.js (vanilla, NOT React Three Fiber)
- lightweight-charts v5.1.0 (TradingView chart)
- @solana/wallet-adapter-react (wallet connection logic)
- @solana/wallet-adapter-wallets (Phantom + Solflare adapters)
- @solana/web3.js v1 (NOT v2 — wallet adapter requires v1)
- lucide-react for icons
- Space Grotesk (display font, via next/font/google)
- Geist Sans + Geist Mono (via next/font/local or next/font/google)
- Unicorn Studio (external script, 3D background effect)

## Dev Server
```bash
cd /Users/emile/Documents/learn/Dev Journey/Launch/app/
npx next dev --webpack --port 3001
```
IMPORTANT: Always use `--webpack` flag (Turbopack breaks with dual lockfiles).

## Project Structure
```
Launch/                    ← Frontend project root
├── app/                   ← Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx          ← WalletProviderWrapper wraps children
│   │   │   ├── page.tsx            ← Home page + Unicorn Studio bg
│   │   │   ├── create/page.tsx     ← Token creation form
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── profile/[address]/page.tsx  ← Profile + referral dashboard
│   │   │   └── token/[id]/page.tsx ← Token detail + trade
│   │   └── components/
│   │       ├── wallet-provider.tsx  ← Solana wallet context (Phantom, Solflare, devnet)
│   │       ├── navbar.tsx           ← Wallet modal + connected dropdown + balance
│   │       ├── hero.tsx             ← 3D bonding curve hero with scroll fade
│   │       ├── bonding-curve-3d.tsx ← Vanilla Three.js 3D chart
│   │       ├── token-card.tsx
│   │       ├── sparkline.tsx
│   │       ├── footer.tsx
│   │       ├── token-chart.tsx      ← TradingView lightweight-charts
│   │       ├── trade-form.tsx       ← Buy/sell form with particles
│   │       ├── trade-history.tsx
│   │       ├── ticker-price.tsx     ← Odometer price animation
│   │       ├── bonding-curve-mini.tsx ← SVG mini curve
│   │       └── button-particles.tsx ← Canvas particle burst hook
│   ├── package.json
│   └── yarn.lock
├── docs/                  ← Session persistence docs
│   ├── current-task.md
│   ├── decisions.md       ← Append-only decision log
│   ├── debugging-notes.md
│   └── setup.md           ← This file
└── CLAUDE.md              ← Auto-read at session start

token-lp/                  ← Anchor/Solana backend (SEPARATE directory)
├── programs/token-lp/src/ ← Solana program source
├── tests/
├── Anchor.toml
├── Cargo.toml
└── yarn.lock
```

## Installed Packages (in Launch/app/)
- three, @types/three — for vanilla Three.js 3D rendering
- lightweight-charts (v5.1.0) — TradingView chart for token detail page
- @solana/web3.js@1 — Solana web3 (v1, NOT v2)
- @solana/wallet-adapter-base — base types for wallet adapters
- @solana/wallet-adapter-react — React context + hooks (useWallet, useConnection)
- @solana/wallet-adapter-wallets — Phantom + Solflare adapter implementations
- lucide-react — icons
- @tailwindcss/postcss — Tailwind v4 PostCSS plugin
- next, react, react-dom — framework

## Package Install Notes
- Always use `--legacy-peer-deps` when installing wallet adapter packages (they declare React ^17/^18 peer deps but work fine with React 19)
- `@solana/web3.js` must be v1 (pinned with `@1`) — v2 has a completely different API and wallet adapter isn't compatible yet
- No webpack polyfills needed for wallet adapter (Buffer, crypto, etc. — Next.js 16 handles it)
