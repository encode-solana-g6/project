use anchor_lang::prelude::*;

declare_id!("GgNe5m41C3f1Q3SVjJXNZVFpvcgFPDsH1hHXdbSobPrm");

#[program]
pub mod lottery {
    use super::*;

    pub fn init_master(_ctx: Context<InitMaster>) -> Result<()> {
        msg!("Initializing Master PDA for all lotteries...");
        Ok(())
    }

    pub fn create_lottery(ctx: Context<CreateLottery>, ticket_price: u64) -> Result<()> {
        msg!("Creating a new lottery...");
        let lottery = &mut ctx.accounts.lottery_pda;
        let master = &mut ctx.accounts.master_pda;
        lottery.id = master.last_lottery_id + 1;
        lottery.authority = ctx.accounts.authority.key();
        lottery.ticket_price = ticket_price;
        lottery.last_ticket_id = 0;
        lottery.winner_ticket_id = 0;
        lottery.claimed = false;
        master.last_lottery_id += lottery.id;
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>, lottery_id: u32) -> Result<()> {
        msg!("Buying a ticket for lottery ID: {}", lottery_id);
        let lottery = &mut ctx.accounts.lottery_pda;
        let ticket = &mut ctx.accounts.ticket_pda;

        lottery.last_ticket_id += 1;
        Ok(())
    }
}

pub struct CreateLotteryArgs {
    pub ticket_price: u64,
}

#[derive(Accounts)]
pub struct InitMaster<'info> {
    #[account(init, payer = payer, space = 8 + 32, seeds = [MASTER_PDA_SEED], bump)]
    pub master_pda: Account<'info, MasterPDA>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>, // to create accounts
}

#[derive(Accounts)]
pub struct CreateLottery<'info> {
    #[account(init, payer = authority, space = 8 + 4, seeds = [LOTTERY_SEED, &(master_pda.last_lottery_id+1).to_le_bytes()], bump)]
    pub lottery_pda: Account<'info, LotteryPDA>,
    #[account(mut,seeds=[MASTER_PDA_SEED], bump)]
    pub master_pda: Account<'info, MasterPDA>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>, // to create accounts
}

#[derive(Accounts)]
#[instruction(lottery_id: u32)]
pub struct BuyTicket<'info> {
    #[account(mut, seeds = [LOTTERY_SEED, &lottery_pda.key().to_bytes()], bump)]
    pub lottery_pda: Account<'info, LotteryPDA>,
    #[account(init, payer = payer, seeds = [TICKET_SEED, &lottery_id.to_le_bytes(), &lottery_pda.next_ticket_id().to_le_bytes()], bump, space = 8+40)]
    pub ticket_pda: Account<'info, TicketPDA>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>, // to create accounts
}

pub const MASTER_PDA_SEED: &[u8] = b"master";
#[account]
#[derive(Debug)]
pub struct MasterPDA {
    pub last_lottery_id: u32,
}

pub const LOTTERY_SEED: &[u8] = b"lottery";
#[account]
#[derive(Debug)]
pub struct LotteryPDA {
    pub id: u32,
    pub authority: Pubkey,
    pub ticket_price: u64,
    pub last_ticket_id: u32,
    pub winner_ticket_id: u32,
    pub claimed: bool,
}
impl LotteryPDA {
    pub fn next_ticket_id(&self) -> u32 {
        self.last_ticket_id + 1
    }
}

pub const TICKET_SEED: &[u8] = b"ticket";
#[account]
#[derive(Debug)]
pub struct TicketPDA {
    pub lottery_id: u32,
    pub ticket_id: u32,
    pub owner: Pubkey,
}

// #[cfg(test)]
// pub mod convenience {
//     use super::*;
//     use solana_pubkey::Pubkey;

//     impl MasterPDA {
//         pub fn pda() -> (Pubkey, u8) {
//             Pubkey::find_program_address(&[b"master"], &crate::ID)
//         }
//     }
// }
