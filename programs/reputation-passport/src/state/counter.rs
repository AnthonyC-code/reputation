use anchor_lang::prelude::*;

// Global passport counter for EarlyAdopter badge
// space = 8 + 4 = 12
pub const COUNTER_SIZE: usize = 8 + 4;

#[account]
pub struct PassportCounter {
    pub count: u32,
}
