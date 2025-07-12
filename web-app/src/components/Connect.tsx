import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { type FC, useMemo, useState, useCallback, useEffect } from "react";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

enum AppNetwork {
  Local = "local",
  Devnet = "devnet",
  Testnet = "testnet",
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

export const WalletProviderComponent: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.network === network);
  }, [transactions, network]);

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

  const endpoint = useMemo(() => {
    switch (network) {
      case AppNetwork.Devnet:
        return clusterApiUrl(WalletAdapterNetwork.Devnet);
      case AppNetwork.Testnet:
        return clusterApiUrl(WalletAdapterNetwork.Testnet);
      case AppNetwork.Local:
      default:
        return "http://127.0.0.1:8899";
    }
  }, [network]);

  const wallets = useMemo(
    () => [
      // browser wallets are alread auto-detected / included. This adds extra wallet options.
      new UnsafeBurnerWalletAdapter(),
    ],
    [] // do not pass network here: so it doesn't re-generate new wallet on network change
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export const WalletHeaderUI: FC = () => {
  const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);

  const handleNetworkChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(event.target.value as AppNetwork);
  }, []);

  return (
    <>
      <WalletMultiButton />
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="network-select" style={{ marginRight: "10px" }}>
          Select Network:
        </label>
        <select id="network-select" value={network} onChange={handleNetworkChange}>
          <option value={AppNetwork.Local}>Localhost</option>
          <option value={AppNetwork.Devnet}>Devnet</option>
          <option value={AppNetwork.Testnet}>Testnet</option>
        </select>
      </div>
    </>
  );
};

export const WalletConnectUI: FC = () => {
  const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.network === network);
  }, [transactions, network]);

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

  return <WalletCard upsertTransaction={upsertTransaction} currentNetwork={network} transactions={filteredTransactions} />;
};

const WalletCard: FC<{ upsertTransaction: (tx: Transaction) => void; currentNetwork: AppNetwork; transactions: Transaction[] }> = ({
  upsertTransaction,
  currentNetwork,
  transactions,
}) => {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        marginTop: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        width: "300px", // Constant width
        boxSizing: "border-box", // Include padding and border in the width
        overflow: "hidden", // Prevent overflow
      }}
    >
      <BalanceDisplay upsertTransaction={upsertTransaction} currentNetwork={currentNetwork} />
      <TransactionDisplay transactions={transactions} />
    </div>
  );
};

interface BalanceDisplayProps {
  upsertTransaction: (tx: Transaction) => void;
  currentNetwork: AppNetwork; // Add currentNetwork prop
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ upsertTransaction, currentNetwork }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
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
      network: currentNetwork, // Include the current network
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
        network: currentNetwork, // Include the current network
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
        network: currentNetwork, // Include the current network
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
        network: currentNetwork, // Include the current network
      });
    } finally {
      setIsRequestingAirdrop(false);
    }
  };

  return (
    <div>
      <h2>Wallet Balance</h2>
      {publicKey ? <p>Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}</p> : <p>Connect your wallet to see balance.</p>}
      <button onClick={handleAirdrop} disabled={!publicKey || isRequestingAirdrop}>
        {isRequestingAirdrop ? "Requesting Airdrop..." : "Request Airdrop"}
      </button>
    </div>
  );
};

interface TransactionDisplayProps {
  transactions: Transaction[];
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transactions }) => {
  return (
    <div>
      <h2>Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions to display.</p>
      ) : (
        <ul>
          {transactions.map((tx) => (
            <li key={tx.id}>
              <strong>{tx.type}</strong> - Amount: {tx.amount} SOL - Status: {tx.status} - {tx.timestamp.toLocaleString()}
              {tx.signature && <span> (Signature: {tx.signature.substring(0, 8)}...)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
