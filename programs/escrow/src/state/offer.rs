use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Offer {
    // Details of the offer made, e.g. what who made it and what they want in return.
    // Identifier of the offer
    pub id: u64,
    // Who made the offer
    pub maker: Pubkey,
    // The token mint of the token 'a' being offered
    pub token_mint_a: Pubkey,
    // The token mint of the token 'b' wanted in return
    pub token_mint_b: Pubkey,
    // The amount wanted for token 'b'
    pub token_b_wanted_amount: u64,
    // Used to calculate the address for this account
    // we save it as a performance optimization
    pub bump: u8,
    
}
