use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum Role {
    Producer,
    Factory,
    Retailer,
    Consumer,
}

#[account]
pub struct RoleRegistry {
    pub wallet: Pubkey,
    pub role: Role,
    pub bump: u8,
    pub validated_at: i64,
}

impl RoleRegistry {
    pub const LEN: usize = 8 + 32 + 4 + 1 + 8; // discriminator + wallet + role + bump + validated_at
}
