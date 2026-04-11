# Instance A — Smart Contract (Computer 1)
## Reputation Passport Protocol — Anchor Program

**Your role:** Build and deploy the Solana smart contract.
**Stack:** Rust + Anchor
**Communication with Instance B:** Git only. Push to `main` at defined checkpoints. Instance B pulls when ready.

---

## Git Handoff Protocol

All coordination happens through commits to the shared repo. You never talk to Instance B directly.

**You own and commit:**
- `shared/constants.json` — PDA seeds, cluster, treasury pubkey (commit at Hour 1)
- `shared/program_id.txt` — program ID after first deploy (commit after Hour 16 deploy)
- `shared/idl/reputation_passport.json` — IDL after deploy (commit after Hour 16 deploy)
- `shared/demo_wallet.txt` — seeded demo wallet address (commit at Hour 22)

Instance B will `git pull` to pick these up. Do not assume they pull immediately.

---

## Step 0 — Commit Shared Constants First (Hour 1)

Before writing contract logic, create and push `shared/constants.json`:

```json
{
  "cluster": "devnet",
  "pda_seeds": {
    "passport":    ["passport", "<worker_pubkey>"],
    "work_record": ["work_record", "<worker_pubkey>", "<record_id_bytes>"],
    "platform":    ["platform", "<platform_pubkey>"]
  },
  "treasury_pubkey": "<generate a keypair, put pubkey here>"
}
```

Push immediately. Instance B cannot start wiring chain reads until they have this.

---

## Timeline

| Hours | Task | Git action |
|-------|------|------------|
| 0–1 | `anchor init reputation-passport`, define structs + errors | — |
| 1 | Generate treasury keypair, write `shared/constants.json` | **PUSH** |
| 1–4 | `initialize_passport`, `register_platform` instructions | — |
| 4–8 | `emit_work_record` + fee split escrow | — |
| 8–12 | `recompute_score` logic (on-chain) | — |
| 12–16 | `mint_badge` soulbound tokens via Metaplex | — |
| 16 | `anchor build && anchor deploy --provider.cluster devnet` | **PUSH** `shared/program_id.txt` + `shared/idl/reputation_passport.json` |
| 16–20 | Anchor tests, bug fixes | — |
| 20–22 | Seed devnet demo wallet (10-15 varied WorkRecords, 3 mock platforms) | — |
| 22 | Write seeded wallet address to `shared/demo_wallet.txt` | **PUSH** |
| 22–24 | Final bug fixes, verify demo wallet reads correctly | — |

---

## File Structure

```
programs/reputation-passport/src/
  lib.rs
  instructions/
    initialize_passport.rs
    register_platform.rs
    emit_work_record.rs
    recompute_score.rs      # called internally, not a public instruction
    mint_badge.rs
  state/
    passport.rs
    work_record.rs
    platform.rs
  errors.rs
  constants.rs
tests/
  reputation-passport.ts
shared/
  constants.json            # commit Hour 1
  program_id.txt            # commit after deploy (~Hour 16)
  demo_wallet.txt           # commit Hour 22
  idl/
    reputation_passport.json  # commit after deploy (~Hour 16)
Anchor.toml
Cargo.toml
```

---

## State Structs

### `passport.rs`
```rust
// space = 8 + 32 + 1 + 4 + 4 + 8 + 8 + 8 + 1 + 4 + 8 + 1 = 87
#[account]
pub struct PassportAccount {
    pub owner:            Pubkey,
    pub overall_score:    u8,        // 0-100
    pub total_gigs:       u32,
    pub dispute_count:    u32,
    pub total_earned:     u64,       // lamports lifetime
    pub created_at:       i64,
    pub last_updated:     i64,
    pub badge_count:      u8,
    pub sum_ratings:      u32,       // for recompute_score
    pub last_timestamp:   i64,       // for recency score
    pub unique_platforms: u8,        // capped at 5 for diversity score
}
```

### `work_record.rs`
```rust
// space = 8 + 32 + 32 + 1 + 8 + 1 + 1 + 8 + 32 = 123
#[account]
pub struct WorkRecord {
    pub worker:      Pubkey,
    pub platform:    Pubkey,
    pub category:    WorkCategory,
    pub amount_paid: u64,
    pub rating:      u8,          // 1-5
    pub disputed:    bool,
    pub timestamp:   i64,
    pub record_id:   [u8; 32],    // platform's internal job id hash
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum WorkCategory {
    Tech, Design, Language, Teaching, Other
}
```

### `platform.rs`
```rust
// space = 8 + 32 + (4+50) + 8 + 1 = 103
#[account]
pub struct RegisteredPlatform {
    pub address: Pubkey,
    pub name:    String,          // max 50 chars
    pub stake:   u64,
    pub active:  bool,
}
```

---

## Instructions

### `initialize_passport`
- PDA: `["passport", wallet_pubkey]`
- Creates `PassportAccount`, sets `owner`, `created_at`, zeroes everything else
- Fails if PDA already exists (Anchor handles this)

### `register_platform`
- PDA: `["platform", platform_pubkey]`
- Requires SOL stake transfer from caller to a vault PDA
- Sets `active: true`
- Your team controls who gets registered (admin keypair check or hardcode for hackathon)

### `emit_work_record`
- Caller must be a `RegisteredPlatform` with `active: true`
- PDA: `["work_record", worker_pubkey, record_id]`
- Write immutable `WorkRecord`
- Execute fee split:
```rust
let worker_amount   = amount * 95 / 100;
let platform_amount = amount * 4  / 100;
let treasury_amount = amount - worker_amount - platform_amount;
// system_program::transfer CPI for each
```
- At the end: call `recompute_score` internally (update `PassportAccount` aggregates)

### `recompute_score` (internal, not public)
No floating point in Rust — use integer math scaled ×100:
```rust
// avg_rating_component = (sum_ratings * 100 / total_gigs / 5) * 35 / 100
// dispute_component    = ((total_gigs - dispute_count) * 100 / total_gigs) * 25 / 100
// volume_component     = min(total_gigs, 100) * 20 / 100
// recency_component    = if days_since_last < 30 { 10 } elif < 180 { 5 } else { 0 }
// diversity_component  = min(unique_platforms, 5) * 10 / 5
// overall_score        = sum, capped at 100
```
Store aggregates on `PassportAccount` to avoid iterating all WorkRecords on-chain.

### `mint_badge`
- Check thresholds against `PassportAccount` fields
- Badge types: `FirstGig`, `TrustedWorker`, `MultiPlatform`, `ZeroDisputes`, `DomainExpert`, `EarlyAdopter`
- Metaplex `create_metadata_account_v3`: `is_mutable: false`, freeze authority = program PDA (soulbound)
- Thresholds:
```
FirstGig       → total_gigs >= 1
TrustedWorker  → total_gigs >= 50, dispute_count / total_gigs < 5%
MultiPlatform  → unique_platforms >= 3
ZeroDisputes   → total_gigs >= 20, dispute_count == 0
DomainExpert   → any single category has >= 25 gigs (track per-category counter)
EarlyAdopter   → global passport counter <= 1000 (counter PDA)
```

---

## Errors (`errors.rs`)

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Platform is not registered")]
    PlatformNotRegistered,
    #[msg("Platform is not active")]
    PlatformInactive,
    #[msg("Invalid rating, must be 1-5")]
    InvalidRating,
    #[msg("Duplicate record ID")]
    DuplicateRecordId,
    #[msg("Badge already minted")]
    BadgeAlreadyMinted,
}
```

---

## Tests (`tests/reputation-passport.ts`)

```
initialize_passport
  ✓ creates PDA with correct owner
  ✓ fails on second call (PDA already exists)

register_platform
  ✓ transfers stake, marks active = true
  ✓ fails without sufficient stake

emit_work_record
  ✓ writes WorkRecord with correct fields
  ✓ fee split: worker gets 95%, platform 4%, treasury 1%
  ✓ updates PassportAccount aggregates
  ✓ fails if caller is not a registered platform
  ✓ fails if rating out of range (0 or 6)

mint_badge
  ✓ mints FirstGig badge after 1 gig
  ✓ token cannot be transferred (soulbound)
  ✓ fails if threshold not met
```

---

## Deliverable Checklist

- [ ] `shared/constants.json` pushed by Hour 1
- [ ] Program builds: `anchor build`
- [ ] Tests pass: `anchor test`
- [ ] Deployed to devnet: `anchor deploy --provider.cluster devnet`
- [ ] `shared/program_id.txt` pushed after deploy
- [ ] `shared/idl/reputation_passport.json` pushed after deploy
- [ ] Demo wallet seeded: 10-15 `emit_work_record` calls, varied data, 3 mock platforms
- [ ] `shared/demo_wallet.txt` pushed by Hour 22
