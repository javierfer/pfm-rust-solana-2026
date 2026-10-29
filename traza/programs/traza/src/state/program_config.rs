use anchor_lang::prelude::*;

#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,
    pub bump: u8,
    pub initialized: bool,
}

impl ProgramConfig {
    pub const LEN: usize = 8 + 32 + 1 + 1;
}
