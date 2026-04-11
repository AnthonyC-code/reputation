# Instance B — Frontend (Computer 2)
## Reputation Passport Protocol — Next.js App

**Your role:** Build the frontend: passport profile, live demo, verification widget.
**Stack:** Next.js + TypeScript + @solana/wallet-adapter
**Communication with Instance A:** Git only. Pull at defined checkpoints to pick up artifacts.

---

## Git Handoff Protocol

All coordination happens through git. You never talk to Instance A directly.

**You wait for and consume (via `git pull`):**
- `shared/constants.json` — PDA seeds + cluster (available ~Hour 1, pull before starting chain reads)
- `shared/idl/reputation_passport.json` — Anchor IDL (available ~Hour 16, pull to wire real chain reads)
- `shared/program_id.txt` — deployed program ID (available ~Hour 16)
- `shared/demo_wallet.txt` — seeded demo wallet address (available ~Hour 22)

**Scheduled pull points:** Hour 2, Hour 10, Hour 17, Hour 22. Do not block on these — keep building with mocks if artifacts aren't there yet.

---

## Step 0 — Pull Shared Constants (Hour 2)

Run `git pull`. If `shared/constants.json` exists, use it. If not, use these defaults (Instance A agreed on them):

```json
{
  "cluster": "devnet",
  "pda_seeds": {
    "passport":    ["passport", "<worker_pubkey>"],
    "work_record": ["work_record", "<worker_pubkey>", "<record_id_bytes>"],
    "platform":    ["platform", "<platform_pubkey>"]
  }
}
```

Program ID won't arrive until ~Hour 16. Build with mock data until then.

---

## Timeline

| Hours | Task | Git action |
|-------|------|------------|
| 0–2 | `create-next-app`, install deps, wallet connect scaffold | — |
| 2 | `git pull` — pick up `shared/constants.json` if available | **PULL** |
| 2–4 | Build mock data layer + full UI shell (no chain reads) | — |
| 4–8 | Passport profile page complete reading from mock data | — |
| 8–10 | Verification widget, embed code — all UI complete | — |
| 10 | `git pull` — check for early IDL drop | **PULL** |
| 10–16 | Demo screen UI (DemoPanel + LiveScoreUpdater) with mocks | — |
| 17 | `git pull` — pick up IDL + program ID from Instance A | **PULL** |
| 17–20 | Wire real chain reads (replace mocks with Anchor calls) | — |
| 20–22 | Wire DemoPanel to `emit_work_record` on devnet | — |
| 22 | `git pull` — pick up demo wallet address | **PULL** |
| 22–24 | End-to-end test with seeded demo wallet, polish | — |

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
NEXT_PUBLIC_PROGRAM_ID=PLACEHOLDER
```

Update `NEXT_PUBLIC_PROGRAM_ID` when `shared/program_id.txt` lands after Hour 16.

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
    mockData.ts            # placeholder data until IDL arrives
    constants.ts           # loaded from shared/constants.json at build time
  idl/
    reputation_passport.json  # COPY FROM shared/idl/ after git pull at Hour 17
shared/                    # read-only for Instance B — written by Instance A
```

---

## Mock Data (use Hours 0–17, before IDL arrives)

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

// Placeholder — replace with value from shared/program_id.txt after Hour 16 pull
export const PLACEHOLDER_DEMO_WALLET = "7xK3mNpQrSt2uVwXyZ1aB3cD4eF5gH6iJ7kL8mPq9"
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
// Fall back to MOCK_PASSPORT if program not initialized yet
```

### `useWorkRecords.ts`
```typescript
// program.account.workRecord.all([
//   { memcmp: { offset: 8, bytes: walletPubkey.toBase58() } }  // filter by worker
// ])
// Return sorted by timestamp descending
// Fall back to MOCK_RECORDS if program not initialized yet
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
- Pre-populate demo wallet from `shared/demo_wallet.txt` (read at Hour 22 pull); fall back to placeholder until then
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

## Wiring Up Real Chain Data (Hour 17, after git pull)

When `shared/idl/reputation_passport.json` and `shared/program_id.txt` land:

1. Copy `shared/idl/reputation_passport.json` → `app/src/idl/`
2. Read program ID from `shared/program_id.txt`, set `NEXT_PUBLIC_PROGRAM_ID` in `.env.local`
3. Update `anchorClient.ts`:
```typescript
import idl from '../idl/reputation_passport.json'
import { Program, AnchorProvider } from '@project-serum/anchor'

export function getProgram(connection, wallet) {
  const provider = new AnchorProvider(connection, wallet, {})
  return new Program(idl as any, process.env.NEXT_PUBLIC_PROGRAM_ID, provider)
}
```
4. Replace mock fallbacks in hooks with real `program.account.*` calls
5. Test on devnet

---

## If IDL is Late (still missing at Hour 17)

Keep mocks running. Wire chain reads in Hour 20–22 instead. The UI is complete and functional with mocks — judges can still see the product. Prioritize the live demo wiring over polish.

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
- [ ] `/passport/me` shows seeded passport data (from `shared/demo_wallet.txt` after Hour 22 pull)
- [ ] `/demo` — clicking "Complete Gig" sends TX, score updates live
- [ ] `/passport/[any_address]` — shows passport without wallet connected
- [ ] Embed code copy works
- [ ] No console errors on main flows
