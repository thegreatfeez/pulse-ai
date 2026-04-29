use anchor_lang::prelude::*;

declare_id!("8CxcCkx2KxpYGQLice4r6LdjNjqsXB7eB5E8ZQMG89ig");

const MAX_BPS: u16 = 10_000;

#[program]
pub mod pulse_ai_protocol {
    use super::*;

    pub fn initialize_user_risk_profile(
        ctx: Context<InitializeUserRiskProfile>,
        risk_mode: u8,
        max_position_bps: u16,
        max_concentration_bps: u16,
    ) -> Result<()> {
        validate_bps(max_position_bps)?;
        validate_bps(max_concentration_bps)?;

        let profile = &mut ctx.accounts.user_risk_profile;
        profile.authority = ctx.accounts.authority.key();
        profile.risk_mode = risk_mode;
        profile.max_position_bps = max_position_bps;
        profile.max_concentration_bps = max_concentration_bps;
        profile.created_at = Clock::get()?.unix_timestamp;
        profile.updated_at = profile.created_at;
        Ok(())
    }

    pub fn update_user_risk_profile(
        ctx: Context<UpdateUserRiskProfile>,
        risk_mode: u8,
        max_position_bps: u16,
        max_concentration_bps: u16,
    ) -> Result<()> {
        validate_bps(max_position_bps)?;
        validate_bps(max_concentration_bps)?;

        let profile = &mut ctx.accounts.user_risk_profile;
        profile.risk_mode = risk_mode;
        profile.max_position_bps = max_position_bps;
        profile.max_concentration_bps = max_concentration_bps;
        profile.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn initialize_risk_policy(
        ctx: Context<InitializeRiskPolicy>,
        min_portfolio_lamports: u64,
        max_portfolio_lamports: u64,
        max_position_bps: u16,
        max_concentration_bps: u16,
        volatility_scale_bps: u16,
    ) -> Result<()> {
        validate_bps(max_position_bps)?;
        validate_bps(max_concentration_bps)?;
        validate_bps(volatility_scale_bps)?;
        require!(
            min_portfolio_lamports <= max_portfolio_lamports,
            ProtocolError::InvalidPolicyRange
        );

        let policy = &mut ctx.accounts.risk_policy;
        policy.authority = ctx.accounts.authority.key();
        policy.min_portfolio_lamports = min_portfolio_lamports;
        policy.max_portfolio_lamports = max_portfolio_lamports;
        policy.max_position_bps = max_position_bps;
        policy.max_concentration_bps = max_concentration_bps;
        policy.volatility_scale_bps = volatility_scale_bps;
        policy.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_risk_policy(
        ctx: Context<UpdateRiskPolicy>,
        min_portfolio_lamports: u64,
        max_portfolio_lamports: u64,
        max_position_bps: u16,
        max_concentration_bps: u16,
        volatility_scale_bps: u16,
    ) -> Result<()> {
        validate_bps(max_position_bps)?;
        validate_bps(max_concentration_bps)?;
        validate_bps(volatility_scale_bps)?;
        require!(
            min_portfolio_lamports <= max_portfolio_lamports,
            ProtocolError::InvalidPolicyRange
        );

        let policy = &mut ctx.accounts.risk_policy;
        policy.min_portfolio_lamports = min_portfolio_lamports;
        policy.max_portfolio_lamports = max_portfolio_lamports;
        policy.max_position_bps = max_position_bps;
        policy.max_concentration_bps = max_concentration_bps;
        policy.volatility_scale_bps = volatility_scale_bps;
        policy.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn record_advice_commitment(
        ctx: Context<RecordAdviceCommitment>,
        nonce: u64,
        advice_hash: [u8; 32],
        context_hash: [u8; 32],
        portfolio_value_lamports: u64,
        risk_score: u8,
    ) -> Result<()> {
        let commitment = &mut ctx.accounts.advice_commitment;
        commitment.authority = ctx.accounts.authority.key();
        commitment.nonce = nonce;
        commitment.advice_hash = advice_hash;
        commitment.context_hash = context_hash;
        commitment.portfolio_value_lamports = portfolio_value_lamports;
        commitment.risk_score = risk_score;
        commitment.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn record_position_intent(
        ctx: Context<RecordPositionIntent>,
        nonce: u64,
        token_mint: Pubkey,
        side: u8,
        amount_lamports: u64,
        expected_slippage_bps: u16,
    ) -> Result<()> {
        validate_bps(expected_slippage_bps)?;
        require!(side <= 1, ProtocolError::InvalidSide);

        let intent = &mut ctx.accounts.position_intent;
        intent.authority = ctx.accounts.authority.key();
        intent.nonce = nonce;
        intent.token_mint = token_mint;
        intent.side = side;
        intent.amount_lamports = amount_lamports;
        intent.expected_slippage_bps = expected_slippage_bps;
        intent.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

fn validate_bps(value: u16) -> Result<()> {
    require!(value <= MAX_BPS, ProtocolError::InvalidBps);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeUserRiskProfile<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + UserRiskProfile::INIT_SPACE,
        seeds = [b"user-risk-profile", authority.key().as_ref()],
        bump
    )]
    pub user_risk_profile: Account<'info, UserRiskProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateUserRiskProfile<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user-risk-profile", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub user_risk_profile: Account<'info, UserRiskProfile>,
}

#[derive(Accounts)]
pub struct InitializeRiskPolicy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + RiskPolicy::INIT_SPACE,
        seeds = [b"risk-policy", authority.key().as_ref()],
        bump
    )]
    pub risk_policy: Account<'info, RiskPolicy>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRiskPolicy<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"risk-policy", authority.key().as_ref()],
        bump,
        has_one = authority
    )]
    pub risk_policy: Account<'info, RiskPolicy>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct RecordAdviceCommitment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + AdviceCommitment::INIT_SPACE,
        seeds = [b"advice-commitment", authority.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub advice_commitment: Account<'info, AdviceCommitment>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct RecordPositionIntent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + PositionIntent::INIT_SPACE,
        seeds = [b"position-intent", authority.key().as_ref(), &nonce.to_le_bytes()],
        bump
    )]
    pub position_intent: Account<'info, PositionIntent>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct UserRiskProfile {
    pub authority: Pubkey,
    pub risk_mode: u8,
    pub max_position_bps: u16,
    pub max_concentration_bps: u16,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct RiskPolicy {
    pub authority: Pubkey,
    pub min_portfolio_lamports: u64,
    pub max_portfolio_lamports: u64,
    pub max_position_bps: u16,
    pub max_concentration_bps: u16,
    pub volatility_scale_bps: u16,
    pub updated_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct AdviceCommitment {
    pub authority: Pubkey,
    pub nonce: u64,
    pub advice_hash: [u8; 32],
    pub context_hash: [u8; 32],
    pub portfolio_value_lamports: u64,
    pub risk_score: u8,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct PositionIntent {
    pub authority: Pubkey,
    pub nonce: u64,
    pub token_mint: Pubkey,
    pub side: u8, // 0 buy, 1 sell
    pub amount_lamports: u64,
    pub expected_slippage_bps: u16,
    pub created_at: i64,
}

#[error_code]
pub enum ProtocolError {
    #[msg("Invalid basis points value")]
    InvalidBps,
    #[msg("Invalid side, expected 0=buy or 1=sell")]
    InvalidSide,
    #[msg("Invalid policy range")]
    InvalidPolicyRange,
}
