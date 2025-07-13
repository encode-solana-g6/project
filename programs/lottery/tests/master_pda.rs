#[cfg(test)]
mod tests {
    use anchor_lang::{
        prelude::*, solana_program::system_program, AccountDeserialize, InstructionData,
    }; // Added AccountDeserialize
    use litesvm::LiteSVM;
    use lottery::{id, MasterPDA}; // Import id directly from lottery crate
    use solana_sdk::{
        instruction::Instruction, pubkey::Pubkey, signature::Keypair, signer::Signer,
        transaction::Transaction,
    };

    #[test]
    fn test_init_master() {
        // Initialize a new LiteSVM instance
        let mut litesvm = LiteSVM::new();

        // Generate a new keypair for the payer
        let payer = Keypair::new();
        litesvm.airdrop(&payer.pubkey(), 1_000_000_000_000).unwrap();

        // Derive the MasterPDA address and bump
        let (master_pda_key, _master_pda_bump) =
            Pubkey::find_program_address(&[b"master_pda"], &id()); // Use id() directly

        // Create the InitMaster context
        let instruction = Instruction {
            program_id: id(), // Use id() directly
            accounts: lottery::accounts::InitMaster {
                master_account: master_pda_key,
                payer: payer.pubkey(),
                system_program: system_program::id(),
            }
            .to_account_metas(None),
            data: lottery::instruction::InitMaster {}.data(),
        };

        // Execute the instruction
        let mut transaction = Transaction::new_with_payer(&[instruction], Some(&payer.pubkey()));
        transaction.sign(&[&payer], litesvm.latest_blockhash());

        let result = litesvm.send_transaction(&transaction);

        // Assert that the transaction was successful
        assert!(result.is_ok(), "Transaction failed: {:?}", result.err());

        // Fetch the MasterPDA account and deserialize its data
        let fetched_account = litesvm.get_account(&master_pda_key).unwrap();
        let master_account =
            MasterPDA::try_deserialize(&mut fetched_account.data.as_slice()).unwrap(); // Deserialize data

        assert_eq!(master_account.last_lottery_id, 0);
    }
}
