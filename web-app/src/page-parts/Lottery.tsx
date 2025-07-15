import React, { useState, useEffect, use } from "react";
import { useAnchorWallet, useConnection, type AnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { hstack } from "../../styled-system/patterns";
import Button from "../atoms/Button";
import type { Lottery as LotteryProgram } from "../../../target/types/lottery";
import idl from "../../../target/idl/lottery.json";
import * as anchor from "@coral-xyz/anchor";
import { useConnectWallet } from "../components/Connect";
import { col, row } from "../atoms/layout";
import { css } from "../../styled-system/css";
import { heading } from "../atoms/text";
import { card } from "../atoms/Card";

const programID = new PublicKey(idl.address);

const MASTER_SEED = "master";
const LOTTERY_SEED = "lottery";
const TICKET_SEED = "ticket";

type LotteryDetails = {
  id: number;
  authority: PublicKey;
  ticketPriceSOL: number;
  lastTicketId: number;
  winnerTicketId: number | null;
  claimed: boolean;
};

export const Lottery: React.FC = () => {
  const { connection, wallet } = useConnectWallet();

  const [program, setProgram] = useState<Program<LotteryProgram> | null>(null);
  const [masterPdaAddress, setMasterPdaAddress] = useState<PublicKey | null>(null);
  const [masterPdaData, setMasterPdaData] = useState<any>(null); // To store MasterPDA data
  const [lotteries, setLotteries] = useState<Record<number, LotteryDetails>>({});
  const [selectedLottery, setSelectedLottery] = useState<LotteryDetails | null>(null);
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
    } catch (error) {
      console.log("Master PDA not initialized yet or error fetching:", error);
    }
  };
  useEffect(() => {
    if (program) {
      fetchMasterData(program);
      fetchLotteries(program); // Fetch all lotteries on program load
    }
  }, [program, masterPdaAddress]);

  const fetchLotteryDetails = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet) return;
    const idBuffer = new Uint8Array(4);
    new DataView(idBuffer.buffer).setUint32(0, lotteryId, true);
    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);

    try {
      const lotteryAccount = await program.account.lotteryPda.fetch(lotteryPda);
      console.log("Fetched lottery details:", lotteryAccount);
    } catch (error) {
      console.error(`Error fetching lottery ${lotteryId} details:`, error);
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
        const lotteryId = lotteryAccount.account.id;
        lotteries[lotteryId] = {
          id: lotteryId,
          authority: lotteryAccount.account.authority,
          ticketPriceSOL: lotteryAccount.account.ticketPriceLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL, // Convert lamports to SOL
          lastTicketId: lotteryAccount.account.lastTicketId,
          winnerTicketId: lotteryAccount.account.winnerTicketId,
          claimed: lotteryAccount.account.claimed,
        };
      }
      setLotteries(lotteries);
      console.log("Fetched lotteries:", JSON.stringify(lotteries));
      if (Object.keys(lotteries).length > 0) {
        setSelectedLottery(Object.values(lotteries)[0]);
      }
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

    // const idBuffer = new Uint8Array(4);
    // new DataView(idBuffer.buffer).setUint32(0, nextLotteryId, true); // true for little-endian
    const [lotteryAddr] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), new anchor.BN(nextLotteryId).toArrayLike(Buffer, "le", 4)], programID);
    console.log({ nextLotteryId, lotteryAddr: lotteryAddr.toBase58() });

    try {
      let txo = await program.methods
        .createLottery(new anchor.BN(ticketPrice * anchor.web3.LAMPORTS_PER_SOL))
        .accounts({
          lotteryPda: lotteryAddr,
          masterPda: masterPdaAddress,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Lottery created with transaction:", txo);

      console.log(`Lottery ${nextLotteryId} created with ticket price ${ticketPrice} SOL!`);
      await fetchMasterData(program); // Re-fetch master PDA data, which will update currentLotteryId
      await fetchLotteries(program); // Re-fetch all lotteries to update the UI
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
    if (!masterPdaData) {
      return (
        <div className={css(col, { gap: "4" })}>
          <Button onClick={() => program && initMaster(program)} disabled={!program}>
            Initialize Master PDA
          </Button>
        </div>
      );
    }

    return (
      <div
        className={css(card.raw(), {
          bg: "background.primary",
          padding: "16px",
        })}
      >
        <h3 className="font-bold">Master PDA Details</h3>
        <p>Address: {masterPdaAddress?.toBase58()}</p>
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
      <>
        <h2 className={heading({ l: 2, weight: "bold", color: "primary" })}>Lotteries</h2>
        {Object.keys(lotteries).length > 0 ? (
          <div className={css(col, { gap: "4" })}>
            {Object.values(lotteries).map((lottery) => (
              <div
                key={lottery.id}
                onClick={() => setSelectedLottery(lottery)}
                className={css({
                  ...card.raw({ size: "small", mood: selectedLottery?.id === lottery.id ? "highlight" : undefined }),
                  cursor: "pointer",
                  _hover: {
                    backgroundColor: "accent.primary",
                  },
                })}
              >
                <p>ID: {lottery.id}</p>
                <p>Ticket Price: {lottery.ticketPriceSOL} SOL</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={css({ color: "text.secondary", opacity: 0.6 })}>No lotteries created yet.</p>
        )}
      </>
    );
  };

  return (
    <div className={css(col, { gap: "4" })}>
      <h2 className={heading({ l: 1, weight: "bold", color: "primary" })}>Lottery Program UI</h2>
      <div className={css(row, { gap: "8", alignItems: "flex-start" })}>
        <div className={css(col, { gap: "4", flex: "1" })}>
          {renderMasterPdaSection()}
          {renderLotteriesSection()}
        </div>
        <div className={css({ flex: "2" })}>
          {selectedLottery && (
            <div className={css(card.raw(), { bg: "background.primary", padding: "16px" })}>
              <h3 className={heading({ l: 3, weight: "bold" })}>Lottery Details</h3>
              <p>ID: {selectedLottery.id}</p>
              <p>Authority: {selectedLottery.authority.toBase58()}</p>
              <p>Ticket Price: {selectedLottery.ticketPriceSOL} SOL</p>
              <p>Last Ticket ID: {selectedLottery.lastTicketId}</p>
              <p>Winner Ticket ID: {selectedLottery.winnerTicketId !== null ? selectedLottery.winnerTicketId : "N/A"}</p>
              <p>Claimed: {selectedLottery.claimed ? "Yes" : "No"}</p>
              <Button onClick={() => fetchLotteryDetails(program!, selectedLottery.id)}>Refresh Lottery Details</Button>
            </div>
          )}
        </div>
      </div>

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
