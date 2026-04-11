use anchor_lang::prelude::*;

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
    #[msg("Badge threshold not met")]
    BadgeThresholdNotMet,
    #[msg("Platform name too long (max 50 chars)")]
    NameTooLong,
    #[msg("Insufficient stake")]
    InsufficientStake,
}
