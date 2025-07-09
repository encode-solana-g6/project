use anchor_lang::prelude::*;

declare_id!("FzdA2479vq93UucMszbw9bGYZEJNg5kEiPV37abo9Ytj");

#[program]
pub mod voting {
    use super::*;

    /// init UniqVoteBank account
    pub fn init(ctx: Context<CallInitVoteBank>) -> Result<()> {
        msg!("Hello from voting program: {:?}", ctx.program_id);
        // create account UniqVoteBank is auto-init with #[account(init)]
        ctx.accounts.vote_bank.is_open_to_votes = true;
        Ok(())
    }

    /// user: votes for A or B
    pub fn vote(ctx: Context<CallVote>, vote: VoteType) -> Result<()> {
        match vote {
            VoteType::A => ctx.accounts.vote_bank.votesA += 1,
            VoteType::B => ctx.accounts.vote_bank.votesB += 1,
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CallInitVoteBank<'a> {
    #[account(init, payer = signer, space = 8+1+8+8)]
    pub vote_bank: Account<'a, UniqVoteBank>, // account we create/init
    #[account(mut)]
    pub signer: Signer<'a>, // signer and payer of call
    pub system_program: Program<'a, System>, // for getting ownership of account
}

#[derive(Accounts)]
pub struct CallVote<'a> {
    #[account()]
    pub vote_bank: Account<'a, UniqVoteBank>,
    pub signer: Signer<'a>,
}

#[account]
pub struct UniqVoteBank {
    is_open_to_votes: bool, // size 1
    votesA: u64,            // size 8
    votesB: u64,            // size 8
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum VoteType {
    A,
    B,
}
