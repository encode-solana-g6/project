use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use super::shared::{close_token_account, transfer_tokens};
use crate::{error::ErrorCode, state::Offer};

#[derive(Accounts)]
pub struct TakeOffer <'info>{
    // TakeOffer (in capitals) is a struct of names accounts that the
    // Take_offer() function will use.

    //Used to manage associated token accounts
    //i.e. where a wallet holds a specific type of token
    pub associated_token_program: Program<'info, AssociatedToken>,

    //Work with either the classic token program or the 
    //newer token extension program
    pub token_program: Interface<'info,TokenInterface>,

        //Used to create accounts
    pub system_program: Program<'info, System>,
    
    #[account(mut)]
    pub taker: Signer<'info>,
    
    #[account(mut)]
    pub maker: SystemAccount<'info>,

    
    #[account(mint::token_program = token_program)]
    pub token_mint_a: InterfaceAccount<'info, Mint>,

    #[account(mint::token_program = token_program)]
    pub token_mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = token_mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_token_account_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_token_account_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = token_mint_b,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_token_account_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = maker,
        has_one = maker,
        has_one = token_mint_b,
        seeds = [b"offer", offer.id.to_le_bytes().as_ref()],
        bump = offer.bump
    )]
    offer: Account<'info, Offer>,

    #[account(
        mut,
        associated_token::mint = token_mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
}


// Handle the take offer instruction by:
// 1. Withdrawing the offered tokens from the vault to the taker and closing the vault
// 2. Sending the wanted tokens from the taker to the maker
pub fn take_offer(context: Context<TakeOffer>) -> Result<()> {
    //Since the Offer account owns the vault, we will say there is one signer (the offer), with 
    //the seeds of the specific offer account
    //We can use these signer seeds to withdraw the token from the vault
    let offer_account_seeds = &[
        b"offer",
        &context.accounts.offer.id.to_le_bytes()[..],
        &[context.accounts.offer.bump],
    ];
    let signers_seeds = Some(&offer_account_seeds[..]);

    //Withdraw the offered tokens from the Vault to the takers Associated Toke account
    transfer_tokens(
        &context.accounts.vault,
        &context.accounts.taker_token_account_a,
        &context.accounts.vault.amount,
        &context.accounts.token_mint_a,
        &context.accounts.offer.to_account_info(),
        &context.accounts.token_program,
        signers_seeds,
    )
    .map_err( |_| ErrorCode::FailedVaultWithdrawal)?;

    //Close the vault and return the rent to the maker
    close_token_account(
        &context.accounts.vault, 
        &context.accounts.taker.to_account_info(), 
        &context.accounts.offer.to_account_info(), 
        &context.accounts.token_program, 
        signers_seeds,
    )
    .map(|_| ErrorCode::FailedVaultClosure)?;

    //Send the tokens from the makers Associated Toke account to the taker Associated account
    transfer_tokens(
        &context.accounts.taker_token_account_b,
        &context.accounts.maker_token_account_b,
        &context.accounts.offer.token_b_wanted_amount,
        &context.accounts.token_mint_b,
        &context.accounts.taker.to_account_info(),
        &context.accounts.token_program,
        None,
    )
    .map_err( |_| ErrorCode::InsufficientTakerBalance)?;
    Ok(())
}
