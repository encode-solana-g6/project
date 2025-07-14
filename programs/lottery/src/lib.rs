use anchor_lang::prelude::*;

declare_id!("GgNe5m41C3f1Q3SVjJXNZVFpvcgFPDsH1hHXdbSobPrm");

#[program]
pub mod lottery {
    use super::*;
    use anchor_lang::solana_program::{blake3::hash, program::invoke, system_instruction};

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
        lottery.winner_ticket_id = None;
        lottery.claimed = false;
        master.last_lottery_id += lottery.id;
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>, lottery_id: u32) -> Result<()> {
        msg!("Buying a ticket for lottery ID: {}", lottery_id);
        let lottery = &mut ctx.accounts.lottery_pda;
        let ticket = &mut ctx.accounts.ticket_pda;
        let buyer = &ctx.accounts.buyer;

        if lottery.winner_ticket_id.is_some() {
            return err!(LotteryError::WinnerAlreadyExists);
        }

        // Transfer SOL to the lottery PDA
        invoke(
            &system_instruction::transfer(&buyer.key(), &lottery.key(), lottery.ticket_price),
            &[
                buyer.to_account_info(),
                lottery.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        lottery.last_ticket_id += 1;
        // Create ticket account
        ticket.lottery_id = lottery.id;
        ticket.ticket_id = lottery.last_ticket_id;
        Ok(())
    }

    // TODO do we need lottery ID here? We have the lottery PDA as input
    pub fn pick_winner(ctx: Context<PickWinner>, lottery_id: u32) -> Result<()> {
        let lottery = &mut ctx.accounts.lottery_pda;
        let authority = &ctx.accounts.authority;

        if lottery.winner_ticket_id.is_some() {
            return err!(LotteryError::WinnerAlreadyExists);
        }
        if authority.key() != lottery.authority {
            return err!(LotteryError::UnauthorizedAction);
        }

        msg!("Picking a winner for lottery ID: {}", lottery.id);
        let clock = Clock::get()?;
        let pseudo_random_seed =
            <[u8; 8]>::try_from(&hash(&clock.unix_timestamp.to_be_bytes()).to_bytes()[..8])
                .expect("Failed to convert hash to array");
        let pseudo_random_number =
            ((u64::from_le_bytes(pseudo_random_seed) * clock.slot) % u32::MAX as u64) as u32;

        // Here you would implement the logic to pick a winner, e.g., using a random
        // lottery.winner_ticket_id = Some(1); // Dummy winner ticket ID
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
    #[account(init, payer = buyer, space = 8+40, seeds = [TICKET_SEED, &lottery_pda.key().to_bytes(), &lottery_pda.next_ticket_id().to_le_bytes()], bump)]
    pub ticket_pda: Account<'info, TicketPDA>,
    #[account(mut, seeds = [LOTTERY_SEED, &lottery_pda.id.to_le_bytes()], bump)]
    pub lottery_pda: Account<'info, LotteryPDA>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>, // to create accounts
}

#[derive(Accounts)]
#[instruction(lottery_id: u32)]
pub struct PickWinner<'info> {
    #[account(mut, seeds = [LOTTERY_SEED, &lottery_pda.id.to_le_bytes()], bump)]
    pub lottery_pda: Account<'info, LotteryPDA>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub const MASTER_PDA_SEED: &[u8] = b"master";
#[account]
#[derive(Debug)]
pub struct MasterPDA {
    pub last_lottery_id: u32,
}
// impl PDA for MasterPDA {
//     type Args = ();
//     fn seeds(_args: ()) -> &'static [&'static [u8]] {
//         &[MASTER_PDA_SEED]
//     }
// }

pub const LOTTERY_SEED: &[u8] = b"lottery";
#[account]
#[derive(Debug)]
pub struct LotteryPDA {
    pub id: u32,
    pub authority: Pubkey,
    pub ticket_price: u64,
    pub last_ticket_id: u32,
    pub winner_ticket_id: Option<u32>,
    pub claimed: bool,
}
impl LotteryPDA {
    // pub fn seeds<'a>(lottery_id: u32) -> Vec<[u8]> {
    //     [LOTTERY_SEED, &lottery_id.to_le_bytes()].to_vec()
    // }
    pub fn next_ticket_id(&self) -> u32 {
        self.last_ticket_id + 1
    }
}
// impl PDA for LotteryPDA {
//     type Args = u32; // lottery_id
//     fn seeds(args: Self::Args) -> &'static [&'static [u8]] {
//         &[LOTTERY_SEED]
//     }
// }

pub const TICKET_SEED: &[u8] = b"ticket";
#[account]
#[derive(Debug)]
pub struct TicketPDA {
    pub lottery_id: u32,
    pub ticket_id: u32,
    pub owner: Pubkey,
}
// impl PDA for TicketPDA {
//     type Args = TicketPdaSeedArgs;
//     fn seeds(args: Self::Args) -> &'static [&'static [u8]] {
//         &[
//             TICKET_SEED,
//             &args.lottery_id.to_le_bytes(),
//             &args.ticket_id.to_le_bytes(),
//         ]
//     }
// }
// pub struct TicketPdaSeedArgs {
//     pub lottery_id: u32,
//     pub ticket_id: u32,
// }

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

// pub trait PDA {
//     type Args;
//     fn seeds(args: Self::Args) -> &'static [&'static [u8]];
// }

use anchor_lang::error_code;
#[error_code]
pub enum LotteryError {
    #[msg("Winner already exists")]
    WinnerAlreadyExists,
    // #[msg("Invalid lottery ID")]
    // InvalidLotteryId,
    // #[msg("Ticket already claimed")]
    // TicketAlreadyClaimed,
    // #[msg("Insufficient funds to buy ticket")]
    // InsufficientFunds,
    #[msg("Unauthorized action")]
    UnauthorizedAction,
    // #[msg("Lottery is not open")]
    // LotteryNotOpen,
    // #[msg("Winner not chosen yet")]
    // WinnerNotChosenYet,
    // #[msg("No tickets purchased yet")]
    // NoTicketsPurchasedYet,
}
