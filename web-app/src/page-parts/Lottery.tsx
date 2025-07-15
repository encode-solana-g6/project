import React, { useState, useEffect } from "react";
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
  totalPrizeSOL: number;
};

export const Lottery: React.FC<{ initialLotteryId: number | null }> = ({ initialLotteryId }) => {
  const { connection, wallet } = useConnectWallet();

  const [program, setProgram] = useState<Program<LotteryProgram> | null>(null);
  const [masterPdaAddress, setMasterPdaAddress] = useState<PublicKey | null>(null);
  const [masterPdaData, setMasterPdaData] = useState<any>(null); // To store MasterPDA data
  const [lotteries, setLotteries] = useState<Record<number, LotteryDetails>>({});
  const [selectedLotteryId, setSelectedLotteryId] = useState<number | null>(initialLotteryId);
  const [ticketPrice, setTicketPrice] = useState<number>(0.1); // Default ticket price in SOL

  // Effect to initialize program
  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const lotteryProgram = new Program(idl as LotteryProgram, provider);
      setProgram(lotteryProgram);
    } else {
      setProgram(null);
    }
  }, [wallet, connection]);

  // Effect to fetch master data when program is available or masterPdaAddress changes
  useEffect(() => {
    const fetchMasterData = async () => {
      if (!program) return;

      let currentMasterPdaAddress = masterPdaAddress;
      if (!currentMasterPdaAddress) {
        [currentMasterPdaAddress] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], programID);
        setMasterPdaAddress(currentMasterPdaAddress);
      }

      try {
        const masterPdaData = await program.account.masterPda.fetch(currentMasterPdaAddress);
        setMasterPdaData(masterPdaData);
      } catch (error) {
        console.log("Master PDA not initialized yet or error fetching:", error);
        setMasterPdaData(null); // Ensure masterPdaData is null if not initialized/found
      }
    };
    fetchMasterData();
  }, [program, masterPdaAddress]); // masterPdaAddress added to dependency to re-fetch if it changes

  // Function to fetch lotteries up to the latest known ID
  const fetchLotteries = async (program: Program<LotteryProgram>) => {
    if (!wallet || !masterPdaData) {
      // Ensure masterPdaData is available
      console.error("Wallet or Master PDA data not available for fetching lotteries.");
      return;
    }

    const fetchedLotteries: Record<number, LotteryDetails> = {};
    const lastLotteryId = masterPdaData.lastLotteryId; // Get the latest known lottery ID

    for (let i = 1; i <= lastLotteryId; i++) {
      // Iterate from 1 up to lastLotteryId
      const idBuffer = new Uint8Array(4);
      new DataView(idBuffer.buffer).setUint32(0, i, true);
      const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);

      try {
        const lotteryAccount = await program.account.lotteryPda.fetch(lotteryPda);
        fetchedLotteries[i] = {
          id: i,
          authority: lotteryAccount.authority,
          ticketPriceSOL: lotteryAccount.ticketPriceLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
          lastTicketId: lotteryAccount.lastTicketId,
          winnerTicketId: lotteryAccount.winnerTicketId,
          claimed: lotteryAccount.claimed,
          totalPrizeSOL: lotteryAccount.lastTicketId * (lotteryAccount.ticketPriceLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL),
        };
      } catch (error) {
        // This is expected if a lottery was not created or closed
        console.warn(`Lottery ${i} (PDA: ${lotteryPda.toBase58()}) not found or error fetching:`, error);
      }
    }
    setLotteries(fetchedLotteries);
    console.log("Fetched lotteries:", JSON.stringify(fetchedLotteries));
    if (Object.keys(fetchedLotteries).length > 0) {
      if (!selectedLotteryId || !fetchedLotteries[selectedLotteryId]) {
        setSelectedLotteryId(Object.values(fetchedLotteries)[0].id);
      }
    } else {
      setSelectedLotteryId(null);
    }
  };

  // Effect to fetch lotteries when program or masterPdaData changes
  useEffect(() => {
    if (program && masterPdaData) {
      // Only fetch lotteries if both are available
      fetchLotteries(program);
    }
  }, [program, masterPdaData]); // Depend on masterPdaData to re-fetch when it updates

  const initMaster = async (program: Program<LotteryProgram>) => {
    if (!wallet) {
      console.error("Wallet address not available.");
      return;
    }

    const [masterPda] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], programID);
    setMasterPdaAddress(masterPda); // Set this here so the useEffect for masterData can pick it up

    try {
      let txo = await program.methods
        .initMaster()
        .accounts({
          masterPda: masterPda, // Use the locally derived masterPda
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Master PDA initialized with transaction:", txo);

      // The useEffect hooks will handle re-fetching master data and lotteries
    } catch (error) {
      console.error("Error initializing Master PDA:", error);
    }
  };

  const createLottery = async (program: Program<LotteryProgram>) => {
    if (!wallet || !masterPdaData) return; // Ensure masterPdaData is available

    const nextLotteryId = masterPdaData.lastLotteryId + 1;

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
      setLotteries((prev) => ({
        ...prev,
        [nextLotteryId]: {
          id: nextLotteryId,
          authority: wallet.publicKey,
          ticketPriceSOL: ticketPrice,
          lastTicketId: 0,
          winnerTicketId: null,
          claimed: false,
          totalPrizeSOL: 0,
        },
      }));

      console.log(`Lottery ${nextLotteryId} created with ticket price ${ticketPrice} SOL!`);
      // The useEffect hooks will handle re-fetching master data and lotteries
    } catch (error) {
      console.error("Error creating lottery:", error);
    }
  };

  const buyTicket = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet || selectedLotteryId === null) return;
    const selectedLottery = lotteries[selectedLotteryId];
    if (!selectedLottery) return;

    const nextTicketId = selectedLottery.lastTicketId + 1;
    const lotteryIdBuffer = new Uint8Array(4);
    new DataView(lotteryIdBuffer.buffer).setUint32(0, lotteryId, true);

    const ticketIdBuffer = new Uint8Array(4);
    new DataView(ticketIdBuffer.buffer).setUint32(0, nextTicketId, true);

    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

    const [ticketPda] = PublicKey.findProgramAddressSync([Buffer.from(TICKET_SEED), lotteryPda.toBuffer(), Buffer.from(ticketIdBuffer)], programID);

    try {
      await program.methods
        .buyTicket(lotteryId)
        .accounts({
          ticketPda: ticketPda,
          lotteryPda: lotteryPda,
          buyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      console.log(`Ticket ${nextTicketId} bought for lottery ${lotteryId}!`);
      fetchLotteries(program); // Refresh lottery details
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  const pickWinner = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet || selectedLotteryId === null) return;
    const selectedLottery = lotteries[selectedLotteryId];
    if (!selectedLottery) return;

    const lotteryIdBuffer = new Uint8Array(4);
    new DataView(lotteryIdBuffer.buffer).setUint32(0, lotteryId, true);

    const [lotteryPda] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(lotteryIdBuffer)], programID);

    try {
      await (program.methods as any)
        .pickWinner(lotteryId)
        .accounts({
          lotteryPda: lotteryPda,
          authority: wallet.publicKey,
        } as any)
        .rpc();

      console.log(`Winner picked for lottery ${lotteryId}!`);
      fetchLotteries(program); // Refresh lottery details
    } catch (error) {
      console.error("Error picking winner:", error);
    }
  };

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
        <div className={hstack({ gap: "1", flexShrink: 1, minWidth: 0, flexWrap: "wrap" })}>
          <p>Address:</p>
          <p className={css({ overflow: "hidden", textOverflow: "ellipsis", wordBreak: "break-all", minWidth: 0 })}>
            {masterPdaAddress?.toBase58().slice(0, 4)}...{masterPdaAddress?.toBase58().slice(-4)}
          </p>
        </div>
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
                onClick={() => setSelectedLotteryId(lottery.id)}
                className={css({
                  ...card.raw({ size: "small", mood: selectedLotteryId === lottery.id ? "highlight" : undefined }),
                  cursor: "pointer",
                  _hover: {
                    backgroundColor: "accent.primary",
                  },
                })}
              >
                <div className={hstack({ gap: "2", alignItems: "baseline", justifyContent: "space-between", minWidth: 0 })}>
                  <p>Lottery {lottery.id}</p>
                  <h4 className={heading({ l: 5, weight: "semibold" })}>Total Prize: {lottery.totalPrizeSOL} SOL</h4>
                </div>
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
        <div className={css(col, { gap: "4", flexGrow: 1, flexShrink: 2, flexBasis: "50%" })}>
          {renderMasterPdaSection()}
          {renderLotteriesSection()}
        </div>
        <div className={css({ flexGrow: 1, flexShrink: 1, flexBasis: "100%" })}>
          {selectedLotteryId !== null && lotteries[selectedLotteryId] && (
            <div className={css(card.raw(), { bg: "background.primary", padding: "16px" })}>
              <h3 className={heading({ l: 3, weight: "bold" })}>Lottery {lotteries[selectedLotteryId].id}</h3>
              <h4 className={heading({ l: 5, weight: "semibold" })}>Total Prize: {lotteries[selectedLotteryId].totalPrizeSOL} SOL</h4>
              <p className={css({ wordBreak: "break-all" })}>
                Authority: {lotteries[selectedLotteryId].authority.toBase58().slice(0, 4)}...{lotteries[selectedLotteryId].authority.toBase58().slice(-4)}
              </p>
              <p>Ticket Price: {lotteries[selectedLotteryId].ticketPriceSOL} SOL</p>
              <p>Last Ticket ID: {lotteries[selectedLotteryId].lastTicketId}</p>
              <p>Winner Ticket ID: {lotteries[selectedLotteryId].winnerTicketId !== null ? lotteries[selectedLotteryId].winnerTicketId : "N/A"}</p>
              <p>Claimed: {lotteries[selectedLotteryId].claimed ? "Yes" : "No"}</p>
              <div className={hstack({ gap: "4", marginTop: "4", minWidth: 0 })}>
                <Button onClick={() => program && buyTicket(program, lotteries[selectedLotteryId].id)} disabled={lotteries[selectedLotteryId].winnerTicketId !== null}>
                  Buy Ticket
                </Button>
                <Button onClick={() => program && pickWinner(program, lotteries[selectedLotteryId].id)} disabled={lotteries[selectedLotteryId].winnerTicketId !== null}>
                  Pick Winner
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lottery;
