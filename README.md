# wildhacks2026
## Reputation Passport Protocol — Technical Brief for Claude Code

---

### Project Overview

A neutral Solana reputation protocol. Gig platforms (Soleer, Gibwork, Superteam) write completed work records to it. Users own the resulting passport on their wallet. Anyone can read it.

**Problem:** Gig platform reputation is siloed and platform-owned. Platform dies → reputation dies.

**Solution:** A shared on-chain reputation ledger. Platforms emit WorkRecords on gig completion. Passport score is aggregated from all records across all platforms.

---

### Tech Stack

- **Smart contract:** Rust + Anchor
- **Frontend:** Next.js + TypeScript
- **Wallet:** @solana/wallet-adapter (Phantom, Backpack)
- **Chain reads:** Helius RPC
- **Soulbound tokens:** Metaplex Token Metadata (non-transferable)
- **Local dev:** Anchor localnet

---

### On-Chain Accounts

```rust
#[account]
pub struct PassportAccount {
    pub owner:         Pubkey,
    pub overall_score: u8,       // 0-100
    pub total_gigs:    u32,
    pub dispute_count: u32,
    pub total_earned:  u64,      // lamports lifetime
    pub created_at:    i64,
    pub last_updated:  i64,
    pub badge_count:   u8,
}

#[account]
pub struct WorkRecord {
    pub worker:      Pubkey,     // wallet that did the work
    pub platform:    Pubkey,     // platform that emitted this
    pub category:    WorkCategory, // enum: Tech, Design, Language, Teaching, Other
    pub amount_paid: u64,        // lamports
    pub rating:      u8,         // 1-5
    pub disputed:    bool,
    pub timestamp:   i64,
    pub record_id:   [u8; 32],   // platform's internal job id hash
}

#[account]
pub struct RegisteredPlatform {
    pub address: Pubkey,
    pub name:    String,
    pub stake:   u64,            // SOL staked to register
    pub active:  bool,
}
```

---

### Program Instructions

```
initialize_passport(wallet)
  → creates PassportAccount for wallet, called once per user

register_platform(platform_pubkey, name)
  → adds platform to registry, requires SOL stake

emit_work_record(worker, category, amount, rating, disputed, record_id)
  → called by platform program on gig completion
  → writes immutable WorkRecord
  → triggers recompute_score
  → routes payment through escrow:
      95% → worker wallet
       4% → platform wallet
       1% → protocol treasury

recompute_score(wallet)
  → reads all WorkRecords for wallet
  → recomputes overall_score using weighted formula
  → checks badge thresholds, mints if unlocked

mint_badge(wallet, badge_type)
  → issues soulbound (non-transferable) SPL token
```

---

### Scoring Formula

```python
score = (
    (avg_rating / 5.0)     * 35 +   # rating quality
    (1 - dispute_rate)     * 25 +   # dispute penalty
    volume_score           * 20 +   # min(total_gigs/100, 1.0)
    recency_score          * 10 +   # decay from last gig timestamp
    source_diversity_score * 10     # bonus for multi-platform records
)
```

---

### Soulbound Badges

```
"First Gig"       → 1 completed WorkRecord
"Trusted Worker"  → 50+ gigs, <5% dispute rate
"Multi-Platform"  → records from 3+ different platform pubkeys
"Zero Disputes"   → 20+ gigs, 0 disputes
"Domain Expert"   → 25+ gigs in same category
"Early Adopter"   → passport created in first 1000
```

---

### Frontend Screens

**1. Passport Profile Page**
- Connect wallet
- Display: overall score, total gigs, dispute rate, platforms count, member since
- Category breakdown scores (Tech, Design, Language, etc.)
- Soulbound badge display

**2. Live Demo Screen**
- Simulate a gig completing on a mock platform
- Emit WorkRecord to devnet
- Watch passport score update in real time

**3. Verification Widget**
- Input any wallet address
- Returns passport score card
- Embeddable by any platform

---

### Build Order

```
Phase 1 — Anchor program
  - PassportAccount + WorkRecord + RegisteredPlatform structs
  - initialize_passport instruction
  - emit_work_record instruction + fee split escrow
  - recompute_score logic
  - mint_badge (soulbound via Metaplex)

Phase 2 — Frontend
  - Wallet connect
  - Passport profile page (read PassportAccount)
  - Seed devnet with mock WorkRecords for demo

Phase 3 — Demo flow
  - Mock platform that calls emit_work_record
  - Live score update on frontend
  - Verification widget
```

---

### What to Mock (Not Build)

- Real Soleer/Gibwork integration → simulate with test transactions
- Web2 ZK proofs (GitHub, LinkedIn) → describe in UI, don't implement
- Platform governance/DAO → mention in pitch only

---

### Pitch Narrative

> A TaskRabbit cleaner with 300 five-star reviews switches platforms. She starts from zero. Her reputation — built over years — vanished the moment she left. This happens to millions of gig workers. The Reputation Passport fixes it. One wallet. All platforms. Permanently yours.

**Track:** Track 2 — Community (Present)
