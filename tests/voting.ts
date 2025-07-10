import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { Voting } from "../target/types/voting";
import { SendTransactionError } from "@solana/web3.js";

describe("voting", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  console.log("Provider:", anchor.getProvider());
  const program = anchor.workspace.voting as Program<Voting>;
  const voteBank = anchor.web3.Keypair.generate(); // we choose keys for the VoteBank account
  const user1 = anchor.web3.Keypair.generate();
  const user2 = anchor.web3.Keypair.generate();

  it("Init the global VoteBank data account", async () => {
    const tx = await program.methods.init().accounts({ voteBank: voteBank.publicKey }).signers([voteBank]).rpc();
    console.log("VoteBank data account:", voteBank.publicKey.toBase58());
  });

  async function createUserWithAirdrop(): Promise<anchor.web3.Keypair> {
    const provider = anchor.getProvider();
    const user = anchor.web3.Keypair.generate();
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    const airdropTx = await provider.connection.requestAirdrop(user.publicKey, 1000000000); // 1 SOL
    await provider.connection.confirmTransaction({
      signature: airdropTx,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    return user;
  }

  it("Airdrop SOL to users", async () => {
    const user1WithAirdrop = await createUserWithAirdrop();
    const user2WithAirdrop = await createUserWithAirdrop();

    // Confirm balances (optional, but good for debugging)
    const provider = anchor.getProvider();
    let user1Balance = await provider.connection.getBalance(user1WithAirdrop.publicKey);
    let user2Balance = await provider.connection.getBalance(user2WithAirdrop.publicKey);
    console.log(`User1 balance: ${user1Balance / 1000000000} SOL`);
    console.log(`User2 balance: ${user2Balance / 1000000000} SOL`);
  });

  it("Vote for A", async () => {
    const tx = await program.methods
      .vote({ a: {} })
      .accounts({
        voteBank: voteBank.publicKey,
      })
      // .signers([user1])
      .rpc();
    console.log("TxHash ::", tx);

    let voteBankData = await program.account.uniqVoteBank.fetch(voteBank.publicKey);
    console.log(`Total GMs :: ${voteBankData.votesA}`);
    console.log(`Total GNs :: ${voteBankData.votesB}`);
  });

  it("Vote for B", async () => {
    const tx = await program.methods
      .vote({ b: {} })
      .accounts({
        voteBank: voteBank.publicKey,
      })
      // .signers([user2])
      .rpc();
    console.log("TxHash ::", tx);

    let voteBankData = await program.account.uniqVoteBank.fetch(voteBank.publicKey);
    console.log(`Total A : ${voteBankData.votesA}`);
    console.log(`Total GNs : ${voteBankData.votesB}`);
  });
});
