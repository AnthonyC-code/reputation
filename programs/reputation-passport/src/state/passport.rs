use anchor_lang::prelude::*;

// space = 8 discriminator
//       + 32 owner
//       + 1  overall_score
//       + 4  total_gigs
//       + 4  dispute_count
//       + 8  total_earned
//       + 8  created_at
//       + 8  last_updated
//       + 1  badge_count
//       + 4  sum_ratings
//       + 8  last_timestamp
//       + 1  unique_platforms
//       + (1+5)*6 category_gigs (6 categories, u32 each = 24 + padding)
//       = 8+32+1+4+4+8+8+8+1+4+8+1+24 = 111
pub const PASSPORT_SIZE: usize = 8 + 32 + 1 + 4 + 4 + 8 + 8 + 8 + 1 + 4 + 8 + 1 + 24;

#[account]
pub struct PassportAccount {
    pub owner:            Pubkey,
    pub overall_score:    u8,        // 0-100
    pub total_gigs:       u32,
    pub dispute_count:    u32,
    pub total_earned:     u64,       // lamports lifetime
    pub created_at:       i64,
    pub last_updated:     i64,
    pub badge_count:      u8,
    // aggregates for recompute_score (avoid iterating all WorkRecords on-chain)
    pub sum_ratings:      u32,
    pub last_timestamp:   i64,
    pub unique_platforms: u8,        // capped at 5 for diversity score
    // per-category gig counts for DomainExpert badge [Tech, Design, Language, Teaching, Other]
    pub category_gigs:    [u32; 5],
}

impl PassportAccount {
    pub fn recompute_score(&mut self) {
        if self.total_gigs == 0 {
            self.overall_score = 0;
            return;
        }

        // avg_rating_component: (sum_ratings / total_gigs) / 5.0 * 35
        // integer: sum_ratings * 35 / (total_gigs * 5), capped at 35
        let avg_component = (self.sum_ratings as u64 * 35)
            / (self.total_gigs as u64 * 5);
        let avg_component = avg_component.min(35) as u32;

        // dispute_component: (1 - dispute_rate) * 25
        // integer: (total_gigs - dispute_count) * 25 / total_gigs
        let dispute_component = ((self.total_gigs - self.dispute_count.min(self.total_gigs)) as u64 * 25)
            / self.total_gigs as u64;
        let dispute_component = dispute_component as u32;

        // volume_component: min(total_gigs/100, 1.0) * 20
        let volume_component = (self.total_gigs.min(100) as u64 * 20 / 100) as u32;

        // recency_component: based on days since last gig
        let now = Clock::get().map(|c| c.unix_timestamp).unwrap_or(self.last_timestamp);
        let days_since = ((now - self.last_timestamp).max(0) / 86400) as u32;
        let recency_component: u32 = if days_since < 30 { 10 } else if days_since < 180 { 5 } else { 0 };

        // diversity_component: min(unique_platforms, 5) * 10 / 5
        let diversity_component = (self.unique_platforms.min(5) as u32 * 10) / 5;

        let total = avg_component + dispute_component + volume_component + recency_component + diversity_component;
        self.overall_score = total.min(100) as u8;
    }
}
