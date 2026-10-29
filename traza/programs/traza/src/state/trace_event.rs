use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EventType {
    Harvest,
    Processing,
    Roasting,
    Packaging,
    QualityCheck,
    Transport,
    Storage,
}

#[account]
pub struct TraceEvent {
    pub token_mint: Pubkey,
    pub recorder: Pubkey,
    pub event_type: EventType,
    pub description: String,
    pub timestamp: i64,
    pub temperature: Option<i16>,
    pub humidity: Option<u16>,
    pub bump: u8,
    pub index: u32,
}

impl TraceEvent {
    pub const DESCRIPTION_MAX_LEN: usize = 200;

    // discriminator(8) + token_mint(32) + recorder(32) + event_type(4)
    // + description(4+200) + timestamp(8) + temperature(1+2) + humidity(1+2) + bump(1) + index(4)
    pub const LEN: usize = 8 + 32 + 32 + 4 + (4 + Self::DESCRIPTION_MAX_LEN) + 8 + 3 + 3 + 1 + 4;
}
