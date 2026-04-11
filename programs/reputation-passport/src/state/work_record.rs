use anchor_lang::prelude::*;

// space = 8 + 32 + 32 + 1 + 8 + 1 + 1 + 8 + 32 = 123
pub const WORK_RECORD_SIZE: usize = 8 + 32 + 32 + 1 + 8 + 1 + 1 + 8 + 32;

#[account]
pub struct WorkRecord {
    pub worker:      Pubkey,
    pub platform:    Pubkey,
    pub category:    WorkCategory,
    pub amount_paid: u64,
    pub rating:      u8,       // 1-5
    pub disputed:    bool,
    pub timestamp:   i64,
    pub record_id:   [u8; 32], // platform's internal job id hash
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum WorkCategory {
    Tech,
    Design,
    Language,
    Teaching,
    Other,
}

impl WorkCategory {
    pub fn index(&self) -> usize {
        match self {
            WorkCategory::Tech     => 0,
            WorkCategory::Design   => 1,
            WorkCategory::Language => 2,
            WorkCategory::Teaching => 3,
            WorkCategory::Other    => 4,
        }
    }
}
