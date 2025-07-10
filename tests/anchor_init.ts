import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorInit } from "../target/types/anchor_init";
import { SendTransactionError } from "@solana/web3.js";

describe("anchor_init", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  console.log("Provider:", anchor.getProvider());
  const program = anchor.workspace.anchorInit as Program<AnchorInit>;

  it("Is initialized!", async () => {
    // try {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
    // } catch (error) {
    //   if (error instanceof SendTransactionError) {
    //     console.error("Transaction failed:", error);
    //     console.log("Transaction logs:", error.logs);
    //   } else {
    //     console.error("An unexpected error occurred:", error);
    //   }
    // }
  });
});
