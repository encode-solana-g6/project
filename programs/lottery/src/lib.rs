use anchor_lang::prelude::*;

declare_id!("GgNe5m41C3f1Q3SVjJXNZVFpvcgFPDsH1hHXdbSobPrm");

#[program]
pub mod lottery {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
