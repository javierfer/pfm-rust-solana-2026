use anchor_lang::prelude::*;

#[account]
pub struct PendingTransfer {
    pub token_mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub bump: u8,
    pub initiated_at: i64,
}

impl PendingTransfer {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 1 + 8;
}
