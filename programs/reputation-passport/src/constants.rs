// Minimum SOL stake required to register a platform (0.1 SOL in lamports)
pub const PLATFORM_STAKE_MIN: u64 = 100_000_000;

// Fee split basis points (must sum to 10000)
pub const WORKER_BPS: u64    = 9500; // 95%
pub const PLATFORM_BPS: u64  = 400;  // 4%
// treasury gets the remainder (1%)

// PDA seeds
pub const PASSPORT_SEED: &[u8]    = b"passport";
pub const WORK_RECORD_SEED: &[u8] = b"work_record";
pub const PLATFORM_SEED: &[u8]    = b"platform";
pub const VAULT_SEED: &[u8]       = b"vault";
pub const COUNTER_SEED: &[u8]     = b"counter";

// EarlyAdopter badge threshold
pub const EARLY_ADOPTER_MAX: u32 = 1000;
