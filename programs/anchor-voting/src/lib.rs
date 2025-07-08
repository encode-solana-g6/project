use anchor_lang::prelude::*;

declare_id!("6HCBijJ5ir1ZCqZhNtFJ1DyA57mnjBemqe31t2vHgnYr");

#[program]
pub mod anchor_voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
