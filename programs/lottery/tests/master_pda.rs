#![cfg(test)]

use anchor_lang::solana_program::{instruction::Instruction, system_program};
use anchor_lang::{prelude::*, AccountDeserialize, InstructionData};
use litesvm::LiteSVM;
use lottery::{self, id, MasterPDA, MASTER_PDA_SEED};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_system_interface::instruction::transfer;
use solana_transaction::Transaction;

#[test]
fn test_litesvm() {
    let from_keypair = Keypair::new();
    let from = from_keypair.pubkey();
    let to = Pubkey::new_unique();

    let mut svm = LiteSVM::new();
    svm.airdrop(&from, 10_000).unwrap();

    let instruction = transfer(&from, &to, 64);
    let tx = Transaction::new(
        &[&from_keypair],
        Message::new(&[instruction], Some(&from)),
        svm.latest_blockhash(),
    );
    let tx_res = svm.send_transaction(tx).unwrap();

    let from_account = svm.get_account(&from);
    let to_account = svm.get_account(&to);
    assert_eq!(from_account.unwrap().lamports, 4936);
    assert_eq!(to_account.unwrap().lamports, 64);
}

#[test]
fn test_master_pda() {
    let mut svm = LiteSVM::new();
    svm.add_program(
        lottery::ID,
        include_bytes!("../../../target/deploy/lottery.so"),
    );

    // Generate a new keypair for the payer
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 1_000_000_000_000).unwrap();

    // Derive the MasterPDA address and bump
    let (master_pda_key, _master_pda_bump) =
        Pubkey::find_program_address(&[MASTER_PDA_SEED], &id()); // Use id() directly

    // Create the InitMaster context
    let instruction = Instruction {
        program_id: id(), // Use id() directly
        accounts: lottery::accounts::InitMaster {
            master_pda: master_pda_key,
            payer: payer.pubkey(),
            system_program: system_program::id(),
        }
        .to_account_metas(None),
        data: lottery::instruction::InitMaster {}.data(),
    };

    // Execute the instruction
    let mut transaction = Transaction::new_with_payer(&[instruction], Some(&payer.pubkey()));
    transaction.sign(&[&payer], svm.latest_blockhash());

    let result = svm.send_transaction(transaction);

    // Assert that the transaction was successful
    assert!(result.is_ok(), "Transaction failed: {:?}", result.err());

    // Fetch the MasterPDA account and deserialize its data
    let fetched_account = svm.get_account(&master_pda_key).unwrap();
    let master_account = MasterPDA::try_deserialize(&mut fetched_account.data.as_slice()).unwrap(); // Deserialize data
    dbg!(&fetched_account, &master_account);

    assert_eq!(master_account.last_lottery_id, 0);
}

#[test]
fn test_init_2() {
    use anchor_lang::InstructionData;
    use anchor_lang::ToAccountMetas;

    let payer = Keypair::new();
    // let from_keypair = Keypair::new();
    // let from = from_keypair.pubkey();
    // let mint = Keypair::new();
    // let to = Pubkey::new_unique();
    // dbg!(from_keypair.pubkey());
    // dbg!(mint.pubkey());

    let mut svm = LiteSVM::new();
    svm.airdrop(&payer.pubkey(), 2_000_000_000).unwrap();

    let program_id = lottery::ID;
    let program_bytes = include_bytes!("../../../target/deploy/lottery.so");

    svm.add_program(program_id, program_bytes);

    let init_ix = Instruction {
        program_id: lottery::ID,
        accounts: lottery::accounts::InitMaster {
            master_pda: {
                let (master_pda, _bump) = MasterPDA::pda();
                master_pda
            },
            payer: payer.pubkey(),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
        data: lottery::instruction::InitMaster {}.data(),
    };
    // let tx = Transaction::new(
    //     &[&mint, &from_keypair],
    //     Message::new(&[init_ix], Some(&from)),
    //     svm.latest_blockhash(),
    // );
    // let tx_res = svm.send_transaction(tx);
    // match tx_res {
    //     Ok(res) => {
    //         dbg!(res.logs);
    //     }
    //     Err(e) => {
    //         dbg!(e.err);
    //         dbg!(e.meta.logs);
    //     }
    // }

    // {
    //     //Asset Parameters
    //     let asset_params = CreateAssetParams {
    //         name: "Ubadineke".to_string(),
    //         symbol: "Prince".to_string(),
    //         uri: "ubadineke.netlify.app".to_string(),
    //         delegate: None,
    //     };

    //     // //Create Account for Mint
    //     // let create_account_ix = system_instruction::create_account(
    //     //     &from,
    //     //     &mint.pubkey(),
    //     //     // (Rent::get().unwrap()).minimum_balance(Mint::LEN),
    //     //     svm.minimum_balance_for_rent_exemption(Mint::LEN),
    //     //     Mint::LEN as u64,
    //     //     &token_2022::ID,
    //     // );

    //     // dbg!(&token_2022::ID);
    //     // //Initialize Account as Mint
    //     // let mint_init_ix =
    //     //     token_instruction::initialize_mint(&token_2022::ID, &mint.pubkey(), &from, Some(&from), 9)
    //     //         .unwrap();

    //     //Derive Asset PDA
    //     let asset_pda = Pubkey::find_program_address(
    //         &[ASSET.as_bytes(), mint.pubkey().as_ref()],
    //         &lottery::ID,
    //     )
    //     .0;
    //     dbg!(asset_pda);
    //     let init_ix = Instruction {
    //         program_id: lottery::ID,
    //         accounts: lottery::accounts::CreateAsset {
    //             authority: from,
    //             mint: mint.pubkey(),
    //             asset: asset_pda,
    //             system_program: system_program::ID,
    //             token_program: token_2022::ID,
    //         }
    //         .to_account_metas(None),
    //         data: lottery::instruction::CreateAsset {
    //             params: asset_params,
    //         }
    //         .data(),
    //     };

    //     let tx = Transaction::new(
    //         &[&mint, &from_keypair],
    //         Message::new(&[init_ix], Some(&from)),
    //         svm.latest_blockhash(),
    //     );
    //     let tx_res = svm.send_transaction(tx);
    //     // dbg!(tx_res);
    //     match tx_res {
    //         Ok(res) => {
    //             dbg!(res.logs);
    //         }
    //         Err(e) => {
    //             dbg!(e.err);
    //             dbg!(e.meta.logs);
    //         }
    //     }

    //     let mint = svm.get_account(&mint.pubkey()).unwrap();
    //     dbg!(mint);
    //     // let to_account = svm.get_account(&to);
    //     // let asset = svm.get_account(&asset_pda).unwrap();
    //     // dbg!(asset);

    //     // let from_account = svm.get_account(&from);
    //     // // let to_account = svm.get_account(&to);
    //     // assert_eq!(from_account.unwrap().lamports, 4936);
    //     // assert_eq!(to_account.unwrap().lamports, 64);
    // }
}

trait MasterPDAExt {
    fn pda() -> (Pubkey, u8);
}
impl MasterPDAExt for MasterPDA {
    fn pda() -> (Pubkey, u8) {
        Pubkey::find_program_address(&[b"master_pda"], &lottery::ID)
    }
}
