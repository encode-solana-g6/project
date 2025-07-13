// #[cfg(test)]
// mod tests {
//     use anchor_lang::{
//         prelude::*,
//         solana_program::{pubkey::Pubkey as SolanaPubkey, system_program},
//         AccountDeserialize, InstructionData,
//     }; // Added AccountDeserialize
//     use litesvm::LiteSVM;
//     use lottery::{id, MasterPDA}; // Import id directly from lottery crate
//     use solana_sdk::{
//         instruction::Instruction, pubkey::Pubkey, signature::Keypair, signer::Signer,
//         transaction::Transaction,
//     };

//     #[test]
//     fn test_init_master() {
//         // Initialize a new LiteSVM instance
//         let mut litesvm = LiteSVM::new();

//         // Load the lottery program into LiteSVM
//         litesvm
//             .add_program(&id(), "target/deploy/lottery.so")
//             .unwrap();

//         // Generate a new keypair for the payer
//         let payer = Keypair::new();
//         litesvm.airdrop(&payer.pubkey(), 1_000_000_000_000).unwrap();

//         // Derive the MasterPDA address and bump
//         let (master_pda_key, _master_pda_bump) =
//             Pubkey::find_program_address(&[b"master_pda"], &id()); // Use id() directly

//         // Create the InitMaster context
//         let instruction = Instruction {
//             program_id: id(), // Use id() directly
//             accounts: lottery::accounts::InitMaster {
//                 master_account: master_pda_key,
//                 payer: payer.pubkey(),
//                 system_program: system_program::id(),
//             }
//             .to_account_metas(None),
//             data: lottery::instruction::InitMaster {}.data(),
//         };

//         // Execute the instruction
//         let mut transaction = Transaction::new_with_payer(&[instruction], Some(&payer.pubkey()));
//         transaction.sign(&[&payer], litesvm.latest_blockhash());

//         let result = litesvm.send_transaction(&transaction);

//         // Assert that the transaction was successful
//         assert!(result.is_ok(), "Transaction failed: {:?}", result.err());

//         // Fetch the MasterPDA account and deserialize its data
//         let fetched_account = litesvm.get_account(&master_pda_key).unwrap();
//         let master_account =
//             MasterPDA::try_deserialize(&mut fetched_account.data.as_slice()).unwrap(); // Deserialize data

//         assert_eq!(master_account.last_lottery_id, 0);
//     }
// }

#[cfg(test)]
mod tests {

    #[test]
    fn test_litesvm() {
        use litesvm::LiteSVM;
        use solana_keypair::Keypair;
        use solana_message::Message;
        use solana_pubkey::Pubkey;
        use solana_signer::Signer;
        use solana_system_interface::instruction::transfer;
        use solana_transaction::Transaction;

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
}
