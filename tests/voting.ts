import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { Voting } from "../target/types/voting";
import { SendTransactionError } from "@solana/web3.js";

describe("voting", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.voting as Program<Voting>;
  const voteBank = anchor.web3.Keypair.generate(); // we choose keys for the VoteBank account

  it("Init the global VoteBank data account", async () => {
    // try {
    const tx = await program.methods.init().accounts({ voteBank: voteBank.publicKey }).signers([voteBank]).rpc();
    console.log("VoteBank data account:", voteBank.publicKey.toBase58());
    // } catch (error) {
    // 	if (error instanceof SendTransactionError) {
    // 		console.error("Transaction failed:", error);
    // 		console.log("Transaction logs:", error.logs);
    // 	} else {
    // 		console.error("An unexpected error occurred:", error);
    // 	}
    // }
  });
});
