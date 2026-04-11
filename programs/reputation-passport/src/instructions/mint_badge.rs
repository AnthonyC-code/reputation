use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    mpl_token_metadata::types::DataV2,
    CreateMetadataAccountsV3, Metadata,
};
use crate::state::{PassportAccount, PassportCounter};
use crate::constants::*;
use crate::errors::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum BadgeType {
    FirstGig,
    TrustedWorker,
    MultiPlatform,
    ZeroDisputes,
    DomainExpert,
    EarlyAdopter,
}

#[derive(Accounts)]
#[instruction(badge_type: BadgeType)]
pub struct MintBadge<'info> {
    #[account(
        mut,
        seeds = [PASSPORT_SEED, wallet.key().as_ref()],
        bump
    )]
    pub passport: Account<'info, PassportAccount>,

    #[account(
        seeds = [COUNTER_SEED],
        bump
    )]
    pub counter: Account<'info, PassportCounter>,

    /// CHECK: wallet that owns the passport
    pub wallet: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = passport,
        mint::freeze_authority = passport,
    )]
    pub badge_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = badge_mint,
        associated_token::authority = wallet,
    )]
    pub badge_token_account: Account<'info, TokenAccount>,

    /// CHECK: Metaplex metadata PDA — validated by Metaplex CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<MintBadge>, badge_type: BadgeType) -> Result<()> {
    let passport = &ctx.accounts.passport;
    let counter  = &ctx.accounts.counter;

    match badge_type {
        BadgeType::FirstGig => {
            require!(passport.total_gigs >= 1, ErrorCode::BadgeThresholdNotMet);
        }
        BadgeType::TrustedWorker => {
            require!(passport.total_gigs >= 50, ErrorCode::BadgeThresholdNotMet);
            require!(
                passport.dispute_count * 100 / passport.total_gigs < 5,
                ErrorCode::BadgeThresholdNotMet
            );
        }
        BadgeType::MultiPlatform => {
            require!(passport.unique_platforms >= 3, ErrorCode::BadgeThresholdNotMet);
        }
        BadgeType::ZeroDisputes => {
            require!(passport.total_gigs >= 20, ErrorCode::BadgeThresholdNotMet);
            require!(passport.dispute_count == 0, ErrorCode::BadgeThresholdNotMet);
        }
        BadgeType::DomainExpert => {
            let max_cat = passport.category_gigs.iter().copied().max().unwrap_or(0);
            require!(max_cat >= 25, ErrorCode::BadgeThresholdNotMet);
        }
        BadgeType::EarlyAdopter => {
            require!(counter.count <= EARLY_ADOPTER_MAX, ErrorCode::BadgeThresholdNotMet);
        }
    }

    let (badge_name, badge_symbol, badge_uri) = badge_metadata(&badge_type);
    let wallet_key = ctx.accounts.wallet.key();
    let passport_bump = ctx.bumps.passport;
    let signer_seeds: &[&[&[u8]]] = &[&[PASSPORT_SEED, wallet_key.as_ref(), &[passport_bump]]];

    // Mint 1 token
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::MintTo {
                mint:      ctx.accounts.badge_mint.to_account_info(),
                to:        ctx.accounts.badge_token_account.to_account_info(),
                authority: ctx.accounts.passport.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    )?;

    // Remove mint authority → soulbound
    anchor_spl::token::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::SetAuthority {
                account_or_mint:   ctx.accounts.badge_mint.to_account_info(),
                current_authority: ctx.accounts.passport.to_account_info(),
            },
            signer_seeds,
        ),
        anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
        None,
    )?;

    // Create Metaplex metadata (is_mutable: false)
    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata:         ctx.accounts.metadata.to_account_info(),
                mint:             ctx.accounts.badge_mint.to_account_info(),
                mint_authority:   ctx.accounts.passport.to_account_info(),
                payer:            ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.passport.to_account_info(),
                system_program:   ctx.accounts.system_program.to_account_info(),
                rent:             ctx.accounts.rent.to_account_info(),
            },
            signer_seeds,
        ),
        DataV2 {
            name:                    badge_name,
            symbol:                  badge_symbol,
            uri:                     badge_uri,
            seller_fee_basis_points: 0,
            creators:                None,
            collection:              None,
            uses:                    None,
        },
        false, // is_mutable = false → soulbound
        true,
        None,
    )?;

    let passport = &mut ctx.accounts.passport;
    passport.badge_count = passport.badge_count.saturating_add(1);

    Ok(())
}

fn badge_metadata(badge_type: &BadgeType) -> (String, String, String) {
    match badge_type {
        BadgeType::FirstGig      => ("First Gig".into(),      "FGIG".into(), "https://reputation-passport.xyz/badges/first-gig.json".into()),
        BadgeType::TrustedWorker => ("Trusted Worker".into(), "TRKR".into(), "https://reputation-passport.xyz/badges/trusted-worker.json".into()),
        BadgeType::MultiPlatform => ("Multi-Platform".into(), "MPLT".into(), "https://reputation-passport.xyz/badges/multi-platform.json".into()),
        BadgeType::ZeroDisputes  => ("Zero Disputes".into(),  "ZERO".into(), "https://reputation-passport.xyz/badges/zero-disputes.json".into()),
        BadgeType::DomainExpert  => ("Domain Expert".into(),  "DEXP".into(), "https://reputation-passport.xyz/badges/domain-expert.json".into()),
        BadgeType::EarlyAdopter  => ("Early Adopter".into(),  "ERLY".into(), "https://reputation-passport.xyz/badges/early-adopter.json".into()),
    }
}
