import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useAnchorWallet, useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, type ConnectionConfig } from "@solana/web3.js";
import React, { type FC, useMemo, useState, useCallback, useEffect, createContext, useContext, use } from "react";
import Button from "../atoms/Button";
import { card, borderedCard } from "../atoms/Card";
import { css } from "../../styled-system/css";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { col } from "../atoms/layout";

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
      <WalletMultiButton />
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
  const { publicKey } = useWallet();
  const { connection, cluster, transactions, upsertTransaction } = useConnectWallet(); // Get from context

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.network === cluster.cluster);
  }, [transactions, cluster.cluster]);

  if (!publicKey) {
    return null;
  }

  return (
    <div
      className={borderedCard({ color: "accent" })} // Main card always has accent border
      style={{
        marginTop: "10px",
        width: "300px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <BalanceDisplay upsertTransaction={upsertTransaction} />
      <div className={css({ marginTop: "6", spaceY: "3" })}>
        <h2 className={css({ fontSize: "lg", fontWeight: "semibold", marginBottom: "2" })}>Recent Transactions:</h2>
        {filteredTransactions.length === 0 && <p className={css({ color: "text.secondary" })}>No transactions yet.</p>}
        {filteredTransactions.map((tx) => (
          <TransactionDisplayCard key={tx.id} tx={tx} cluster={cluster} connection={connection} />
        ))}
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
      className={borderedCard({ color: isConfirmed ? "positive" : "secondary" })}
      style={{ minWidth: "280px", backgroundColor: "#252838", display: "flex", flexDirection: "column", gap: "8px" }}
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
  // currentNetwork: AppNetwork; // Removed
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

  const handleAirdrop = async () => {
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
      <h2>Balance</h2>
      {publicKey ? <p>{balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}</p> : <p>Connect your wallet to see balance.</p>}
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
  const wallet = useAnchorWallet();
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

  const wallets = useMemo(
    () => [
      // browser wallets are alread auto-detected / included. This adds extra wallet options.
      new UnsafeBurnerWalletAdapter(),
    ],
    [] // do not pass network here: so it doesn't re-generate new wallet on network change
  );

  return (
    <SolanaWalletProvider wallets={wallets}>
      <WalletModalProvider>
        <ConnectWalletInner>{children}</ConnectWalletInner>
      </WalletModalProvider>
    </SolanaWalletProvider>
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
    <div className={css(col, { padding: "4" })}>
      {wallet === undefined ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p className={css({ color: "text.secondary" })}>Please connect your wallet to continue.</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>{children}</div>
          <div
            style={{
              padding: "12px 0",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <p className={css({ color: "text.secondary", fontSize: "sm" })}>Wallet connected: {wallet.publicKey.toBase58()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
