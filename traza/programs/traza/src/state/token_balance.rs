use anchor_lang::prelude::*;

#[account]
pub struct TokenBalance {
    pub token_mint: Pubkey,
    pub owner: Pubkey,
    pub balance: u64,
    pub bump: u8,
    pub last_updated: i64,
}

impl TokenBalance {
    // discriminator(8) + token_mint(32) + owner(32) + balance(8) + bump(1) + last_updated(8)
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 8;
}
