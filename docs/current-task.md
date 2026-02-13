# Current Task — Wallet Connection + UI Polish (2026-02-12)

## What Was Done This Session

### 1. Solana Wallet Connection — Full Implementation
- Installed `@solana/web3.js@1`, `@solana/wallet-adapter-base`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-wallets` with `--legacy-peer-deps` (React 19 compatibility)
- Created `wallet-provider.tsx` — ConnectionProvider (devnet via `clusterApiUrl`) + WalletProvider (Phantom, Solflare adapters, `autoConnect={true}`)
- Modified `layout.tsx` — wraps `{children}` with `WalletProviderWrapper`. Direct import, NOT `next/dynamic` with `ssr: false` (Next.js 16 doesn't allow that in Server Components)
- Rewrote `navbar.tsx` completely:
  - `useWallet()` + `useConnection()` hooks for real wallet state
  - Balance fetching via `connection.getBalance(publicKey)` + `connection.onAccountChange()` live listener
  - **Disconnected state**: "Connect" button → opens wallet selector modal
  - **Wallet modal**: lists detected wallets (Phantom, Solflare) with installed/not-installed badges, backdrop blur, gold/dark styling, Escape to close
  - **Connected state**: shows `{balance} SOL` + truncated address → click opens dropdown
  - **Connected dropdown**: wallet icon + name, full address with copy button, "My Profile" link to `/profile/[publicKey]`, disconnect button
  - Keyboard: Escape closes modal/dropdown, outside click closes both
- No webpack polyfills needed (build passed clean)

### 2. Profile Referral Dashboard — Own Profile Detection
- Added `useWallet()` import to `/profile/[address]/page.tsx`
- `isOwnProfile = useWallet().publicKey?.toBase58() === address` detection
- Referrals tab always visible on own profile (even with 0 referrals)
- Enhanced `ReferralsTab` component with:
  - **Not registered state**: "Become a Referrer" button with explanation text
  - **Registered state**: Referral link with copy button (copies `window.location.origin/trade?ref=ADDRESS`)
  - 4th stat card: "Claimable Balance" with SOL amount
  - "Claim Fees" button with loading spinner + success checkmark animation
- "My Profile" link added to navbar connected dropdown

### 3. Unicorn Studio 3D Background (Token Grid Section)
- Replaced Spline iframe attempt (had white background issues) with Unicorn Studio embed
- `data-us-project="cqcLtDwfoHqqRPttBbQE"` — 3D particle/aura effect
- `data-us-disablemouse` attribute disables cursor interaction (CSS `pointer-events: none` wasn't enough — Unicorn Studio script adds window-level listeners)
- Gold tint via CSS filter: `sepia(1) saturate(2) hue-rotate(5deg) brightness(0.85)`
- Script loaded dynamically in useEffect (desktop only, not on mobile)
- `(window as any).UnicornStudio.init()` called after script loads
- Fixed: `hue-rotate(35deg)` made it green, reverted to `5deg`

### 4. Cross-Fade Transition (Hero → Token Section)
- Hero (Three.js bonding curve canvas) fades out with scroll:
  - `canvasFade = Math.max(0, 1 - Math.pow(scrollProgress / 0.6, 1.5))` — exponential ease-out
  - `canvasBlur = Math.pow(scrollProgress / 0.5, 2) * 20` — progressive blur up to 20px
  - `canvasScale = 1 + scrollProgress * 0.15` — subtle zoom as it fades
- Unicorn Studio fades in overlapping:
  - `opacity: Math.min(1, Math.max(0, (scrollProgress - 0.2) / 0.35))` — starts fading in at 20% scroll
  - Overlap zone at 20-60% scroll where both are partially visible

### 5. Project Directory Moved
- Frontend moved from `token-lp/app/` to `Launch/app/`
- `token-lp/app/src/` is now empty
- Backend stays in `token-lp/programs/token-lp/`
- Dev server now runs from `Launch/app/`
- Ran `npm install --legacy-peer-deps` in new location

## What's Next — Immediate

### Backend (in token-lp/)
1. Fix `migrate_to_raydium.rs` struct (token authority, fee_vault mut, wSOL accounts)
2. Write `migrate_to_raydium.rs` handler
3. Security audit fixes (checked_sub, input validation)
4. Events
5. Tests

### Frontend (in Launch/app/)
1. Clean up orphan files (`how-it-works.tsx`, `activity-ticker.tsx`)
2. Connect frontend to real program (once deployed to devnet)
3. Logo — still iterating on AI-generated prompts (simple upward chart arrow, gold on dark)

## Known Issues
- `events.rs` still empty (backend)
- No tests written yet (backend)
- Security audit items not yet fixed (backend)
- Orphan component files: `how-it-works.tsx`, `activity-ticker.tsx`
- Mock data everywhere in frontend (will be replaced with real program data)
