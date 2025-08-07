use anchor_lang::prelude::*;

declare_id!("HuQSN9U3bQTbLEVK3pkUgGQ4Z2zZ7e2mvRVDfYEbY4Ne");

#[program]
pub mod staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
