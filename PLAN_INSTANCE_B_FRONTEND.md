# Instance B — Frontend (Computer 2)
## Reputation Passport Protocol — Next.js App

**Your role:** Build the frontend: passport profile, live demo, verification widget.
**Stack:** Next.js + TypeScript + @solana/wallet-adapter
**Coordinate with Instance A at:** Hours 0, 8-10, 16, 20

---

## Step 0 — Shared Constants (get from Instance A FIRST)

Before writing any code, confirm these with Instance A:

```
Cluster:      devnet
PDA seeds:
  passport    = ["passport", worker_pubkey]
  work_record = ["work_record", worker_pubkey, record_id_bytes]
  platform    = ["platform", platform_pubkey]
Treasury pubkey: get from Instance A
Program ID: get from Instance A after their first deploy (~hour 16)
```

---

## Timeline

| Hours | Task |
|-------|------|
| 0–2 | `create-next-app`, install deps, wallet connect scaffold |
| 2–4 | Build mock data layer + full UI (no chain reads yet) |
| 4–8 | Passport profile page complete (reads mock data) |
| 8–12 | Wire up real IDL + chain reads when Instance A delivers |
| 12–16 | Demo screen — gig simulator + live score update |
| 16–20 | Verification widget (any wallet, no connect required) |
| 20–24 | Polish, end-to-end test with Instance A |

---

## Setup

```bash
npx create-next-app app --typescript
cd app
npm install \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-wallets \
  @solana/wallet-adapter-react-ui \
  @project-serum/anchor \
  @solana/web3.js
```

Create `.env.local`:
```
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<get from Instance A>
```

---

## File Structure

```
app/src/
  pages/
    _app.tsx               # WalletProvider wrapper
    index.tsx              # redirect → /passport/me
    passport/[wallet].tsx  # profile page (also serves as verify widget)
    demo.tsx               # live demo screen
  components/
    WalletProvider.tsx
    PassportCard.tsx       # score ring + stats block
    BadgeGrid.tsx          # row of soulbound badge icons
    CategoryBreakdown.tsx  # per-category avg rating bars
    DemoPanel.tsx          # gig simulator form
    LiveScoreUpdater.tsx   # polls passport after TX
  hooks/
    usePassport.ts         # fetch PassportAccount PDA
    useWorkRecords.ts      # getProgramAccounts filtered by worker
  lib/
    anchorClient.ts        # getProgram(connection, wallet)
    mockData.ts            # placeholder data for hours 0-8
  idl/
    reputation_passport.json  # COPY FROM INSTANCE A when ready
```

---

## Mock Data (use for hours 0–8, before IDL arrives)

```typescript
// src/lib/mockData.ts
export const MOCK_PASSPORT = {
  owner: "7xK3mNpQrSt2uVwXyZ1aB3cD4eF5gH6iJ7kL8mPq9",
  overall_score: 82,
  total_gigs: 42,
  dispute_count: 1,
  total_earned: 12500000000,   // lamports (~12.5 SOL)
  created_at: 1700000000,
  last_updated: Math.floor(Date.now() / 1000),
  badge_count: 3,
}

export const MOCK_RECORDS = [
  { category: "Tech",     rating: 5, disputed: false, platform: "Soleer",     amount_paid: 2000000000, timestamp: Date.now()/1000 - 86400 },
  { category: "Design",   rating: 4, disputed: false, platform: "Gibwork",    amount_paid: 1500000000, timestamp: Date.now()/1000 - 172800 },
  { category: "Language", rating: 5, disputed: false, platform: "Superteam",  amount_paid: 500000000,  timestamp: Date.now()/1000 - 259200 },
  { category: "Tech",     rating: 3, disputed: true,  platform: "Soleer",     amount_paid: 1000000000, timestamp: Date.now()/1000 - 345600 },
  // add ~6 more varied records
]

export const MOCK_BADGES = ["FirstGig", "TrustedWorker", "MultiPlatform"]
```

---

## Component Specs

### `WalletProvider.tsx`
Wrap `_app.tsx`. Support Phantom + Backpack:
```tsx
import { PhantomWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets'
// ConnectionProvider → WalletProvider → WalletModalProvider → {children}
```

### `PassportCard.tsx`
```
┌─────────────────────────────────────┐
│  wallet: 7xK3...mPq9                │
│  ████████████████░░  82 / 100       │
│                                     │
│  42 gigs  ·  2.4% disputes          │
│  3 platforms  ·  since Nov 2023     │
│  12.5 SOL earned                    │
└─────────────────────────────────────┘
```
- Score ring: SVG `<circle>` with `stroke-dashoffset` based on score
- All stats from `PassportAccount` fields

### `CategoryBreakdown.tsx`
- Group `WorkRecord[]` by category
- For each category: show name + avg rating as a filled bar (0-5 scale)
- Categories: Tech, Design, Language, Teaching, Other

### `BadgeGrid.tsx`
- Row of badge cards, each with icon + name
- Badge icons: use emoji or simple SVG for hackathon speed
  - FirstGig: 🎯, TrustedWorker: ⭐, MultiPlatform: 🌐, ZeroDisputes: 🔒, DomainExpert: 🏆, EarlyAdopter: 🚀
- Gray out badges not yet earned

### `DemoPanel.tsx`
Form fields:
- Worker wallet (auto-fill from connected wallet, readonly)
- Platform (dropdown: "Soleer Mock" | "Gibwork Mock" | "Superteam Mock")
- Category (dropdown: Tech | Design | Language | Teaching | Other)
- Amount in SOL (number input)
- Rating (1-5 star click UI)
- Disputed (checkbox)
- "Complete Gig" button → calls `emit_work_record` → shows TX link

### `LiveScoreUpdater.tsx`
After TX confirms:
- Poll `PassportAccount` PDA every 2 seconds for 30 seconds
- When score changes, animate the score ring
- Show "Score updated: 78 → 82" toast

---

## Hooks

### `usePassport.ts`
```typescript
// Derive PDA: ["passport", walletPubkey]
// Fetch with program.account.passportAccount.fetch(pda)
// Return: { passport, loading, error }
// Use mock data if program not initialized yet
```

### `useWorkRecords.ts`
```typescript
// program.account.workRecord.all([
//   { memcmp: { offset: 8, bytes: walletPubkey.toBase58() } }  // filter by worker
// ])
// Return sorted by timestamp descending
```

---

## Pages

### `passport/[wallet].tsx`
- If `wallet === "me"` → use connected wallet pubkey
- If `wallet` is an address → load readonly (no wallet connect needed)
- Layout: PassportCard on top, CategoryBreakdown below, BadgeGrid at bottom
- Show "Connect wallet" only if wallet==="me" and not connected

### `demo.tsx`
- Split layout: left = DemoPanel, right = live PassportCard + LiveScoreUpdater
- Pre-populate with Instance A's seeded demo wallet address
- Step-by-step instructions visible on page for judges

### `index.tsx`
```typescript
// redirect to /passport/me
import { useRouter } from 'next/router'
export default function Home() {
  const router = useRouter()
  useEffect(() => { router.push('/passport/me') }, [])
  return null
}
```

---

## Wiring Up Real Chain Data (Hour 8-12)

When Instance A sends you the IDL:
1. Copy `reputation_passport.json` → `src/idl/`
2. Update `anchorClient.ts`:
```typescript
import idl from '../idl/reputation_passport.json'
import { Program, AnchorProvider } from '@project-serum/anchor'

export function getProgram(connection, wallet) {
  const provider = new AnchorProvider(connection, wallet, {})
  return new Program(idl as any, process.env.NEXT_PUBLIC_PROGRAM_ID, provider)
}
```
3. Replace mock data in hooks with real `program.account.*` calls
4. Test on devnet with Instance A's seeded wallet address

---

## Verification Widget

The `/passport/[wallet]` page already works as a verification widget when given a specific wallet address. Add:
- An input field on the page (when no wallet address in URL) to paste a wallet address
- A "Copy embed code" button:
```typescript
const embedCode = `<iframe src="https://your-app.vercel.app/passport/${walletAddress}" width="400" height="300" />`
```
- Page works without wallet connected (all reads, no writes)

---

## Deliverable Checklist

- [ ] `npm run dev` starts without errors
- [ ] Wallet connect works with Phantom on devnet
- [ ] `/passport/me` shows seeded passport data from Instance A's wallet
- [ ] `/demo` — clicking "Complete Gig" sends TX, score updates live
- [ ] `/passport/[any_address]` — shows passport without wallet connected
- [ ] Embed code copy works
- [ ] No console errors on main flows
