use anchor_lang::prelude::*;
use super::Role;

#[account]
pub struct PendingRoleRegistration {
    pub wallet: Pubkey,
    pub requested_role: Role,
    pub bump: u8,
    pub created_at: i64,
}

impl PendingRoleRegistration {
    pub const LEN: usize = 8 + 32 + 4 + 1 + 8; // discriminator + wallet + role + bump + created_at
}
