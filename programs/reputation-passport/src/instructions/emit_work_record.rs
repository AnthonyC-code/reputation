use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{PassportAccount, RegisteredPlatform, WorkRecord, WORK_RECORD_SIZE};
use crate::constants::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(record_id: [u8; 32])]
pub struct EmitWorkRecord<'info> {
    #[account(
        mut,
        seeds = [PASSPORT_SEED, worker.key().as_ref()],
        bump
    )]
    pub passport: Account<'info, PassportAccount>,

    #[account(
        init,
        payer = platform_signer,
        space = WORK_RECORD_SIZE,
        seeds = [WORK_RECORD_SEED, worker.key().as_ref(), record_id.as_ref()],
        bump
    )]
    pub work_record: Account<'info, WorkRecord>,

    #[account(
        seeds = [PLATFORM_SEED, platform_signer.key().as_ref()],
        bump,
        constraint = platform.active @ ErrorCode::PlatformInactive,
    )]
    pub platform: Account<'info, RegisteredPlatform>,

    /// CHECK: worker wallet — receives 95% of payment
    #[account(mut)]
    pub worker: UncheckedAccount<'info>,

    /// CHECK: treasury wallet — receives 1%
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub platform_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<EmitWorkRecord>,
    record_id: [u8; 32],
    category: crate::state::WorkCategory,
    amount: u64,
    rating: u8,
    disputed: bool,
) -> Result<()> {
    require!(rating >= 1 && rating <= 5, ErrorCode::InvalidRating);

    let clock = Clock::get()?;

    // Fee split: worker 95%, platform keeps 4% implicitly, treasury 1%
    let worker_amount   = amount * WORKER_BPS / 10_000;
    let platform_amount = amount * PLATFORM_BPS / 10_000;
    let treasury_amount = amount - worker_amount - platform_amount;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.platform_signer.to_account_info(),
                to:   ctx.accounts.worker.to_account_info(),
            },
        ),
        worker_amount,
    )?;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.platform_signer.to_account_info(),
                to:   ctx.accounts.treasury.to_account_info(),
            },
        ),
        treasury_amount,
    )?;

    // platform_signer retains platform_amount (4%) — no transfer needed
    let _ = platform_amount;

    // Write immutable WorkRecord
    let record = &mut ctx.accounts.work_record;
    record.worker      = ctx.accounts.worker.key();
    record.platform    = ctx.accounts.platform_signer.key();
    record.category    = category.clone();
    record.amount_paid = amount;
    record.rating      = rating;
    record.disputed    = disputed;
    record.timestamp   = clock.unix_timestamp;
    record.record_id   = record_id;

    // Update passport aggregates
    let passport = &mut ctx.accounts.passport;
    passport.total_gigs     = passport.total_gigs.saturating_add(1);
    passport.total_earned   = passport.total_earned.saturating_add(worker_amount);
    passport.sum_ratings    = passport.sum_ratings.saturating_add(rating as u32);
    passport.last_timestamp = clock.unix_timestamp;
    passport.last_updated   = clock.unix_timestamp;

    if disputed {
        passport.dispute_count = passport.dispute_count.saturating_add(1);
    }

    if passport.unique_platforms < 5 {
        passport.unique_platforms = passport.unique_platforms.saturating_add(1);
    }

    let cat_idx = category.index();
    passport.category_gigs[cat_idx] = passport.category_gigs[cat_idx].saturating_add(1);

    passport.recompute_score();

    Ok(())
}
