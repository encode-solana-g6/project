import React, { useState, useEffect } from "react";
import { useAnchorWallet, useConnection, type AnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Voting } from "../../../target/types/voting";
import idl from "../../../target/idl/voting.json";
import { PublicKey } from "@solana/web3.js";
import Button from "../atoms/Button";
import { card } from "../../styled-system/recipes";
import { hstack } from "../../styled-system/patterns";
import { useConnectWallet } from "./Connect";

const programID = idl.address;

export const VotingPage: React.FC = () => {
  const { connection, wallet } = useConnectWallet();

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
      className={card({
        bg: "background.secondary",
      })}
    >
      <p>Votes for A: {votesA}</p>
      <p>Votes for B: {votesB}</p>
      <div className={hstack({ gap: "4", marginTop: "4" })}>
        <Button onClick={() => handleVote("A")}>Vote A</Button>
        <Button onClick={() => handleVote("B")} variant="secondary">
          Vote B
        </Button>
      </div>
    </div>
  );
};

export default VotingPage;
