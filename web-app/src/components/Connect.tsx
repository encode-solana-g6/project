import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, Keypair, type ConnectionConfig } from "@solana/web3.js";
import React, { type FC, useMemo, useState, useCallback, useEffect, createContext, useContext } from "react";
import Button from "../atoms/Button";
import { card, bordered } from "../atoms/Card";
import { css, cx } from "../../styled-system/css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { col } from "../atoms/layout";
import * as anchor from "@coral-xyz/anchor";
import Wallet from "@coral-xyz/anchor/dist/esm/nodewallet.js";

enum AppNetwork {
  Local = "local",
  Devnet = "devnet",
  Testnet = "testnet",
}

class SolanaCluster {
  cluster: AppNetwork;

  constructor(network: AppNetwork) {
    this.cluster = network;
  }

  get endpoint(): string {
    switch (this.cluster) {
      case AppNetwork.Devnet:
        return clusterApiUrl(WalletAdapterNetwork.Devnet);
      case AppNetwork.Testnet:
        return clusterApiUrl(WalletAdapterNetwork.Testnet);
      case AppNetwork.Local:
      default:
        return "http://127.0.0.1:8899";
    }
  }
}

enum TransactionType {
  Airdrop = "Airdrop",
}

enum TransactionStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Rejected = "Rejected",
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp: Date;
  signature?: string;
  network: AppNetwork;
}

export const WalletHeaderUI: FC = () => {
  const { cluster, setNetwork } = useConnectWallet(); // Use cluster and setNetwork from context

  const handleNetworkChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setNetwork(event.target.value as AppNetwork);
    },
    [setNetwork]
  );

  return (
    <>
      {/* <WalletMultiButton /> */}
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="network-select" style={{ marginRight: "10px", color: "#FFFFFF" }}>
          Select Network:
        </label>
        <select id="network-select" value={cluster.cluster} onChange={handleNetworkChange} style={{ color: "#FFFFFF", backgroundColor: "#1A1D2C" }}>
          <option value={AppNetwork.Local} style={{ color: "#FFFFFF", backgroundColor: "#1A1D2C" }}>
            Localhost
          </option>
          <option value={AppNetwork.Devnet} style={{ color: "#FFFFFF", backgroundColor: "#1A1D2C" }}>
            Devnet
          </option>
          <option value={AppNetwork.Testnet} style={{ color: "#FFFFFF", backgroundColor: "#1A1D2C" }}>
            Testnet
          </option>
        </select>
      </div>
    </>
  );
};

export const WalletCard: FC = () => {
  const { wallet, connection, cluster, transactions, upsertTransaction } = useConnectWallet();
  const [isMinimized, setIsMinimized] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.network === cluster.cluster);
  }, [transactions, cluster.cluster]);

  if (!wallet?.publicKey) {
    return null;
  }

  const toggleMinimize = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling if clicked on the button itself
    setIsMinimized(!isMinimized);
  };

  const MinimizeIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={css({ color: "text.primary" })}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  const MaximizeIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={css({ color: "text.primary" })}
    >
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  );

  return (
    <div
      style={{
        marginTop: "10px",
        width: "300px",
        boxSizing: "border-box",
      }}
    >
      <div
        className={cx(
          card({}),
          bordered({
            mood: "accent",
          })
        )}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isMinimized ? "0" : "16px",
          transition: "gap 0.2s ease-in-out",
          position: "relative", // Needed for absolute positioning of the button
        }}
      >
        <button
          onClick={toggleMinimize}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            cursor: "pointer",
            minWidth: "initial",
            padding: "0", // Remove padding for icon button
            zIndex: 10, // Ensure button is on top
            backgroundColor: "transparent", // Make button background transparent
            border: "none", // Remove button border
            display: "flex", // To center the SVG icon if needed
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isMinimized ? MaximizeIcon : MinimizeIcon}
        </button>

        <BalanceDisplay upsertTransaction={upsertTransaction} />

        <div
          style={{
            maxHeight: isMinimized ? "0" : "1000px", // A sufficiently large value
            overflow: "hidden",
            transition: "max-height 0.3s ease-in-out",
          }}
        >
          <div className={css({ spaceY: "3" })}>
            <h2 className={css({ fontSize: "lg", fontWeight: "semibold", marginBottom: "2" })}>Recent Transactions:</h2>
            <div
              className={css(col, {
                height: "200px",
                overflowY: "scroll",
                gap: "8px",
              })}
            >
              {filteredTransactions.length === 0 && <p className={css({ color: "text.dimmed" })}>No transactions yet.</p>}
              {filteredTransactions.map((tx) => (
                <TransactionDisplayCard key={tx.id} tx={tx} cluster={cluster} connection={connection} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TransactionDisplayCardProps {
  tx: Transaction;
  cluster: SolanaCluster;
  connection: Connection;
}

const TransactionDisplayCard: React.FC<TransactionDisplayCardProps> = ({ tx, cluster, connection }) => {
  const getExplorerLink = (signature: string) => {
    const network = connection.rpcEndpoint.includes("devnet") ? "devnet" : "mainnet-beta"; // Simple check
    return `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
  };

  const isConfirmed = tx.status === TransactionStatus.Confirmed;
  const tickSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={css({ marginLeft: "2", color: "positive" })}
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  return (
    <div
      className={cx(card({ size: "small" }), bordered({ mood: isConfirmed ? "positive" : "secondary" }))}
      style={{
        backgroundColor: "#252838",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%", // Make it adapt to the parent's content width
      }}
    >
      <div className={css({ display: "flex", alignItems: "center", justifyContent: "space-between" })}>
        <p className={css({ fontSize: "sm", color: "text.primary" })}>
          {tx.type} - {tx.amount} SOL
        </p>
        {isConfirmed && tickSvg}
      </div>
      {tx.signature && cluster.cluster === AppNetwork.Devnet && (
        <a
          href={getExplorerLink(tx.signature)}
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            fontSize: "sm",
            color: "accent.primary",
            textDecoration: "underline",
            _hover: { color: "accent.secondary" },
          })}
        >
          View on Explorer (Devnet)
        </a>
      )}
    </div>
  );
};

interface BalanceDisplayProps {
  upsertTransaction: (tx: Transaction) => void;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ upsertTransaction }) => {
  const { publicKey } = useWallet();
  const { cluster, connection } = useConnectWallet(); // load from Provider context
  const [balance, setBalance] = useState<number | null>(null);
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState(false);

  const getBalance = async () => {
    if (!connection || !publicKey) {
      setBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
    }
  };

  useEffect(() => {
    getBalance();
    const interval = setInterval(getBalance, 10000); // Refresh balance every 10 seconds

    return () => clearInterval(interval);
  }, [connection, publicKey]);

  const handleAirdrop = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling to parent WalletCard
    setIsRequestingAirdrop(true);
    if (!publicKey || !connection) {
      console.error("Wallet not connected or connection not established.");
      setIsRequestingAirdrop(false);
      return;
    }

    // Generate a unique ID for the transaction immediately
    const transactionId = `airdrop_${publicKey.toBase58()}_${Date.now()}`;

    // Add pending transaction to the list immediately
    upsertTransaction({
      id: transactionId,
      type: TransactionType.Airdrop,
      amount: 1,
      status: TransactionStatus.Pending,
      timestamp: new Date(),
      signature: undefined, // Signature not yet available
      network: cluster.cluster, // Use cluster.cluster
    });

    try {
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL); // Request 1 SOL

      // Update the pending transaction with the actual signature
      upsertTransaction({
        id: transactionId,
        type: TransactionType.Airdrop,
        amount: 1,
        status: TransactionStatus.Pending, // Still pending until confirmed
        timestamp: new Date(),
        signature: signature,
        network: cluster.cluster, // Use cluster.cluster
      });

      await connection.confirmTransaction(signature, "confirmed");
      console.log("Airdrop successful:", signature);
      // Update transaction status to Confirmed
      upsertTransaction({
        id: transactionId,
        type: TransactionType.Airdrop,
        amount: 1,
        status: TransactionStatus.Confirmed,
        timestamp: new Date(),
        signature: signature,
        network: cluster.cluster, // Use cluster.cluster
      });
      getBalance(); // Refresh balance after airdrop
    } catch (error) {
      console.error("Error requesting airdrop:", error);
      // Update transaction status to Rejected
      upsertTransaction({
        id: transactionId,
        type: TransactionType.Airdrop,
        amount: 1, // Still 1 SOL requested
        status: TransactionStatus.Rejected,
        timestamp: new Date(),
        signature: undefined, // Signature might not be available if requestAirdrop failed
        network: cluster.cluster, // Use cluster.cluster
      });
    } finally {
      setIsRequestingAirdrop(false);
    }
  };

  return (
    <div>
      <h2 className={css({ color: "text.dimmed" })}>Balance</h2>
      {publicKey ? (
        <p className={css({ fontSize: "2xl", fontWeight: "bold" })}>{balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}</p>
      ) : (
        <p>Connect your wallet to see balance.</p>
      )}
      <Button onClick={handleAirdrop} disabled={!publicKey || isRequestingAirdrop}>
        {isRequestingAirdrop ? "Requesting Airdrop..." : "Request Airdrop"}
      </Button>
    </div>
  );
};

/// WALLET & CONNECTION PROVIDER

interface WalletContext {
  wallet: AnchorWallet | undefined;
  setNetwork: React.Dispatch<React.SetStateAction<AppNetwork>>;
  cluster: SolanaCluster;
  connection: Connection;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  upsertTransaction: (newTx: Transaction) => void;
}
const WalletContext = createContext<WalletContext | undefined>(undefined);

export const ConnectWalletInner: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);
  const cluster = useMemo(() => new SolanaCluster(network), [network]);
  const CONFIG: ConnectionConfig = { commitment: "confirmed" };
  const connection = useMemo(() => new Connection(cluster.endpoint, CONFIG), [cluster]);
  const { wallet } = useIdentity();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      console.log("Wallet connected:", wallet.publicKey.toBase58());
    } else {
      console.log("No wallet connected");
    }
  }, [wallet]);

  // const connection = useMemo(() => new Connection(cluster.endpoint, CONFIG), [cluster]);

  // const wallets = useMemo(
  //   () => [
  //     // browser wallets are alread auto-detected / included. This adds extra wallet options.
  //     new UnsafeBurnerWalletAdapter(),
  //   ],
  //   [] // do not pass network here: so it doesn't re-generate new wallet on network change
  // );

  const upsertTransaction = useCallback((newTx: Transaction) => {
    setTransactions((prev) => {
      const existingIndex = prev.findIndex((tx) => tx.id === newTx.id);
      if (existingIndex > -1) {
        const updatedTransactions = [...prev];
        updatedTransactions[existingIndex] = newTx;
        return updatedTransactions;
      }
      return [newTx, ...prev];
    });
  }, []);

  const value = useMemo(
    () => ({
      wallet,
      cluster,
      connection,
      setNetwork,
      transactions,
      setTransactions,
      upsertTransaction,
    }),
    [wallet, cluster, transactions, upsertTransaction] // network is implicit in cluster
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Wrap our provider with SolanaWalletProvider and ConnectionProvider
export const ConnectWalletProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  // const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);
  // const cluster = useMemo(() => new SolanaCluster(network), [network]);
  // const CONFIG: ConnectionConfig = { commitment: "confirmed" };

  // const connection = useMemo(() => new Connection(cluster.endpoint, CONFIG), [cluster]);

  // const wallets = useMemo(
  //   () => [
  //     // browser wallets are alread auto-detected / included. This adds extra wallet options.
  //     new UnsafeBurnerWalletAdapter(),
  //   ],
  //   [] // do not pass network here: so it doesn't re-generate new wallet on network change
  // );

  return (
    <IdentityProvider>
      <ConnectWalletInner>{children}</ConnectWalletInner>
    </IdentityProvider>
  );
};

export const useConnectWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useConnectWallet must be used within an ConnectWalletInner");
  }
  return context;
};

export const RequiresWallet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wallet } = useConnectWallet();

  return (
    <>
      {wallet === undefined ? (
        <div className={css(col, { flex: 1, display: "flex", flexDirection: "column", width: "100%" })}>
          <p className={css({ color: "text.secondary" })}>Please connect your wallet to continue.</p>
          {/* <WalletMultiButton /> */}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
          <div style={{ flex: 1 }}>{children}</div>
          <div
            style={{
              padding: "12px 0",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <p className={css({ color: "text.dimmed", fontSize: "sm" })}>Wallet connected: {wallet.publicKey.toBase58()}</p>
          </div>
        </div>
      )}
    </>
  );
};

interface IdentityProvider {
  selectedPerson: string | null;
  setSelectedPerson: React.Dispatch<React.SetStateAction<string | null>>;
  personWallets: Map<string, AnchorWallet | null>;
  getOrGenWallet: (personName: string) => AnchorWallet | undefined;
  wallet: AnchorWallet | undefined;
}
const IdentityContext = createContext<IdentityProvider | undefined>(undefined);

export const IdentityProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personWallets, setPersonWallets] = useState<Map<string, AnchorWallet>>(new Map());
  const [wallet, setWallet] = useState<AnchorWallet | undefined>(undefined);

  const getOrGenWallet = useCallback(
    (personName: string): AnchorWallet => {
      let wallet2 = personWallets.get(personName);
      if (!wallet2) {
        const keypair = anchor.web3.Keypair.generate();
        wallet2 = new Wallet(keypair);
        setPersonWallets((prev) => new Map(prev).set(personName, wallet2!));
      }
      return wallet2!;
    },
    [selectedPerson]
  );

  useEffect(() => {
    console.log("Selected person changed:", selectedPerson);
    if (!selectedPerson) {
      return;
    }
    const wallet = getOrGenWallet(selectedPerson);
    setWallet(wallet);
  }, [selectedPerson]);

  const value = useMemo(
    () => ({
      selectedPerson,
      setSelectedPerson,
      personWallets,
      getOrGenWallet,
      wallet,
    }),
    [selectedPerson, setSelectedPerson, personWallets, getOrGenWallet]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
};

export const useIdentity = () => {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error("useIdentity must be used within an IdentityProvider");
  }
  return context;
};
