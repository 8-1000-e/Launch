# Current Task — Referral System Frontend Overhaul (2026-02-17)

## What Was Done This Session (Frontend Agent)

### 1. Referral Provider (`src/components/referral-provider.tsx`)
- Global React context wrapping the entire app (inside WalletProvider > Suspense)
- **URL persistence**: reads `?ref=WALLET` from URL → saves to `localStorage("referral")`
- **On-chain check**: when wallet connects, calls `getReferral()` (read-only, no tx popup) to check if already registered
- **Modal orchestration**: manages 3 modals in sequence:
  1. `IncomingReferralModal` — shown when `?ref=` detected and user hasn't accepted/declined yet
  2. `RegisterReferralModal` — shown when wallet connected but not registered (explanation before tx)
  3. `CelebrationModal` — shown after successful on-chain registration
- **Exposed hook**: `useReferral()` returns `{ referrer: string | null, isRegistered: boolean }`
- **localStorage keys**: `referral`, `ref_registered_<wallet>`, `ref_celebrated_<wallet>`, `ref_dismissed_<wallet>`, `ref_accepted`

### 2. Register Referral Modal (`src/components/register-referral-modal.tsx`)
- Premium design per boss specs from DISCUSSION.md
- Hero: "10%" at 88px + "%" at 36px with gold gradient, "of every fee" mono text
- Headline: "Every trade they make, **you earn SOL.**"
- Punch line: "Your friends trade with their money. **You get paid for it.**"
- Social proof bar: "127 people earned SOL this week · Top: 4.2 SOL" (pulsing green dot)
- Collapsible "How it works" vertical stepper: Register → Share → Earn (connected dots/lines)
- CTA: "Become a Referrer" with animated gradient + pulse-glow
- "Later" dismiss button
- Multiple design iterations (5+) based on user feedback

### 3. Incoming Referral Modal (`src/components/incoming-referral-modal.tsx`)
- Shown when visiting with `?ref=WALLET_ADDRESS`
- Header: "REFERRAL DETECTED" mono + "You've been invited to earn"
- Big "10%" hero number with gold gradient
- Referrer address card with full address + truncated display
- Details: "No extra cost" + "Change anytime" with icons
- Existing referral warning if replacing a different referrer
- Actions: "No thanks" / "Accept referral" / "Remove all referrals"
- Gold line draw animation at top

### 4. Celebration Modal (`src/components/celebration-modal.tsx`)
- Gold-only confetti: 50 particles in 5 gold shades (#c9a84c, #dbb85e, #8a7034, #e8d08c, #a8873a)
- "You're in. Start sharing." headline
- Referral link display with copy button
- 3 share buttons: Copy link / Share on X / Telegram
- "Done" gold CTA

### 5. Trade Form Updates (`src/components/trade-form.tsx`)
- Removed `useSearchParams("ref")`, replaced with `useReferral()` hook
- "Referral active" green indicator: shown when `referralParam` exists (green dot + truncated address)
- "Share & earn 10%" section: only shown when `isRegistered` is true
- Copy link uses user's own `publicKey` for the referral URL

### 6. Provider Wiring (`src/components/wallet-provider.tsx`)
- Hierarchy: `ConnectionProvider > WalletProvider > Suspense > ReferralProvider > ToastProvider > {children}`

### 7. Hydration Fix (`src/components/navbar.tsx`)
- Added `mounted` state to prevent SSR/client mismatch when wallet auto-connects
- Server renders connect button, client might render profile link → mismatch fixed

### 8. CSS (`src/app/globals.css`)
- Added 15+ keyframes for modal animations
- Fixed crash: `@keyframes grad-flash` had `r: 6/20/40` (SVG-only property) → Tailwind 4 rejected entire stylesheet
- Replaced with `transform: scale()` equivalents

## Bugs Fixed
1. **Auto-register spamming Phantom tx popups**: fixed by checking `getReferral()` (read-only) before `registerReferral()`
2. **Hydration mismatch in navbar**: fixed with `mounted` state pattern
3. **Share section showing for non-referrers**: gated by `isRegistered` from context
4. **Referral lost on navigation**: persisted to localStorage via ReferralProvider
5. **Tailwind 4 stylesheet crash**: SVG `r:` property in @keyframes killed entire CSS → replaced with `transform: scale()`
6. **Stale .next cache**: ENOENT on `_global-error/page.js.nft.json` → `rm -rf .next`

## Immediate Next Steps
- Boss may want further design iteration on modals
- Modal social proof data (127 people, 4.2 SOL) is currently hardcoded — could be dynamic
- Clean up orphan files: `how-it-works.tsx`, `activity-ticker.tsx`
