use anchor_lang::prelude::*;
use crate::state::{PassportAccount, PassportCounter, PASSPORT_SIZE, COUNTER_SIZE};
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializePassport<'info> {
    #[account(
        init,
        payer = payer,
        space = PASSPORT_SIZE,
        seeds = [PASSPORT_SEED, wallet.key().as_ref()],
        bump
    )]
    pub passport: Account<'info, PassportAccount>,

    /// CHECK: the wallet whose passport is being created (can differ from payer)
    pub wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = COUNTER_SIZE,
        seeds = [COUNTER_SEED],
        bump
    )]
    pub counter: Account<'info, PassportCounter>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePassport>) -> Result<()> {
    let passport = &mut ctx.accounts.passport;
    let counter  = &mut ctx.accounts.counter;
    let clock    = Clock::get()?;

    passport.owner            = ctx.accounts.wallet.key();
    passport.overall_score    = 0;
    passport.total_gigs       = 0;
    passport.dispute_count    = 0;
    passport.total_earned     = 0;
    passport.created_at       = clock.unix_timestamp;
    passport.last_updated     = clock.unix_timestamp;
    passport.badge_count      = 0;
    passport.sum_ratings      = 0;
    passport.last_timestamp   = clock.unix_timestamp;
    passport.unique_platforms = 0;
    passport.category_gigs    = [0u32; 5];

    counter.count = counter.count.saturating_add(1);

    Ok(())
}
