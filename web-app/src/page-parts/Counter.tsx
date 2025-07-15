import React, { useState } from "react";
import { card } from "../../styled-system/recipes";
import { useWallet } from "@solana/wallet-adapter-react";
import Button from "../atoms/Button";
import { useConnectWallet } from "../components/Connect";
// No longer importing WalletProviderComponent directly here as it's in AppLayout

export const Counter: React.FC = () => {
  const { wallet } = useConnectWallet();
  if (wallet === undefined) {
    console.error("Wallet is undefined. Ensure the wallet provider is set up correctly.");
    return <p>Error: Wallet is not connected.</p>;
  }
  // const publicKey = wallet.publicKey;
  console.debug("useWallet fields:", {
    publicKey: wallet.publicKey,
    wallet: useWallet().wallet,
    connected: useWallet().connected,
    connecting: useWallet().connecting,
    disconnecting: useWallet().disconnecting,
    select: useWallet().select,
    connect: useWallet().connect,
    disconnect: useWallet().disconnect,
    sendTransaction: useWallet().sendTransaction,
    signTransaction: useWallet().signTransaction,
    signAllTransactions: useWallet().signAllTransactions,
    signMessage: useWallet().signMessage,
  });
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  return (
    <div
      className={card({
        bg: "background.secondary",
        color: "text.primary",
        border: "1px solid token(colors.accent.primary)",
      })}
    >
      <h2>Counter: {count}</h2>
      {wallet.publicKey ? <p>Connected Wallet: {wallet.publicKey.toBase58()}</p> : <p>Wallet not connected.</p>}
      <Button type="button" onClick={increment}>
        Increment
      </Button>
      <Button type="button" onClick={decrement} variant="secondary">
        Decrement
      </Button>
    </div>
  );
};

export default Counter;
