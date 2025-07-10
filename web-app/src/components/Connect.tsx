import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import React, { type FC, useMemo } from "react";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export const Wallet: FC = () => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  // const network = WalletAdapterNetwork.Devnet; // Commented out for local cluster

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => "http://127.0.0.1:8899", []); // Changed to local cluster endpoint

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/anza-xyz/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      new UnsafeBurnerWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Removed network from dependency array
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          <WalletDisconnectButton />
          {/* Your app's components go here, nested within the context providers. */}
          <BalanceDisplay />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const BalanceDisplay: React.FC = () => {
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

    try {
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL); // Request 1 SOL
      await connection.confirmTransaction(signature, "confirmed");
      console.log("Airdrop successful:", signature);
      getBalance(); // Refresh balance after airdrop
    } catch (error) {
      console.error("Error requesting airdrop:", error);
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
