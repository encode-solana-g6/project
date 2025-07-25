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

function getMasterAddr(programID: PublicKey): PublicKey {
  const [masterAddr] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], programID);
  return masterAddr;
}

function getLotteryKey(programID: PublicKey, lotteryId: number): PublicKey {
  // const idBuffer = new Uint8Array(4);
  // new DataView(idBuffer.buffer).setUint32(0, lotteryId, true);
  // return PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), Buffer.from(idBuffer)], programID);

  const [lotteryAddr] = PublicKey.findProgramAddressSync([Buffer.from(LOTTERY_SEED), new anchor.BN(lotteryId).toArrayLike(Buffer, "le", 4)], programID);
  return lotteryAddr;
}

function getTicketKey(programID: PublicKey, lotteryAddr: PublicKey, ticketId: number): PublicKey {
  // const ticketIdBuffer = new Uint8Array(4);
  // new DataView(ticketIdBuffer.buffer).setUint32(0, ticketId, true);
  // return PublicKey.findProgramAddressSync([Buffer.from(TICKET_SEED), lotteryPda.toBuffer(), Buffer.from(ticketIdBuffer)], programID);
  const [ticketAddr] = PublicKey.findProgramAddressSync([Buffer.from(TICKET_SEED), lotteryAddr.toBuffer(), new anchor.BN(ticketId).toArrayLike(Buffer, "le", 4)], programID);
  return ticketAddr;
}

class LotteryDetails {
  id: number;
  address: PublicKey;
  authority: PublicKey;
  ticketPriceSOL: number;
  lastTicketId: number;
  winnerTicketId: number | null;
  claimed: boolean;
  totalPrizeSOL: number;

  constructor(params: { id: number; authority: PublicKey; ticketPriceSOL: number; lastTicketId: number; winnerTicketId: number | null; claimed: boolean; totalPrizeSOL: number }) {
    this.id = params.id;
    this.address = getLotteryKey(programID, params.id);
    this.authority = params.authority;
    this.ticketPriceSOL = params.ticketPriceSOL;
    this.lastTicketId = params.lastTicketId;
    this.winnerTicketId = params.winnerTicketId;
    this.claimed = params.claimed;
    this.totalPrizeSOL = params.totalPrizeSOL;
  }
}

export const Lottery: React.FC<{ initialLotteryId: number | null }> = ({ initialLotteryId }) => {
  const { connection, wallet } = useConnectWallet();

  const [program, setProgram] = useState<Program<LotteryProgram> | null>(null);
  const [isMasterInitialized, setIsMasterInitialized] = useState<boolean>(false);
  const [masterPdaAddress, setMasterPdaAddress] = useState<PublicKey | null>(null);
  const [masterPdaData, setMasterPdaData] = useState<any>(null);
  const [lotteries, setLotteries] = useState<Record<number, LotteryDetails>>({});
  const [selectedLotteryId, setSelectedLotteryId] = useState<number | null>(initialLotteryId);
  const [ticketPrice, setTicketPrice] = useState<number>(0.1); // Default ticket price in SOL

  // Auto-set program once connected
  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
      const lotteryProgram = new Program(idl as LotteryProgram, provider);
      setProgram(lotteryProgram);
    } else {
      setProgram(null);
    }
  }, [wallet, connection]);

  const fetchMasterData = async () => {
    if (!program) {
      setMasterPdaData(null);
      return;
    }

    if (!masterPdaAddress) {
      const [masterPdaAddress] = PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], programID);
      setMasterPdaAddress(masterPdaAddress);
      return;
    }

    try {
      const masterPdaData = await program.account.masterPda.fetch(masterPdaAddress!);
      console.log("Fetched Master PDA data:", masterPdaData);
      setMasterPdaData(masterPdaData);
      setIsMasterInitialized(true);
    } catch (error) {
      console.log("Master PDA not initialized yet or error fetching:", error);
      setMasterPdaData(null); // Ensure masterPdaData is null if not initialized/found
    }
  };
  useEffect(() => {
    fetchMasterData();
  }, [program, isMasterInitialized, masterPdaAddress]);

  // Function to fetch lotteries up to the latest known ID
  const fetchLotteries = async (program: Program<LotteryProgram>) => {
    if (!wallet || !masterPdaData) {
      console.error("Wallet or Master PDA data not available for fetching lotteries.");
      return;
    }

    const fetchedLotteries: Record<number, LotteryDetails> = {};
    const lastLotteryId = masterPdaData.lastLotteryId; // Get the latest known lottery ID

    for (let lotteryId = 1; lotteryId <= lastLotteryId; lotteryId++) {
      const lotteryAddr = getLotteryKey(programID, lotteryId);
      try {
        const lotteryAccount = await program.account.lotteryPda.fetch(lotteryAddr);
        const ticketPriceSOL = lotteryAccount.ticketPriceLamports.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
        fetchedLotteries[lotteryId] = {
          id: lotteryId,
          address: lotteryAddr,
          authority: lotteryAccount.authority,
          ticketPriceSOL: ticketPriceSOL,
          lastTicketId: lotteryAccount.lastTicketId,
          winnerTicketId: lotteryAccount.winnerTicketId,
          claimed: lotteryAccount.claimed,
          totalPrizeSOL: lotteryAccount.lastTicketId * ticketPriceSOL,
        };
      } catch (error) {
        // This is expected if a lottery was not created or closed
        console.warn(`Lottery ${lotteryId} (PDA: ${lotteryAddr.toBase58()}) not found or error fetching:`, error);
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
  }, [program, masterPdaData]);

  const initMaster = async (program: Program<LotteryProgram>) => {
    if (!wallet) {
      console.error("Wallet address not available.");
      return;
    }

    const masterPda = getMasterAddr(programID);
    setMasterPdaAddress(masterPda);

    try {
      let txo = await program.methods
        .initMaster()
        .accounts({
          masterPda: masterPda,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Master PDA initialized with transaction:", txo);
      setIsMasterInitialized(true);

      // The useEffect hooks will handle re-fetching master data and lotteries
    } catch (error) {
      console.error("Error initializing Master PDA:", error);
    }
  };

  const createLottery = async (program: Program<LotteryProgram>) => {
    if (!wallet) return;

    await fetchMasterData();
    const nextLotteryId = masterPdaData.lastLotteryId + 1;

    const lotteryAddr = getLotteryKey(programID, nextLotteryId);
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
          address: lotteryAddr,
          authority: wallet.publicKey,
          ticketPriceSOL: ticketPrice,
          lastTicketId: 0,
          winnerTicketId: null,
          claimed: false,
          totalPrizeSOL: 0,
        },
      }));

      console.log(`Lottery ${nextLotteryId} created with ticket price ${ticketPrice} SOL!`);
      setSelectedLotteryId(nextLotteryId);
      await fetchMasterData();
    } catch (error) {
      console.error("Error creating lottery:", error);
    }
  };

  const buyTicket = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet || selectedLotteryId === null) return;
    const selectedLottery = lotteries[selectedLotteryId];
    if (!selectedLottery) return;

    const nextTicketId = selectedLottery.lastTicketId + 1;
    const lotteryAddr = getLotteryKey(programID, lotteryId);
    const ticketPda = getTicketKey(programID, lotteryAddr, nextTicketId);

    try {
      let txo = await program.methods
        .buyTicket()
        .accounts({
          ticketPda: ticketPda,
          lotteryPda: lotteryAddr,
          buyer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Ticket bought with transaction:", txo);
      console.log(`Ticket ${nextTicketId} bought for lottery ${lotteryId}!`);
      fetchLotteries(program);
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  const pickWinner = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet || selectedLotteryId === null) {
      console.error("Wallet not connected or no lottery selected.");
      return;
    }
    const lottery = lotteries[selectedLotteryId];
    if (!lottery) {
      console.error("Selected invalid lottery ID.");
      return;
    }

    const lotteryKey = getLotteryKey(programID, lotteryId);
    try {
      let txo = await (program.methods as any)
        .pickWinner()
        .accounts({
          lotteryPda: lotteryKey,
          authority: wallet.publicKey,
        } as any)
        .rpc();
      console.log(`Winner picked for lottery ${lotteryId}!`);
      fetchLotteries(program); // Refresh lottery details
    } catch (error: any) {
      console.error("Error picking winner:", error, error.logs);
      if (error && error.logs && Array.isArray(error.logs)) {
        console.group(`Error logs for picking winner (lottery ${lotteryId}):`);
        error.logs.forEach((log: string, idx: number) => {
          console.error(`Log ${idx + 1}:`, log);
        });
        console.groupEnd();
      }
    }
  };

  const claimPrize = async (program: Program<LotteryProgram>, lotteryId: number) => {
    if (!wallet || selectedLotteryId === null) {
      console.error("Wallet not connected or no lottery selected.");
      return;
    }
    const lottery = lotteries[selectedLotteryId];
    if (!lottery) {
      console.error("Selected invalid lottery ID.");
      return;
    }
    const lotteryKey = getLotteryKey(programID, lotteryId);
    try {
      let txo = await (program.methods as any)
        .claimPrize()
        .accounts({
          lotteryPda: lotteryKey,
          winnerTicket: getTicketKey(programID, lotteryKey, lottery.winnerTicketId!),
          winner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log(`Winner claimed for lottery ${lotteryId}!`);
      fetchLotteries(program); // Refresh lottery details
    } catch (error: any) {
      console.error("Error claiming prize:", error, error.logs);
      if (error && error.logs && Array.isArray(error.logs)) {
        console.group(`Error logs for claiming prize (lottery ${lotteryId}):`);
        error.logs.forEach((log: string, idx: number) => {
          console.error(`Log ${idx + 1}:`, log);
        });
        console.groupEnd();
      }
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

        {Object.keys(lotteries).length > 0 && (
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
                  <h4 className={heading({ l: 5, weight: "semibold" })}>Total Prize: {parseFloat(lottery.totalPrizeSOL.toFixed(3))} SOL</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderLotteryDetails = () => {
    if (selectedLotteryId === null || !lotteries[selectedLotteryId]) {
      return <p className={css({ color: "text.secondary", opacity: 0.6 })}>Select a lottery to view details.</p>;
    }

    const lottery = lotteries[selectedLotteryId];
    return (
      <div className={css(card.raw(), { bg: "background.primary", padding: "16px" })}>
        <h3 className={heading({ l: 3, weight: "bold" })}>Lottery {lottery.id}</h3>
        <h4 className={heading({ l: 5, weight: "semibold" })}>Total Prize: {parseFloat(lottery.totalPrizeSOL.toFixed(3))} SOL</h4>
        <p>
          Address: {lottery.address.toBase58().slice(0, 4)}...{lottery.address.toBase58().slice(-4)}
        </p>
        <p className={css({ wordBreak: "break-all" })}>
          Authority: {lottery.authority.toBase58().slice(0, 4)}...{lottery.authority.toBase58().slice(-4)}
        </p>
        <p>Ticket Price: {lottery.ticketPriceSOL} SOL</p>
        <p>Tickets bought: {lottery.lastTicketId}</p>

        {(() => {
          switch (lottery.winnerTicketId) {
            case null:
              return (
                <div className={hstack({ gap: "4", marginTop: "4", minWidth: 0 })}>
                  <Button onClick={() => program && buyTicket(program, lottery.id)} disabled={lottery.winnerTicketId !== null}>
                    Buy Ticket
                  </Button>
                  <Button onClick={() => program && pickWinner(program, lottery.id)} disabled={lottery.winnerTicketId !== null || lottery.claimed || lottery.lastTicketId === 0}>
                    Pick Winner
                  </Button>
                </div>
              );
            default:
              return (
                <>
                  <p>Winner Ticket ID: {lottery.winnerTicketId}</p>
                  {lottery.claimed ? (
                    "Claimed by winner"
                  ) : (
                    <div>
                      <p>Not claimed yet</p>
                      <Button
                        onClick={() => program && claimPrize(program, lottery.id)}
                        disabled={lottery.winnerTicketId === null || lottery.claimed || lottery.lastTicketId === 0}
                      >
                        Claim Prize
                      </Button>
                    </div>
                  )}
                </>
              );
          }
        })()}
      </div>
    );
  };

  return (
    <div className={css(col, { gap: "4" })}>
      <h2 className={heading({ l: 1, weight: "bold", color: "primary" })}>Lottery Program UI</h2>
      <div className={css(row, { gap: "8", alignItems: "stretch", flexGrow: 0, flexShrink: 1, flexBasis: "100%" })}>
        <div className={css(col, { gap: "4", flexGrow: 1, flexShrink: 2, flexBasis: "100%" })}>
          {renderMasterPdaSection()}
          {renderLotteriesSection()}
        </div>
        <div className={css({ flexGrow: 1, flexShrink: 1, flexBasis: "100%" })}>{renderLotteryDetails()}</div>
      </div>
    </div>
  );
};

export default Lottery;
