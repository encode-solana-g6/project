import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, type ConnectionConfig } from "@solana/web3.js";
import React, { type FC, useMemo, useState, useCallback, useEffect, createContext, useContext } from "react";
import Button from "./atoms/Button";
import theme from "../../../.clinerules/ui-theme.json";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

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

// export const WalletProviderComponent: FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { network } = useAppWallet(); // Use network from context

//   const endpoint = useMemo(() => {
//     const solanaCluster = new SolanaCluster(network);
//     return solanaCluster.endpoint;
//   }, [network]);

//   const wallets = useMemo(
//     () => [
//       // browser wallets are alread auto-detected / included. This adds extra wallet options.
//       new UnsafeBurnerWalletAdapter(),
//     ],
//     [] // do not pass network here: so it doesn't re-generate new wallet on network change
//   );

//   return (
//     <ConnectionProvider endpoint={endpoint}>
//       <SolanaWalletProvider wallets={wallets}>
//         <WalletModalProvider>{children}</WalletModalProvider>
//       </SolanaWalletProvider>
//     </ConnectionProvider>
//   );
// };

export const WalletHeaderUI: FC = () => {
  const { cluster, setNetwork } = useAppWallet(); // Use cluster and setNetwork from context

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
        <label htmlFor="network-select" style={{ marginRight: "10px" }}>
          Select Network:
        </label>
        <select id="network-select" value={cluster.cluster} onChange={handleNetworkChange}>
          <option value={AppNetwork.Local}>Localhost</option>
          <option value={AppNetwork.Devnet}>Devnet</option>
          <option value={AppNetwork.Testnet}>Testnet</option>
        </select>
      </div>
    </>
  );
};

// WalletConnectUI component is removed as its logic is moved directly into WalletCard

export const WalletCard: FC = () => {
  // Removed props, will get from context
  const { publicKey } = useWallet();
  const { cluster, transactions, upsertTransaction } = useAppWallet(); // Get from context

  const filteredTransactions = useMemo(() => {
    // Moved filtering logic here
    return transactions.filter((tx) => tx.network === cluster.cluster);
  }, [transactions, cluster.cluster]);

  if (!publicKey) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.primary,
        padding: theme.card.padding,
        borderRadius: theme.card.borderRadius,
        border: `1px solid ${theme.colors.accent.primary}`,
        marginTop: "10px",
        width: "300px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <BalanceDisplay upsertTransaction={upsertTransaction} />
      <TxnsList />
    </div>
  );
};

interface BalanceDisplayProps {
  upsertTransaction: (tx: Transaction) => void;
  // currentNetwork: AppNetwork; // Removed
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ upsertTransaction }) => {
  const { publicKey } = useWallet();
  const { cluster, connection } = useAppWallet(); // load from Provider context
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

const TxnsList: React.FC = () => {
  const { transactions, cluster } = useAppWallet(); // load from Provider context

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.network === cluster.cluster);
  }, [transactions, cluster.cluster]);

  return (
    <div>
      <h2>Transactions</h2>
      {filteredTransactions.length === 0 ? ( // Use filteredTransactions
        <p>No transactions to display.</p>
      ) : (
        <ul>
          {filteredTransactions.map(
            (
              tx // Use filteredTransactions
            ) => (
              <li key={tx.id}>
                <strong>{tx.type}</strong> - Amount: {tx.amount} SOL - Status: {tx.status} - {tx.timestamp.toLocaleString()}
                {tx.signature && <span> (Signature: {tx.signature.substring(0, 8)}...)</span>}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

/// NEW PROVIDER

interface AppWalletContext {
  setNetwork: React.Dispatch<React.SetStateAction<AppNetwork>>;
  cluster: SolanaCluster;
  connection: Connection;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  upsertTransaction: (newTx: Transaction) => void;
}

const AppWalletContext = createContext<AppWalletContext | undefined>(undefined);

export const AppWalletContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const cluster = useMemo(() => new SolanaCluster(network), [network]);
  const CONFIG: ConnectionConfig = { commitment: "confirmed" };

  const connection = useMemo(() => new Connection(cluster.endpoint, CONFIG), [cluster]);

  const wallets = useMemo(
    () => [
      // browser wallets are alread auto-detected / included. This adds extra wallet options.
      new UnsafeBurnerWalletAdapter(),
    ],
    [] // do not pass network here: so it doesn't re-generate new wallet on network change
  );

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
      setNetwork,
      cluster,
      connection,
      transactions,
      setTransactions,
      upsertTransaction,
    }),
    [cluster, transactions, upsertTransaction] // network is implicit in cluster
  );

  return (
    <AppWalletContext.Provider value={value}>
      <SolanaWalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </AppWalletContext.Provider>
  );
};

export const useAppWallet = () => {
  const context = useContext(AppWalletContext);
  if (context === undefined) {
    throw new Error("useAppWallet must be used within an AppWalletContextProvider");
  }
  return context;
};
