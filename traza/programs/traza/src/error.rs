use anchor_lang::prelude::*;

#[error_code]
pub enum TrazaError {
    #[msg("Only the program authority can validate roles")]
    UnauthorizedAuthority,

    #[msg("User already has a validated role")]
    RoleAlreadyValidated,

    #[msg("Invalid role registry account")]
    InvalidRoleRegistryAccount,

    #[msg("User already has a pending role registration")]
    PendingRoleAlreadyExists,

    #[msg("Invalid role: only Producer or Factory can create tokens")]
    InvalidCreatorRole,

    #[msg("Factory must provide at least one source token from a Producer")]
    FactoryRequiresSourceTokens,

    #[msg("Source token must be created by a Producer")]
    InvalidSourceTokenCreator,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("Transfer amount exceeds token amount")]
    TransferAmountExceedsTokenAmount,

    #[msg("Invalid transfer: only Producer->Factory, Factory->Retailer, Retailer->Consumer allowed")]
    InvalidTransferPath,

    #[msg("Token is already in transfer")]
    TokenAlreadyInTransfer,

    #[msg("Token is not in transfer status")]
    TokenNotInTransfer,

    #[msg("Insufficient balance for transfer")]
    InsufficientBalance,

    #[msg("Cannot transfer to the same account")]
    TransferToSelf,

    #[msg("Metadata exceeds maximum length")]
    MetadataTooLong,

    #[msg("Certificate of this type already exists for this token")]
    CertificateAlreadyExists,

    #[msg("Certificate is not in Pending status")]
    CertificateNotPending,

    #[msg("Description exceeds maximum length of 200 characters")]
    DescriptionTooLong,

    #[msg("Only the program authority can resolve certificates")]
    UnauthorizedCertifier,

    #[msg("Event index must match the current event count of the token")]
    InvalidEventIndex,
}
