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
import { heading } from "../atoms/text";

const programID = new PublicKey(idl.address);

const MASTER_SEED = "master";
const LOTTERY_SEED = "lottery";
const TICKET_SEED = "ticket";

type LotteryDetails = {
  id: number;
  authority: PublicKey;
  ticketPrice: anchor.BN;
  lastTicketId: number;
  winnerTicketId: number | null;
  claimed: boolean;
  // Add other fields as needed from your IDL
};

export const Lottery: React.FC = () => {
  const { connection, wallet } = useConnectWallet();

  const [program, setProgram] = useState<Program<LotteryProgram> | null>(null);
  const [masterPdaAddress, setMasterPdaAddress] = useState<PublicKey | null>(null);
  const [masterPdaData, setMasterPdaData] = useState<any>(null); // To store MasterPDA data
  const [lotteries, setLotteries] = useState<Record<number, LotteryDetails>>({});
  const [ticketPrice, setTicketPrice] = useState<number>(0.1); // Default ticket price in SOL

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
      // setLastLotteryId(0); // Assume 0 if not initialized
      // setCurrentLotteryId(0);
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
      // setCurrentLotteryDetails(lotteryAccount);
      console.log("Fetched lottery details:", lotteryAccount);
    } catch (error) {
      console.error(`Error fetching lottery ${lotteryId} details:`, error);
      // setCurrentLotteryDetails(null);
    }
  };
  const fetchLotteries = async (program: Program<LotteryProgram>) => {
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
      const lotteryAccounts = await program.account.lotteryPda.all();
      const lotteries: Record<number, LotteryDetails> = {};
      for (const lotteryAccount of lotteryAccounts) {
        const lotteryId = lotteryAccount.account.id.toNumber();
        lotteries[lotteryId] = {
          id: lotteryId,
          authority: lotteryAccount.account.authority,
          ticketPrice: lotteryAccount.account.ticketPrice,
          lastTicketId: lotteryAccount.account.lastTicketId.toNumber(),
          winnerTicketId: lotteryAccount.account.winnerTicketId ? lotteryAccount.account.winnerTicketId.toNumber() : null,
          claimed: lotteryAccount.account.claimed,
        };
      }
      setLotteries(lotteries);
      console.log("Fetched lotteries:", lotteries);
    } catch (error) {
      console.error("Error fetching lotteries:", error);
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
    if (!wallet || !masterPdaAddress) return;

    const nextLotteryId = masterPdaData.lastLotteryId + 1;
    const idBuffer = new Uint8Array(4);
    new DataView(idBuffer.buffer).setUint32(0, nextLotteryId, true); // true for little-endian
    const [lotteryAddr] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);
    console.log({ nextLotteryId, lotteryAddr });

    try {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const program = new Program(idl as LotteryProgram, provider);

      await program.methods
        .createLottery(new anchor.BN(ticketPrice * anchor.web3.LAMPORTS_PER_SOL))
        .accounts({
          lotteryPda: lotteryAddr,
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

  // const buyTicket = async (program: Program<LotteryProgram>) => {
  //   if (!wallet) return;

  //   const nextTicketId = currentLotteryDetails.lastTicketId + 1;
  //   const lotteryIdBuffer = new Uint8Array(4);
  //   new DataView(lotteryIdBuffer.buffer).setUint32(0, currentLotteryId, true);

  //   const ticketIdBuffer = new Uint8Array(4);
  //   new DataView(ticketIdBuffer.buffer).setUint32(0, nextTicketId, true);

  //   const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

  //   const [ticketPda] = PublicKey.findProgramAddressSync([Buffer.from(TICKET_SEED), lotteryPda.toBuffer(), Buffer.from(ticketIdBuffer)], programID);

  //   try {
  //     await program.methods
  //       .buyTicket(currentLotteryId)
  //       .accounts({
  //         ticketPda: ticketPda,
  //         lotteryPda: lotteryPda,
  //         buyer: wallet.publicKey,
  //         systemProgram: SystemProgram.programId,
  //       } as any)
  //       .rpc();

  //     console.log(`Ticket ${nextTicketId} bought for lottery ${currentLotteryId}!`);
  //     await fetchLotteryDetails(program, currentLotteryId); // Refresh lottery details
  //   } catch (error) {
  //     console.error("Error buying ticket:", error);
  //   }
  // };

  // const pickWinner = async (program: Program<LotteryProgram>) => {
  //   if (!wallet || !currentLotteryDetails || currentLotteryId === null) return;

  //   const lotteryIdBuffer = new Uint8Array(4);
  //   new DataView(lotteryIdBuffer.buffer).setUint32(0, currentLotteryId, true);

  //   const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

  //   try {
  //     await (program.methods as any)
  //       .pickWinner(currentLotteryId)
  //       .accounts({
  //         lotteryPda: lotteryPda,
  //         authority: wallet.publicKey,
  //       } as any)
  //       .rpc();

  //     console.log(`Winner picked for lottery ${currentLotteryId}!`);
  //     await fetchLotteryDetails(program, currentLotteryId); // Refresh lottery details
  //   } catch (error) {
  //     console.error("Error picking winner:", error);
  //   }
  // };

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
      <div
        className={card({
          bg: "background.primary",
          padding: "16px",
          marginTop: "16px",
        })}
      >
        <h3 className="font-bold">Master PDA Details</h3>
        <p>Address: {masterPdaAddress.toBase58()}</p>
        {masterPdaData && (
          <>
            <p>Last Lottery ID: {masterPdaData.lastLotteryId}</p>
            <Button onClick={async () => await createLottery(program!)}>Create Next Lottery</Button>
          </>
        )}
      </div>
    );
  };

  const renderLotteriesSection = () => {
    if (!program || !masterPdaAddress) {
      return <p className={css({ color: "text.secondary", opacity: 0.6 })}>Loading lotteries...</p>;
    }

    return (
      <div>
        <h3 className="mt-4 text-lg font-bold">Lotteries</h3>
        {masterPdaData?.lastLotteryId > 0 ? (
          <div className={css(col, { gap: "4" })}>
            {[...Array(masterPdaData.lastLotteryId)].map((_, i) => (
              <div key={i} className={css(col, { gap: "4" })}>
                <div className={card({ bg: "background.primary", padding: "16px", marginTop: "16px" })}>
                  <p>ID: {i + 1}</p>
                  <Button onClick={() => fetchLotteryDetails(program, i + 1)}>Refresh Lottery Details</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={css({ color: "text.secondary", opacity: 0.6 })}>No lotteries created yet.</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className={heading({ l: 1, weight: "bold", color: "primary" })}>Lottery Program UI</h2>
      {renderMasterPdaSection()}
      {renderLotteriesSection()}

      {/* {currentLotteryDetails ? (
        <div
          className={card({
            bg: "background.primary",
            padding: "16px",
            marginTop: "16px",
          })}
        >
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
      )} */}
    </div>
  );
};

export default Lottery;
