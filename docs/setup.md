# Setup

## Tech Stack
- Next.js 16.1.6 (App Router)
- React 19.2.3
- Tailwind CSS v4 (with @theme inline)
- Three.js (vanilla, NOT React Three Fiber)
- lucide-react for icons
- Space Grotesk (display font, via next/font/google)
- Geist Sans + Geist Mono (via next/font/local or next/font/google)

## Dev Server
```bash
cd app/
npx next dev --webpack --port 3001
```
IMPORTANT: Always use `--webpack` flag (Turbopack breaks with dual lockfiles).

## Project Structure
```
token-lp/                  ← Anchor/Solana root (has its own yarn.lock)
├── app/                   ← Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── token/[id]/page.tsx  ← Token detail page
│   │   └── components/
│   │       ├── navbar.tsx
│   │       ├── hero.tsx
│   │       ├── bonding-curve-3d.tsx
│   │       ├── token-card.tsx
│   │       ├── sparkline.tsx
│   │       ├── footer.tsx
│   │       ├── token-chart.tsx      ← TradingView lightweight-charts
│   │       ├── trade-form.tsx       ← Buy/sell form with particles
│   │       ├── trade-history.tsx    ← Live trade history table
│   │       ├── ticker-price.tsx     ← Odometer price animation
│   │       ├── bonding-curve-mini.tsx ← SVG mini curve
│   │       └── button-particles.tsx ← Canvas particle burst hook
│   ├── package.json
│   └── yarn.lock          ← Second lockfile (causes Turbopack issue)
├── programs/              ← Solana programs (Anchor)
├── tests/
├── Anchor.toml
├── Cargo.toml
└── yarn.lock              ← Root lockfile
```

## Installed Packages (in app/)
- three, @types/three — for vanilla Three.js 3D rendering
- lightweight-charts (v5.1.0) — TradingView chart for token detail page
- lucide-react — icons
- @tailwindcss/postcss — Tailwind v4 PostCSS plugin
- next, react, react-dom — framework
- Space Grotesk — Google font imported in layout.tsx
