use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
#[repr(u8)]
pub enum CertType {
    Sanitary = 0,
    Quality = 1,
    Organic = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CertStatus {
    Pending,
    Approved,
    Rejected,
}

#[account]
pub struct Certificate {
    pub token_mint: Pubkey,
    pub cert_type: CertType,
    pub status: CertStatus,
    pub requester: Pubkey,
    pub authority: Pubkey,
    pub requested_at: i64,
    pub resolved_at: Option<i64>,
    pub notes: String,
    pub bump: u8,
}

impl Certificate {
    pub const NOTES_MAX_LEN: usize = 200;

    // discriminator(8) + token_mint(32) + cert_type(4) + status(4) + requester(32)
    // + authority(32) + requested_at(8) + resolved_at(1+8) + notes(4+200) + bump(1)
    pub const LEN: usize = 8 + 32 + 4 + 4 + 32 + 32 + 8 + (1 + 8) + (4 + Self::NOTES_MAX_LEN) + 1;
}
