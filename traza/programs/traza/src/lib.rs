use anchor_lang::prelude::*;

pub mod error;
pub mod state;

use state::*;

declare_id!("f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX");

#[program]
pub mod traza {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.program_config;
        let (_, bump) = Pubkey::find_program_address(&[b"config"], &ctx.program_id);
        config.authority = ctx.accounts.authority.key();
        config.bump = bump;
        config.initialized = true;
        msg!("Program initialized by: {:?}", config.authority);
        Ok(())
    }

    pub fn register_role(ctx: Context<RegisterRole>, requested_role: Role) -> Result<()> {
        let (expected_pda, _) = Pubkey::find_program_address(
            &[b"role_registry", ctx.accounts.wallet.key().as_ref()],
            ctx.program_id,
        );
        require!(
            ctx.accounts.role_registry.key() == expected_pda,
            error::TrazaError::InvalidRoleRegistryAccount
        );
        require!(
            ctx.accounts.role_registry.data_is_empty(),
            error::TrazaError::RoleAlreadyValidated
        );

        let clock = Clock::get()?;
        let pending = &mut ctx.accounts.pending_role;
        let (_, bump) =
            Pubkey::find_program_address(&[b"pending_role", ctx.accounts.wallet.key().as_ref()], ctx.program_id);

        pending.wallet = ctx.accounts.wallet.key();
        pending.requested_role = requested_role.clone();
        pending.bump = bump;
        pending.created_at = clock.unix_timestamp;

        msg!("Role registration requested: {:?} for {:?}", pending.requested_role, pending.wallet);
        Ok(())
    }

    pub fn validate_role(ctx: Context<ValidateRole>) -> Result<()> {
        let pending = &ctx.accounts.pending_role;
        let clock = Clock::get()?;
        let (_, bump) = Pubkey::find_program_address(&[b"role_registry", pending.wallet.as_ref()], ctx.program_id);

        let registry = &mut ctx.accounts.role_registry;
        registry.wallet = pending.wallet;
        registry.role = pending.requested_role.clone();
        registry.bump = bump;
        registry.validated_at = clock.unix_timestamp;

        msg!("Role validated: {:?} for {:?}", registry.role, registry.wallet);
        Ok(())
    }

    pub fn create_token(
        ctx: Context<CreateToken>,
        amount: u64,
        metadata: String,
        coffee_type: String,
        farm_name: String,
        harvest_date: i64,
        origin_country: String,
        altitude_meters: u16,
        temperature: Option<i16>,
        humidity: Option<u16>,
        latitude: f64,
        longitude: f64,
    ) -> Result<()> {
        require!(amount > 0, error::TrazaError::InvalidAmount);
        require!(
            metadata.len() <= TraceToken::METADATA_MAX_LEN,
            error::TrazaError::MetadataTooLong
        );
        require!(
            coffee_type.len() <= TraceToken::COFFEE_TYPE_MAX_LEN,
            error::TrazaError::MetadataTooLong
        );
        require!(
            farm_name.len() <= TraceToken::FARM_NAME_MAX_LEN,
            error::TrazaError::MetadataTooLong
        );
        require!(
            origin_country.len() <= TraceToken::ORIGIN_COUNTRY_MAX_LEN,
            error::TrazaError::MetadataTooLong
        );

        let clock = Clock::get()?;
        let (_, token_bump) = Pubkey::find_program_address(
            &[b"trace_token", ctx.accounts.mint.key().as_ref()],
            ctx.program_id,
        );
        let (_, balance_bump) = Pubkey::find_program_address(
            &[b"token_balance", ctx.accounts.mint.key().as_ref(), ctx.accounts.creator.key().as_ref()],
            ctx.program_id,
        );

        let token = &mut ctx.accounts.trace_token;
        token.mint = ctx.accounts.mint.key();
        token.creator = ctx.accounts.creator.key();
        token.creator_role = ctx.accounts.role_registry.role.clone();
        token.total_supply = amount;
        token.status = TokenStatus::Created;
        token.source_tokens = vec![];
        token.metadata = metadata;
        token.created_at = clock.unix_timestamp;
        token.bump = token_bump;
        token.coffee_type = coffee_type;
        token.farm_name = farm_name;
        token.harvest_date = harvest_date;
        token.origin_country = origin_country;
        token.altitude_meters = altitude_meters;
        token.temperature = temperature;
        token.humidity = humidity;
        token.oracle_verified = latitude != 0.0 && longitude != 0.0;
        token.latitude = latitude;
        token.longitude = longitude;
        token.event_count = 0;

        let balance = &mut ctx.accounts.creator_balance;
        balance.token_mint = ctx.accounts.mint.key();
        balance.owner = ctx.accounts.creator.key();
        balance.balance = amount;
        balance.bump = balance_bump;
        balance.last_updated = clock.unix_timestamp;

        if token.creator_role == Role::Factory {
            let remaining = ctx.remaining_accounts;
            require!(remaining.len() > 0, error::TrazaError::FactoryRequiresSourceTokens);
            require!(
                remaining.len() <= TraceToken::SOURCE_TOKENS_MAX,
                error::TrazaError::FactoryRequiresSourceTokens
            );

            for acc in remaining.iter() {
                let data = acc.try_borrow_data()?;
                require!(
                    data.len() >= 8 + 32 + 32 + 4,
                    error::TrazaError::InvalidSourceTokenCreator
                );
                let mut offset = 8;
                let mint = Pubkey::try_from_slice(&data[offset..offset + 32])?;
                offset += 32;
                offset += 32;
                let creator_role_byte = data[offset];
                require!(creator_role_byte == 0, error::TrazaError::InvalidSourceTokenCreator);
                token.source_tokens.push(mint);
            }
        }

        msg!("Token created: mint={:?}, total_supply={}, creator={:?}", token.mint, token.total_supply, token.creator);
        Ok(())
    }

    pub fn add_trace_event(
        ctx: Context<AddTraceEvent>,
        event_type: EventType,
        description: String,
        temperature: Option<i16>,
        humidity: Option<u16>,
        index: u32,
    ) -> Result<()> {
        require!(
            description.len() <= TraceEvent::DESCRIPTION_MAX_LEN,
            error::TrazaError::DescriptionTooLong
        );
        require!(
            index == ctx.accounts.trace_token.event_count,
            error::TrazaError::InvalidEventIndex
        );

        let clock = Clock::get()?;
        let (_, bump) = Pubkey::find_program_address(
            &[b"trace_event", ctx.accounts.trace_token.mint.as_ref(), &index.to_le_bytes()],
            ctx.program_id,
        );

        let event = &mut ctx.accounts.trace_event;
        event.token_mint = ctx.accounts.trace_token.mint;
        event.recorder = ctx.accounts.recorder.key();
        event.event_type = event_type;
        event.description = description;
        event.timestamp = clock.unix_timestamp;
        event.temperature = temperature;
        event.humidity = humidity;
        event.bump = bump;
        event.index = index;

        ctx.accounts.trace_token.event_count += 1;

        msg!("Trace event added: mint={:?} index={}", event.token_mint, index);
        Ok(())
    }

    pub fn request_certificate(
        ctx: Context<RequestCertificate>,
        cert_type: CertType,
        notes: String,
    ) -> Result<()> {
        require!(
            notes.len() <= Certificate::NOTES_MAX_LEN,
            error::TrazaError::DescriptionTooLong
        );

        let clock = Clock::get()?;
        let (_, bump) = Pubkey::find_program_address(
            &[b"certificate", ctx.accounts.trace_token.mint.as_ref(), &[cert_type as u8]],
            ctx.program_id,
        );

        let cert = &mut ctx.accounts.certificate;
        cert.token_mint = ctx.accounts.trace_token.mint;
        cert.cert_type = cert_type;
        cert.status = CertStatus::Pending;
        cert.requester = ctx.accounts.requester.key();
        cert.authority = ctx.accounts.program_config.authority;
        cert.requested_at = clock.unix_timestamp;
        cert.resolved_at = None;
        cert.notes = notes;
        cert.bump = bump;

        msg!("Certificate requested: mint={:?} type={:?}", cert.token_mint, cert.cert_type);
        Ok(())
    }

    pub fn resolve_certificate(
        ctx: Context<ResolveCertificate>,
        _cert_type: CertType,
        approved: bool,
        notes: String,
    ) -> Result<()> {
        require!(
            notes.len() <= Certificate::NOTES_MAX_LEN,
            error::TrazaError::DescriptionTooLong
        );

        let clock = Clock::get()?;
        let cert = &mut ctx.accounts.certificate;
        cert.status = if approved { CertStatus::Approved } else { CertStatus::Rejected };
        cert.resolved_at = Some(clock.unix_timestamp);
        cert.notes = notes;

        msg!("Certificate resolved: mint={:?} approved={}", cert.token_mint, approved);
        Ok(())
    }

    pub fn initiate_transfer(ctx: Context<InitiateTransfer>, amount: u64) -> Result<()> {
        require!(amount > 0, error::TrazaError::InvalidAmount);
        require!(
            ctx.accounts.from.key() != ctx.accounts.to.key(),
            error::TrazaError::TransferToSelf
        );

        let from_role = &ctx.accounts.from_role_registry.role;
        let to_role = &ctx.accounts.to_role_registry.role;

        let valid = matches!(
            (from_role, to_role),
            (Role::Producer, Role::Factory)
                | (Role::Factory, Role::Retailer)
                | (Role::Retailer, Role::Consumer)
        );
        require!(valid, error::TrazaError::InvalidTransferPath);

        let clock = Clock::get()?;
        let (_, bump) = Pubkey::find_program_address(
            &[b"pending_transfer", ctx.accounts.trace_token.mint.as_ref(), ctx.accounts.from.key().as_ref(), ctx.accounts.to.key().as_ref()],
            ctx.program_id,
        );

        let pending = &mut ctx.accounts.pending_transfer;
        pending.token_mint = ctx.accounts.trace_token.mint;
        pending.from = ctx.accounts.from.key();
        pending.to = ctx.accounts.to.key();
        pending.amount = amount;
        pending.bump = bump;
        pending.initiated_at = clock.unix_timestamp;

        msg!(
            "Transfer initiated: token={:?} from={:?} to={:?} amount={}",
            pending.token_mint,
            pending.from,
            pending.to,
            pending.amount
        );
        Ok(())
    }

    pub fn accept_transfer(ctx: Context<AcceptTransfer>) -> Result<()> {
        let pending = &ctx.accounts.pending_transfer;
        let clock = Clock::get()?;
        let (_, to_bump) = Pubkey::find_program_address(
            &[b"token_balance", ctx.accounts.trace_token.mint.as_ref(), ctx.accounts.to.key().as_ref()],
            ctx.program_id,
        );

        // Transfer from sender's balance
        ctx.accounts.from_balance.balance = ctx.accounts.from_balance.balance
            .checked_sub(pending.amount)
            .ok_or(error::TrazaError::InsufficientBalance)?;
        ctx.accounts.from_balance.last_updated = clock.unix_timestamp;

        // Add to receiver's balance
        let to_balance = &mut ctx.accounts.to_balance;
        if to_balance.owner == Pubkey::default() {
            // Initialize new balance account
            to_balance.token_mint = ctx.accounts.trace_token.mint;
            to_balance.owner = ctx.accounts.to.key();
            to_balance.bump = to_bump;
        }
        to_balance.balance = to_balance.balance
            .checked_add(pending.amount)
            .ok_or(error::TrazaError::TransferAmountExceedsTokenAmount)?;
        to_balance.last_updated = clock.unix_timestamp;

        msg!("Transfer accepted: token={:?} from={:?} to={:?} amount={}", ctx.accounts.trace_token.mint, pending.from, pending.to, pending.amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + ProgramConfig::LEN, seeds = [b"config"], bump)]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterRole<'info> {
    #[account(
        init,
        payer = wallet,
        space = 8 + PendingRoleRegistration::LEN,
        seeds = [b"pending_role", wallet.key().as_ref()],
        bump
    )]
    pub pending_role: Account<'info, PendingRoleRegistration>,

    /// CHECK: Pass RoleRegistry PDA - must be empty
    pub role_registry: UncheckedAccount<'info>,

    #[account(mut)]
    pub wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateRole<'info> {
    #[account(
        seeds = [b"config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key() @ error::TrazaError::UnauthorizedAuthority
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        close = authority,
        seeds = [b"pending_role", pending_role.wallet.as_ref()],
        bump = pending_role.bump
    )]
    pub pending_role: Account<'info, PendingRoleRegistration>,

    #[account(
        init,
        payer = authority,
        space = 8 + RoleRegistry::LEN,
        seeds = [b"role_registry", pending_role.wallet.as_ref()],
        bump
    )]
    pub role_registry: Account<'info, RoleRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + TraceToken::LEN,
        seeds = [b"trace_token", mint.key().as_ref()],
        bump
    )]
    pub trace_token: Account<'info, TraceToken>,

    #[account(
        init,
        payer = creator,
        space = 8 + TokenBalance::LEN,
        seeds = [b"token_balance", mint.key().as_ref(), creator.key().as_ref()],
        bump
    )]
    pub creator_balance: Account<'info, TokenBalance>,

    pub mint: Signer<'info>,

    #[account(
        seeds = [b"role_registry", creator.key().as_ref()],
        bump = role_registry.bump,
        constraint = role_registry.role == Role::Producer || role_registry.role == Role::Factory @ error::TrazaError::InvalidCreatorRole
    )]
    pub role_registry: Account<'info, RoleRegistry>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitiateTransfer<'info> {
    #[account(
        mut,
        seeds = [b"trace_token", trace_token.mint.as_ref()],
        bump = trace_token.bump
    )]
    pub trace_token: Account<'info, TraceToken>,

    #[account(
        mut,
        seeds = [b"token_balance", trace_token.mint.as_ref(), from.key().as_ref()],
        bump = from_balance.bump
    )]
    pub from_balance: Account<'info, TokenBalance>,

    #[account(
        init,
        payer = from,
        space = 8 + PendingTransfer::LEN,
        seeds = [b"pending_transfer", trace_token.mint.as_ref(), from.key().as_ref(), to.key().as_ref()],
        bump
    )]
    pub pending_transfer: Account<'info, PendingTransfer>,

    #[account(seeds = [b"role_registry", from.key().as_ref()], bump = from_role_registry.bump)]
    pub from_role_registry: Account<'info, RoleRegistry>,

    /// CHECK: Receiver
    pub to: UncheckedAccount<'info>,

    #[account(seeds = [b"role_registry", to.key().as_ref()], bump = to_role_registry.bump)]
    pub to_role_registry: Account<'info, RoleRegistry>,

    #[account(mut)]
    pub from: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptTransfer<'info> {
    #[account(
        mut,
        seeds = [b"trace_token", trace_token.mint.as_ref()],
        bump = trace_token.bump
    )]
    pub trace_token: Account<'info, TraceToken>,

    #[account(
        mut,
        close = to,
        seeds = [b"pending_transfer", trace_token.mint.as_ref(), pending_transfer.from.as_ref(), to.key().as_ref()],
        bump = pending_transfer.bump,
        constraint = pending_transfer.to == to.key() @ error::TrazaError::InvalidTransferPath
    )]
    pub pending_transfer: Account<'info, PendingTransfer>,

    #[account(
        mut,
        seeds = [b"token_balance", trace_token.mint.as_ref(), pending_transfer.from.as_ref()],
        bump = from_balance.bump
    )]
    pub from_balance: Account<'info, TokenBalance>,

    #[account(
        init_if_needed,
        payer = to,
        space = 8 + TokenBalance::LEN,
        seeds = [b"token_balance", trace_token.mint.as_ref(), to.key().as_ref()],
        bump,
        constraint = to_balance.token_mint == trace_token.mint || to_balance.owner == Pubkey::default()
    )]
    pub to_balance: Account<'info, TokenBalance>,

    #[account(seeds = [b"role_registry", to.key().as_ref()], bump = role_registry.bump)]
    pub role_registry: Account<'info, RoleRegistry>,

    #[account(mut)]
    pub to: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_type: EventType, description: String, temperature: Option<i16>, humidity: Option<u16>, index: u32)]
pub struct AddTraceEvent<'info> {
    #[account(
        mut,
        seeds = [b"trace_token", trace_token.mint.as_ref()],
        bump = trace_token.bump
    )]
    pub trace_token: Account<'info, TraceToken>,

    #[account(
        seeds = [b"token_balance", trace_token.mint.as_ref(), recorder.key().as_ref()],
        bump = recorder_balance.bump,
        constraint = recorder_balance.balance > 0 @ error::TrazaError::InsufficientBalance
    )]
    pub recorder_balance: Account<'info, TokenBalance>,

    #[account(
        init,
        payer = recorder,
        space = 8 + TraceEvent::LEN,
        seeds = [b"trace_event", trace_token.mint.as_ref(), &index.to_le_bytes()],
        bump
    )]
    pub trace_event: Account<'info, TraceEvent>,

    #[account(
        seeds = [b"role_registry", recorder.key().as_ref()],
        bump = role_registry.bump
    )]
    pub role_registry: Account<'info, RoleRegistry>,

    #[account(mut)]
    pub recorder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(cert_type: CertType)]
pub struct RequestCertificate<'info> {
    #[account(
        seeds = [b"trace_token", trace_token.mint.as_ref()],
        bump = trace_token.bump
    )]
    pub trace_token: Account<'info, TraceToken>,

    #[account(
        seeds = [b"token_balance", trace_token.mint.as_ref(), requester.key().as_ref()],
        bump = requester_balance.bump,
        constraint = requester_balance.balance > 0 @ error::TrazaError::InsufficientBalance
    )]
    pub requester_balance: Account<'info, TokenBalance>,

    #[account(
        init,
        payer = requester,
        space = 8 + Certificate::LEN,
        seeds = [b"certificate", trace_token.mint.as_ref(), &[cert_type as u8]],
        bump
    )]
    pub certificate: Account<'info, Certificate>,

    #[account(
        seeds = [b"role_registry", requester.key().as_ref()],
        bump = role_registry.bump,
        constraint = role_registry.role == Role::Producer || role_registry.role == Role::Factory @ error::TrazaError::InvalidCreatorRole
    )]
    pub role_registry: Account<'info, RoleRegistry>,

    #[account(
        seeds = [b"config"],
        bump = program_config.bump
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub requester: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(cert_type: CertType)]
pub struct ResolveCertificate<'info> {
    #[account(
        mut,
        seeds = [b"certificate", certificate.token_mint.as_ref(), &[cert_type as u8]],
        bump = certificate.bump,
        constraint = certificate.status == CertStatus::Pending @ error::TrazaError::CertificateNotPending
    )]
    pub certificate: Account<'info, Certificate>,

    #[account(
        seeds = [b"config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key() @ error::TrazaError::UnauthorizedCertifier
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
