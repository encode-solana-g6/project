import React, { useState, useEffect } from "react";
import { useAnchorWallet, useConnection, type AnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { card } from "../../styled-system/recipes";
import { hstack } from "../../styled-system/patterns";
import Button from "../atoms/Button";
import type { Lottery as LotteryProgram } from "../../../target/types/lottery";
import idl from "../../../target/idl/lottery.json";
import * as anchor from "@coral-xyz/anchor";

const programID = new PublicKey(idl.address);

const MASTER_PDA_SEED = "master";
const LOTTERY_SEED = "lottery";
const TICKET_SEED = "ticket";

export const Lottery: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [masterPdaAddress, setMasterPdaAddress] = useState<PublicKey | null>(null);
  const [lastLotteryId, setLastLotteryId] = useState<number | null>(null);
  const [ticketPrice, setTicketPrice] = useState<number>(0.1); // Default ticket price in SOL
  const [currentLotteryId, setCurrentLotteryId] = useState<number | null>(null);
  const [currentLotteryDetails, setCurrentLotteryDetails] = useState<any>(null); // To store LotteryPDA data

  const fetchMasterPda = async () => {
    if (!wallet) return;
    const [masterPda] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_PDA_SEED)], programID);
    setMasterPdaAddress(masterPda);

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);
      const masterAccount = await program.account.masterPda.fetch(masterPda);
      setLastLotteryId(masterAccount.lastLotteryId);
      setCurrentLotteryId(masterAccount.lastLotteryId); // Set current lottery to the latest
      if (masterAccount.lastLotteryId > 0) {
        await fetchLotteryDetails(masterAccount.lastLotteryId);
      }
    } catch (error) {
      console.log("Master PDA not initialized yet or error fetching:", error);
      setLastLotteryId(0); // Assume 0 if not initialized
      setCurrentLotteryId(0);
    }
  };

  const fetchLotteryDetails = async (lotteryId: number) => {
    if (!wallet) return;
    const idBuffer = new Uint8Array(4);
    new DataView(idBuffer.buffer).setUint32(0, lotteryId, true);
    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);
      const lotteryAccount = await program.account.lotteryPda.fetch(lotteryPda);
      setCurrentLotteryDetails(lotteryAccount);
      console.log("Fetched lottery details:", lotteryAccount);
    } catch (error) {
      console.error(`Error fetching lottery ${lotteryId} details:`, error);
      setCurrentLotteryDetails(null);
    }
  };

  useEffect(() => {
    fetchMasterPda();
  }, [wallet, connection]);

  useEffect(() => {
    if (currentLotteryId !== null && currentLotteryId > 0) {
      fetchLotteryDetails(currentLotteryId);
    } else {
      setCurrentLotteryDetails(null);
    }
  }, [currentLotteryId, wallet, connection]);

  const initMaster = async () => {
    if (!wallet || !masterPdaAddress) return;

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);

      await program.methods
        .initMaster()
        .accounts({
          masterPda: masterPdaAddress,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      console.log("Master PDA initialized!");
      await fetchMasterPda(); // Re-fetch master PDA data
    } catch (error) {
      console.error("Error initializing Master PDA:", error);
    }
  };

  const createLottery = async () => {
    if (!wallet || !masterPdaAddress || lastLotteryId === null) return;

    const nextLotteryId = lastLotteryId + 1;
    const idBuffer = new Uint8Array(4);
    new DataView(idBuffer.buffer).setUint32(0, nextLotteryId, true); // true for little-endian
    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);

      await program.methods
        .createLottery(new anchor.BN(ticketPrice * anchor.web3.LAMPORTS_PER_SOL))
        .accounts({
          lotteryPda: lotteryPda,
          masterPda: masterPdaAddress,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      console.log(`Lottery ${nextLotteryId} created with ticket price ${ticketPrice} SOL!`);
      await fetchMasterPda(); // Re-fetch master PDA data, which will update currentLotteryId
    } catch (error) {
      console.error("Error creating lottery:", error);
    }
  };

  const buyTicket = async () => {
    if (!wallet || !currentLotteryDetails || currentLotteryId === null) return;

    const nextTicketId = currentLotteryDetails.lastTicketId + 1;
    const lotteryIdBuffer = new Uint8Array(4);
    new DataView(lotteryIdBuffer.buffer).setUint32(0, currentLotteryId, true);

    const ticketIdBuffer = new Uint8Array(4);
    new DataView(ticketIdBuffer.buffer).setUint32(0, nextTicketId, true);

    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

    const [ticketPda] = PublicKey.findProgramAddressSync([Buffer.from(TICKET_SEED), lotteryPda.toBuffer(), Buffer.from(ticketIdBuffer)], programID);

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);

      await program.methods
        .buyTicket(currentLotteryId)
        .accounts({
          ticketPda: ticketPda,
          lotteryPda: lotteryPda,
          buyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      console.log(`Ticket ${nextTicketId} bought for lottery ${currentLotteryId}!`);
      await fetchLotteryDetails(currentLotteryId); // Refresh lottery details
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  const pickWinner = async () => {
    if (!wallet || !currentLotteryDetails || currentLotteryId === null) return;

    const lotteryIdBuffer = new Uint8Array(4);
    new DataView(lotteryIdBuffer.buffer).setUint32(0, currentLotteryId, true);

    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);

      await (program.methods as any)
        .pickWinner(currentLotteryId)
        .accounts({
          lotteryPda: lotteryPda,
          authority: wallet.publicKey,
        } as any)
        .rpc();

      console.log(`Winner picked for lottery ${currentLotteryId}!`);
      await fetchLotteryDetails(currentLotteryId); // Refresh lottery details
    } catch (error) {
      console.error("Error picking winner:", error);
    }
  };

  return (
    <div
      className={card({
        bg: "background.secondary",
      })}
    >
      <h2>Lottery Program UI</h2>
      <p>Master PDA Address: {masterPdaAddress ? masterPdaAddress.toBase58() : "Loading..."}</p>
      <p>Last Lottery ID: {lastLotteryId !== null ? lastLotteryId : "Loading..."}</p>

      <div className={hstack({ gap: "4", marginTop: "4" })}>
        <Button onClick={initMaster} disabled={lastLotteryId !== 0 && lastLotteryId !== null}>
          Initialize Master PDA
        </Button>
      </div>

      <div className={hstack({ gap: "4", marginTop: "4" })}>
        <input
          type="number"
          step="0.01"
          value={ticketPrice}
          onChange={(e) => setTicketPrice(parseFloat(e.target.value))}
          placeholder="Ticket Price (SOL)"
          className="p-2 border rounded"
        />
        <Button onClick={createLottery} disabled={lastLotteryId === null}>
          Create New Lottery
        </Button>
      </div>

      <h3 className="mt-4 text-lg font-bold">Current Lottery ({currentLotteryId !== null ? currentLotteryId : "N/A"})</h3>
      {currentLotteryDetails ? (
        <div className="mt-2 p-2 border rounded">
          <p>ID: {currentLotteryDetails.id}</p>
          <p>Authority: {currentLotteryDetails.authority.toBase58()}</p>
          <p>Ticket Price: {currentLotteryDetails.ticketPrice.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL</p>
          <p>Last Ticket ID: {currentLotteryDetails.lastTicketId}</p>
          <p>Winner Ticket ID: {currentLotteryDetails.winnerTicketId ? currentLotteryDetails.winnerTicketId : "N/A"}</p>
          <p>Claimed: {currentLotteryDetails.claimed ? "Yes" : "No"}</p>
          <div className={hstack({ gap: "4", marginTop: "4" })}>
            <input
              type="number"
              value={currentLotteryId || ""}
              onChange={(e) => setCurrentLotteryId(parseInt(e.target.value) || null)}
              placeholder="Lottery ID"
              className="p-2 border rounded"
            />
            <Button onClick={() => currentLotteryId && fetchLotteryDetails(currentLotteryId)}>Refresh Lottery Details</Button>
          </div>
          <div className={hstack({ gap: "4", marginTop: "4" })}>
            <Button onClick={buyTicket} disabled={currentLotteryDetails.winnerTicketId !== null}>
              Buy Ticket
            </Button>
            <Button onClick={pickWinner} disabled={currentLotteryDetails.winnerTicketId !== null}>
              Pick Winner
            </Button>
          </div>
        </div>
      ) : (
        <p>No lottery selected or details available.</p>
      )}
    </div>
  );
};

export default Lottery;
