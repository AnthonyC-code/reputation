use anchor_lang::prelude::*;

// space = 8 + 32 + (4+50) + 8 + 1 = 103
pub const PLATFORM_SIZE: usize = 8 + 32 + (4 + 50) + 8 + 1;

#[account]
pub struct RegisteredPlatform {
    pub address: Pubkey,
    pub name:    String, // max 50 chars
    pub stake:   u64,
    pub active:  bool,
}
