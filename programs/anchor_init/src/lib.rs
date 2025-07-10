use anchor_lang::prelude::*;

declare_id!("32GwVwnceAvFFFNNDgp1FAFrRkpYAYE9xS4GRqnQosoL");

#[program]
pub mod anchor_init {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
