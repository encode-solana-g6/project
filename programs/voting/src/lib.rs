use anchor_lang::prelude::*;

declare_id!("5SBHwL1A7QNAkyEYdXXJ9PVTqwrhpkHrejwH5jjwunY5");

#[program]
pub mod voting {
    use super::*;

    /// init UniqVoteBank account - pamol
    pub fn init(ctx: Context<CallInitVoteBank>) -> Result<()> {
        msg!("Hello from voting program: {:?}", ctx.program_id);
        // create account UniqVoteBank is auto-init with #[account(init)]
        ctx.accounts.vote_bank.is_open_to_votes = true;
        Ok(())
    }

    /// user: votes for A or B
    pub fn vote(ctx: Context<CallVote>, vote: VoteType) -> Result<()> {
        match vote {
            VoteType::A => ctx.accounts.vote_bank.votes_a += 1,
            VoteType::B => ctx.accounts.vote_bank.votes_b += 1,
        }
        msg!("Voted for {:?}", vote);
        msg!(
            "Current state: is_open_to_votes={}, votesA={}, votesB={}",
            ctx.accounts.vote_bank.is_open_to_votes,
            ctx.accounts.vote_bank.votes_a,
            ctx.accounts.vote_bank.votes_b
        );
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
    #[account(mut)]
    pub vote_bank: Account<'a, UniqVoteBank>,
    pub signer: Signer<'a>,
}

#[account]
pub struct UniqVoteBank {
    is_open_to_votes: bool, // size 1
    votes_a: u64,           // size 8
    votes_b: u64,           // size 8
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub enum VoteType {
    A,
    B,
}
