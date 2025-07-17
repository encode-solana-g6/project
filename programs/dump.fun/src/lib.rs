use anchor_lang::prelude::*;

declare_id!("A6c59rX2C99GWocjsaan59GJ129EfPgaAKbqSHa58ZCW");

#[program]
pub mod dump_fun {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
