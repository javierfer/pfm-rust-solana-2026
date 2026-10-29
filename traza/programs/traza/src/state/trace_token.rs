use anchor_lang::prelude::*;
use super::Role;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TokenStatus {
    Created,
    InTransfer,
    Accepted,
}

#[account]
pub struct TraceToken {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub creator_role: Role,
    pub total_supply: u64,
    pub status: TokenStatus,
    pub source_tokens: Vec<Pubkey>,
    pub metadata: String,
    pub created_at: i64,
    pub bump: u8,
    pub coffee_type: String,
    pub farm_name: String,
    pub harvest_date: i64,
    pub origin_country: String,
    pub altitude_meters: u16,
    pub temperature: Option<i16>,
    pub humidity: Option<u16>,
    pub event_count: u32,
    pub oracle_verified: bool,
    pub latitude: f64,
    pub longitude: f64,
}

impl TraceToken {
    pub const METADATA_MAX_LEN: usize = 256;
    pub const SOURCE_TOKENS_MAX: usize = 10;
    pub const COFFEE_TYPE_MAX_LEN: usize = 32;
    pub const FARM_NAME_MAX_LEN: usize = 64;
    pub const ORIGIN_COUNTRY_MAX_LEN: usize = 64;

    // discriminator(8) + mint(32) + creator(32) + creator_role(4) + total_supply(8)
    // + status(4) + source_tokens(4+32*10) + metadata(4+256) + created_at(8) + bump(1)
    // + coffee_type(4+32) + farm_name(4+64) + harvest_date(8) + origin_country(4+64)
    // + altitude_meters(2) + temperature(1+2) + humidity(1+2) + event_count(4) + oracle_verified(1) + lat(8) + lon(8)
    pub const LEN: usize = 8 + 32 + 32 + 4 + 8 + 4 + (4 + 32 * Self::SOURCE_TOKENS_MAX) + 4 + Self::METADATA_MAX_LEN + 8 + 1
        + (4 + Self::COFFEE_TYPE_MAX_LEN) + (4 + Self::FARM_NAME_MAX_LEN) + 8 + (4 + Self::ORIGIN_COUNTRY_MAX_LEN)
        + 2 + 3 + 3 + 4 + 1 + 8 + 8;
}
