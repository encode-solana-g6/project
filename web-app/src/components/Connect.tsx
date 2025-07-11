import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import React, { type FC, useMemo, useState, useCallback } from "react";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

enum AppNetwork {
  Local = "local",
  Devnet = "devnet",
  Testnet = "testnet",
}

const WalletProviderComponent: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<AppNetwork>(AppNetwork.Local);

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

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  const handleNetworkChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(event.target.value as AppNetwork);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 999 }}>
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
            <WalletMultiButton /> {/* Move WalletMultiButton here */}
          </div>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProviderComponent;
