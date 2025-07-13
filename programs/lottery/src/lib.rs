use anchor_lang::prelude::*;

declare_id!("GgNe5m41C3f1Q3SVjJXNZVFpvcgFPDsH1hHXdbSobPrm");

#[program]
pub mod lottery {
    use super::*;

    pub fn init_master(ctx: Context<InitMaster>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_lottery(ctx: Context<CreateLottery>) -> Result<()> {
        msg!("Creating a new lottery...");
        // Logic to create a new lottery would go here
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitMaster<'info> {
    #[account(init, payer = payer, space = 8 + 32, seeds = [b"master_pda"], bump)]
    pub master_account: Account<'info, MasterPDA>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>, // to create accounts
}

#[derive(Accounts)]
pub struct CreateLottery<'info> {
    #[account(init, payer = authority, space = 8 + 4, seeds = ["lottery_pda".as_bytes(), &(master.last_lottery_id+1).to_le_bytes()], bump)]
    pub lottery_account: Account<'info, LotteryPDA>,
    pub master: Account<'info, MasterPDA>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>, // to create accounts
}

#[account]
pub struct MasterPDA {
    // pub master_id: u32,
    pub last_lottery_id: u32,
}

#[account]
pub struct LotteryPDA {
    pub lottery_id: u32,
    pub authority: u32,
    pub ticket_price: u64,
    pub last_ticket_id: u32,
    pub winner_ticket_id: u32,
    pub claimed: bool,
    // pub prize_amount: u64,
    // pub is_active: bool,
}
