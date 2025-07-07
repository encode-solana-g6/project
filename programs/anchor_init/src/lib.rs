use anchor_lang::prelude::*;

declare_id!("5fDmEukckVuTLze1zE4c6Thy5ec7eGrUq7XvquFhbJ6E");

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
