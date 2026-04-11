use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{RegisteredPlatform, PLATFORM_SIZE};
use crate::constants::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterPlatform<'info> {
    #[account(
        init,
        payer = payer,
        space = PLATFORM_SIZE,
        seeds = [PLATFORM_SEED, platform_authority.key().as_ref()],
        bump
    )]
    pub platform: Account<'info, RegisteredPlatform>,

    /// CHECK: the platform's signing authority
    pub platform_authority: UncheckedAccount<'info>,

    /// vault PDA that holds the staked SOL
    #[account(
        mut,
        seeds = [VAULT_SEED, platform_authority.key().as_ref()],
        bump
    )]
    /// CHECK: PDA vault, no data
    pub vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterPlatform>, name: String, stake_amount: u64) -> Result<()> {
    require!(name.len() <= 50, ErrorCode::NameTooLong);
    require!(stake_amount >= PLATFORM_STAKE_MIN, ErrorCode::InsufficientStake);

    // Transfer stake from payer → vault PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to:   ctx.accounts.vault.to_account_info(),
            },
        ),
        stake_amount,
    )?;

    let platform = &mut ctx.accounts.platform;
    platform.address = ctx.accounts.platform_authority.key();
    platform.name    = name;
    platform.stake   = stake_amount;
    platform.active  = true;

    Ok(())
}
