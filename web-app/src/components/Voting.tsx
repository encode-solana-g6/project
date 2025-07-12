import React, { useState, useEffect } from "react";
import { useAnchorWallet, useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import { createNoopSigner, createTransaction, getAddressFromPublicKey } from "gill";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Voting } from "../../../target/types/voting";
import idl from "../../../target/idl/voting.json";
import { PublicKey } from "@solana/web3.js";
import Button from "./atoms/Button";
import { css } from "../../styled-system/css";
// No longer importing WalletProviderComponent directly here as it's in AppLayout

// const programID = new PublicKey(idl.address);

const programID = idl.address;

// export function Voting() {
//   // const { connection } = useConnection();
//   // const wallet: AnchorWallet = useAnchorWallet();

//   // const provider = new AnchorProvider(connection, wallet, {});
//   // setProvider(provider);

//   // const program = new Program(idl as Voting, {
//   //   connection,
//   // });
//   // const connection = useConnection();
//   // const wallet = useWallet();
//   // const [program, setProgram] = useState<Program | null>(null);
//   const [voteBank, setVoteBank] = useState<any>(null); // State to hold the vote bank account
//   // const [voteBankKeypair, setVoteBankKeypair] = useState<Keypair | null>(null); // State to hold the vote bank keypair
//   // const [voteBankAddress, setVoteBankAddress] = useState<PublicKey | null>(null); // State to hold the vote bank address

//   useEffect(() => {
//     if (wallet.connected && connection.connection && wallet.publicKey) {
//       const provider = new AnchorProvider(connection.connection, wallet as any, AnchorProvider.defaultOptions());
//       const votingProgram = new Program(idl as any, provider, provider);
//       setProgram(votingProgram);
//       // Try to load an existing vote bank if its address is already known (e.g., from a previous session)
//       // For this example, we'll assume it's set after init or manually.
//       // In a real app, you might load it from local storage or a URL parameter.
//     } else {
//       setProgram(null); // Clear program if wallet disconnects
//       setVoteBank(null); // Clear vote bank if wallet disconnects
//       // setVoteBankKeypair(null);
//       // setVoteBankAddress(null);
//     }
//   }, [wallet.connected, connection.connection, wallet.publicKey]);

//   // useEffect(() => {
//   //   if (program && voteBankAddress) {
//   //     fetchVoteBank(program, voteBankAddress);
//   //   }
//   // }, [program, voteBankAddress]);

//   // const fetchVoteBank = async (votingProgram: Program, address: PublicKey) => {
//   //   try {
//   //     const account = await votingProgram.account.uniqVoteBank.fetch(address);
//   //     setVoteBank(account);
//   //   } catch (error) {
//   //     console.error("Error fetching vote bank:", error);
//   //     setVoteBank(null); // Clear vote bank if not found
//   //   }
//   // };

//   const handleInitVoteBank = async () => {
//     // if (!program || !wallet.publicKey) return;
//     // const newVoteBankKeypair = Keypair.generate();
//     // setVoteBankKeypair(newVoteBankKeypair);
//     // setVoteBankAddress(newVoteBankKeypair.publicKey);
//     // try {
//     //   await program.methods
//     //     .init()
//     //     .accounts({
//     //       voteBank: newVoteBankKeypair.publicKey,
//     //       signer: wallet.publicKey,
//     //       systemProgram: web3.SystemProgram.programId,
//     //     })
//     //     .signers([newVoteBankKeypair])
//     //     .rpc();
//     //   console.log("Vote bank initialized with address:", newVoteBankKeypair.publicKey.toBase58());
//     //   fetchVoteBank(program, newVoteBankKeypair.publicKey); // Refresh the vote bank state
//     // } catch (error) {
//     //   console.error("Error initializing vote bank:", error);
//     //   setVoteBankKeypair(null); // Clear if init fails
//     //   setVoteBankAddress(null);
//     // }
//   };

//   const handleVote = async (voteType: "A" | "B") => {
//     // if (!program || !wallet.publicKey || !voteBankAddress) return;
//     // try {
//     //   await program.methods
//     //     .vote(voteType === "A" ? { a: {} } : { b: {} })
//     //     .accounts({
//     //       voteBank: voteBankAddress,
//     //       signer: wallet.publicKey,
//     //     })
//     //     .rpc();
//     //   console.log(`Voted for ${voteType}!`);
//     //   fetchVoteBank(program, voteBankAddress); // Refresh the vote bank state
//     // } catch (error) {
//     //   console.error(`Error voting for ${voteType}:`, error);
//     // }
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Voting App</h1>
//       {!wallet.connected && <p className="mb-4">Please connect your wallet to interact with the voting app.</p>}

//       {wallet.connected && (
//         <div className="space-y-4">
//           <button onClick={handleInitVoteBank} disabled={!program || voteBank !== null} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
//             {voteBank ? "Vote Bank Initialized" : "Initialize Vote Bank"}
//           </button>

//           {voteBank && (
//             <div className="border p-4 rounded">
//               <h2 className="text-xl font-semibold mb-2">Current Votes:</h2>
//               <p>Votes for A: {voteBank.votesA.toString()}</p>
//               <p>Votes for B: {voteBank.votesB.toString()}</p>
//               <div className="flex space-x-4 mt-4">
//                 <button onClick={() => handleVote("A")} disabled={!program} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
//                   Vote A
//                 </button>
//                 <button onClick={() => handleVote("B")} disabled={!program} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
//                   Vote B
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

export const Voting2: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      console.log("Wallet connected:", wallet.publicKey.toBase58());
    }
  }, [wallet]);

  const [votesA, setVotesA] = useState<number>(0);
  const [votesB, setVotesB] = useState<number>(0);

  const handleVote = async (type: "A" | "B") => {
    if (!wallet) return;

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const program = new Program(idl as Voting, provider);
    // Replace with your vote bank address if needed
    const voteBankAddress = "Vote111111111111111111111111111111111111111"; // Fake address
    try {
      await program.methods
        .vote(type === "A" ? { a: {} } : { b: {} })
        .accounts({
          voteBank: new PublicKey(voteBankAddress),
          signer: wallet.publicKey,
        })
        .rpc();
      if (type === "A") setVotesA(votesA + 1);
      else setVotesB(votesB + 1);
    } catch (error) {
      console.error(`Error voting for ${type}:`, error);
    }
  };

  return (
    <div
      className={css({
        bg: "background.secondary",
        color: "text.primary",
        padding: "32px",
        borderRadius: "card.borderRadius",
      })}
    >
      <p>Votes for A: {votesA}</p>
      <p>Votes for B: {votesB}</p>
      <div className={css({ display: "flex", gap: "4", marginTop: "4" })}>
        <Button onClick={() => handleVote("A")}>Vote A</Button>
        <Button onClick={() => handleVote("B")} variant="secondary">
          Vote B
        </Button>
      </div>
    </div>
  );
};

export default Voting2;
