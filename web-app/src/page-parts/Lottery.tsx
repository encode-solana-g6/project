import React, { useState, useEffect, use } from "react";
import { useAnchorWallet, useConnection, type AnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { card } from "../../styled-system/recipes";
import { hstack } from "../../styled-system/patterns";
import Button from "../atoms/Button";
import type { Lottery as LotteryProgram } from "../../../target/types/lottery";
import idl from "../../../target/idl/lottery.json";
import * as anchor from "@coral-xyz/anchor";
import { useConnectWallet } from "../components/Connect";
import { col } from "../atoms/layout";
import { css } from "../../styled-system/css";

const programID = new PublicKey(idl.address);

const MASTER_SEED = "master";
const LOTTERY_SEED = "lottery";
const TICKET_SEED = "ticket";

export const Lottery: React.FC = () => {
  const { connection, wallet } = useConnectWallet();

  const [program, setProgram] = useState<Program<LotteryProgram> | null>(null);
  const [masterPdaAddress, setMasterPdaAddress] = useState<PublicKey | null>(null);
  const [masterPdaData, setMasterPdaData] = useState<any>(null); // To store MasterPDA data
  const [lastLotteryId, setLastLotteryId] = useState<number | null>(null);
  const [ticketPrice, setTicketPrice] = useState<number>(0.1); // Default ticket price in SOL
  const [currentLotteryId, setCurrentLotteryId] = useState<number | null>(null);
  const [currentLotteryDetails, setCurrentLotteryDetails] = useState<any>(null); // To store LotteryPDA data

  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const lotteryProgram = new Program(idl as LotteryProgram, provider);
      setProgram(lotteryProgram);
    } else {
      setProgram(null);
    }
  }, [wallet, connection]);

  const fetchMasterData = async (program: Program<LotteryProgram>) => {
    if (!wallet) {
      console.error("Wallet not available.");
      return;
    }
    if (!masterPdaAddress) {
      const [masterPdaAddr] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], programID);
      setMasterPdaAddress(masterPdaAddr);
      return;
    }

    try {
      const masterPdaData = await program.account.masterPda.fetch(masterPdaAddress!);
      setMasterPdaData(masterPdaData);
      // TODO do we need this ? we could just use masterPdaData.lastLotteryId
      // setLastLotteryId(masterPdaData.lastLotteryId);
      // setCurrentLotteryId(masterPdaData.lastLotteryId); // Set current lottery to the latest
      if (masterPdaData.lastLotteryId > 0) {
        await fetchLotteryDetails(program, masterPdaData.lastLotteryId);
      }
    } catch (error) {
      console.log("Master PDA not initialized yet or error fetching:", error);
      setLastLotteryId(0); // Assume 0 if not initialized
      setCurrentLotteryId(0);
    }
  };
  useEffect(() => {
    if (program) {
      fetchMasterData(program);
    }
  }, [program, masterPdaAddress]);

  const fetchLotteryDetails = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet) return;
    const idBuffer = new Uint8Array(4);
    new DataView(idBuffer.buffer).setUint32(0, lotteryId, true);
    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);

    try {
      const lotteryAccount = await program.account.lotteryPda.fetch(lotteryPda);
      setCurrentLotteryDetails(lotteryAccount);
      console.log("Fetched lottery details:", lotteryAccount);
    } catch (error) {
      console.error(`Error fetching lottery ${lotteryId} details:`, error);
      setCurrentLotteryDetails(null);
    }
  };

  const initMaster = async (program: Program<LotteryProgram>) => {
    if (!wallet) {
      console.error("Wallet address not available.");
      return;
    }

    const [masterPda] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], programID);
    setMasterPdaAddress(masterPda);

    try {
      let txo = await program.methods
        .initMaster()
        .accounts({
          masterPda: masterPdaAddress,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Master PDA initialized with transaction:", txo);

      await fetchMasterData(program); // Re-fetch master PDA data
    } catch (error) {
      console.error("Error initializing Master PDA:", error);
    }
  };

  const createLottery = async (program: Program<LotteryProgram>) => {
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
      await fetchMasterData(program); // Re-fetch master PDA data, which will update currentLotteryId
    } catch (error) {
      console.error("Error creating lottery:", error);
    }
  };

  const buyTicket = async (program: Program<LotteryProgram>) => {
    if (!wallet || !currentLotteryDetails || currentLotteryId === null) return;

    const nextTicketId = currentLotteryDetails.lastTicketId + 1;
    const lotteryIdBuffer = new Uint8Array(4);
    new DataView(lotteryIdBuffer.buffer).setUint32(0, currentLotteryId, true);

    const ticketIdBuffer = new Uint8Array(4);
    new DataView(ticketIdBuffer.buffer).setUint32(0, nextTicketId, true);

    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

    const [ticketPda] = PublicKey.findProgramAddressSync([Buffer.from(TICKET_SEED), lotteryPda.toBuffer(), Buffer.from(ticketIdBuffer)], programID);

    try {
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
      await fetchLotteryDetails(program, currentLotteryId); // Refresh lottery details
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  const pickWinner = async (program: Program<LotteryProgram>) => {
    if (!wallet || !currentLotteryDetails || currentLotteryId === null) return;

    const lotteryIdBuffer = new Uint8Array(4);
    new DataView(lotteryIdBuffer.buffer).setUint32(0, currentLotteryId, true);

    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

    try {
      await (program.methods as any)
        .pickWinner(currentLotteryId)
        .accounts({
          lotteryPda: lotteryPda,
          authority: wallet.publicKey,
        } as any)
        .rpc();

      console.log(`Winner picked for lottery ${currentLotteryId}!`);
      await fetchLotteryDetails(program, currentLotteryId); // Refresh lottery details
    } catch (error) {
      console.error("Error picking winner:", error);
    }
  };

  const renderMasterPdaSection = () => {
    if (!masterPdaAddress) {
      return (
        <div className={css(col, { gap: "4", marginTop: "4" })}>
          <Button onClick={() => program && initMaster(program)} disabled={!program}>
            Initialize Master PDA
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-2 p-2 border rounded">
        <h3 className="font-bold">Master PDA Details</h3>
        <p>Address: {masterPdaAddress.toBase58()}</p>
        {masterPdaData && (
          <>
            <p>Last Lottery ID: {masterPdaData.lastLotteryId}</p>
            <Button onClick={() => createLottery(program!)}>Create Next Lottery</Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className={card({
        bg: "background.secondary",
      })}
    >
      <h2>Lottery Program UI</h2>
      {renderMasterPdaSection()}

      <div className={hstack({ gap: "4", marginTop: "4" })}>
        <input
          type="number"
          step="0.01"
          value={ticketPrice}
          onChange={(e) => setTicketPrice(parseFloat(e.target.value))}
          placeholder="Ticket Price (SOL)"
          className="p-2 border rounded"
        />
        <Button onClick={() => createLottery(program!)} disabled={lastLotteryId === null}>
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
            <Button onClick={() => currentLotteryId && fetchLotteryDetails(program!, currentLotteryId)}>Refresh Lottery Details</Button>
          </div>
          <div className={hstack({ gap: "4", marginTop: "4" })}>
            <Button onClick={() => buyTicket(program!)} disabled={currentLotteryDetails.winnerTicketId !== null}>
              Buy Ticket
            </Button>
            <Button onClick={() => pickWinner(program!)} disabled={currentLotteryDetails.winnerTicketId !== null}>
              Pick Winner
            </Button>
          </div>
        </div>
      ) : (
        <p className={css({ color: "text.secondary", opacity: 0.6 })}>No lottery selected or details available.</p>
      )}
    </div>
  );
};

export default Lottery;
