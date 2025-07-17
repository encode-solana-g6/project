// use anchor_lang::error_code;
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{Mint,TokenAccount};

declare_id!("2zNTYwuKpcXm73EjEZTUAbvTnerhTGnAD8eRU2Y9VRo2");

#[account]
pub struct VaultPDA {
    pub seed: u8,       // I think we'll need it to sign token transfers
    pub bump: u8,       //  I think we'll need it to sign token transfers
    pub maker: Pubkey,  // Person who first deposited token A into escrow
    pub mint_a: Pubkey, // The mint of the token A
    pub mint_b: Pubkey, // The mint of the token B
    pub receive_b_amount: u64,
}
impl VaultPDA {
    const SPACE: usize = 8+std::mem::size_of::<VaultPDA>();
    const SEED_NAME: &'static str = "vault_pda";
    const SEEDS_LEN: usize = Self::SEED_NAME.len() + std::mem::size_of::<VaultSeedArgs>();
    pub fn seeds(maker: &Pubkey, seed: u64) -> [u8; 32] {
        let mut seed = [0u8; 32];
        
        seed[..8].copy_from_slice(&args.seed.to_le_bytes());
        seed[8..].copy_from_slice(args.maker.as_ref());
        seed
    }
}
pub struct VaultSeedArgs {
    maker: Pubkey,
    seed: u64,
}

#[program]
pub mod escrow {
    use super::*;

    pub fn make_order(ctx: Context<MakeOrder>, seed: u64, deposit: u64, recv: u64) -> Result<()> {
        ctx.accounts.deposit(deposit)?;
        ctx.accounts.save_escrow(seed, recv, &ctx.bumps)?;
        Ok(())
    }

    // pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
    //     ctx.accounts.refund_and_close_vault(deposit)?;
    //     Ok(())
    // }

    // pub fn take(ctx: Context<TakeOrder>) -> Result<()> {
    //     ctx.accounts.deposit()?;
    //     ctx.accounts.withdraw_and_close_vault()?;
    //     Ok(())
    // }
}

#[derive(Accounts)]
#[instruction(seed:u64)]
pub struct MakeOrder<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(init, payer=maker, seeds=[&VaultPDA::seeds(&maker.key(), seed)], bump, space=VaultPDA::SPACE)]
    pub vault_pda: Account<'info, VaultPDA>,
    #[account(mut, mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mut, mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut, 
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
impl MakeOrder<'_> {
    fn deposit(&self, deposit: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            self.mint_a.to_account_info(),
            Transfer {
                from: self.maker.to_account_info(),
                to: self.vault_pda.to_account_info(),
                authority: self.maker.to_account_info(),
            },
        );
        self.mint_a.transfer(cpi_ctx, deposit)?;
        Ok(())
    }
    fn save_escrow(&self, seed: u64, recv: u64, bump: &[u8]) -> Result<()> {
        let vault_pda = self.vault_pda.key();
        let cpi_ctx = CpiContext::new(
            self.mint_b.to_account_info(),
            Transfer {
                from: self.maker.to_account_info(),
                to: self.vault_pda.to_account_info(),
                authority: self.maker.to_account_info(),
            },
        );
        self.mint_b.transfer(cpi_ctx, recv)?;
        let vault = VaultPDA {
            seed,
            bump: bump[0],
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            receive_b_amount: recv,
        };
        vault.init(self.maker.to_account_info())?;
        Ok(())
    }
}

// #[derive(Accounts)]
// pub struct CancelOrder<'info> {
//     #[account(mut)]
//     pub escrow_pda: Account<'info, VaultPDA>,
//     #[account(mut)]
//     pub maker: Signer<'info>,
//     pub mint_a: Account<'info, Mint>,
//     pub mint_b: Account<'info, Mint>,
// }
// impl CancelOrder<'_> {
//     fn refund_and_close_vault(&self, deposit: u64) -> Result<()> {
//         let cpi_ctx = CpiContext::new(
//             self.mint_a.to_account_info(),
//             Transfer {
//                 from: self.escrow_pda.to_account_info(),
//                 to: self.maker.to_account_info(),
//                 authority: self.escrow_pda.to_account_info(),
//             },
//         );
//         self.mint_a.transfer(cpi_ctx, deposit)?;
//         self.escrow_pda.close(self.maker.to_account_info())?;
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct TakeOrder<'info> {
//     #[account(mut)]
//     pub escrow_pda: Account<'info, EscrowPDA>,
//     #[account(mut)]
//     pub taker: Signer<'info>,
//     pub mint_a: Account<'info, Mint>,
//     pub mint_b: Account<'info, Mint>,
// }
// impl TakeOrder<'_> {
//     fn withdraw_and_close_vault(&self) -> Result<()> {
//         let cpi_ctx = CpiContext::new(
//             self.mint_b.to_account_info(),
//             Transfer {
//                 from: self.escrow_pda.to_account_info(),
//                 to: self.taker.to_account_info(),
//                 authority: self.escrow_pda.to_account_info(),
//             },
//         );
//         self.mint_b
//             .transfer(cpi_ctx, self.escrow_pda.receive_b_amount)?;
//         self.escrow_pda.close(self.taker.to_account_info())?;
//         Ok(())
//     }
// }

#[error_code]
pub enum TakeOrderError {
    #[msg("Placeholder for future error handling")]
    PLACEHOLDER_ERROR,
}
