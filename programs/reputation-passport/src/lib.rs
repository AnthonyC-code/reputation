use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::initialize_passport::*;
use instructions::register_platform::*;
use instructions::emit_work_record::*;
use instructions::mint_badge::*;

declare_id!("3NQPuNCmLvouhRYJD4LxEFNqg42ooTzh272m4f2BVgkb");

#[program]
pub mod reputation_passport {
    use super::*;

    pub fn initialize_passport(ctx: Context<InitializePassport>) -> Result<()> {
        instructions::initialize_passport::handler(ctx)
    }

    pub fn register_platform(
        ctx: Context<RegisterPlatform>,
        name: String,
        stake_amount: u64,
    ) -> Result<()> {
        instructions::register_platform::handler(ctx, name, stake_amount)
    }

    pub fn emit_work_record(
        ctx: Context<EmitWorkRecord>,
        record_id: [u8; 32],
        category: crate::state::WorkCategory,
        amount: u64,
        rating: u8,
        disputed: bool,
    ) -> Result<()> {
        instructions::emit_work_record::handler(ctx, record_id, category, amount, rating, disputed)
    }

    pub fn mint_badge(ctx: Context<MintBadge>, badge_type: BadgeType) -> Result<()> {
        instructions::mint_badge::handler(ctx, badge_type)
    }
}
