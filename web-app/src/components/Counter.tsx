import React, { useState } from "react";
import { css } from "../../styled-system/css";
import { useWallet } from "@solana/wallet-adapter-react";
import Button from "./atoms/Button";
// No longer importing WalletProviderComponent directly here as it's in AppLayout

export const Counter: React.FC = () => {
  const { publicKey } = useWallet();
  console.debug("useWallet fields:", {
    publicKey,
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
    <div className={css({ border: "2px solid token(colors.purple.500)", padding: "4", borderRadius: "md" })}>
      <h2>Counter: {count}</h2>
      {publicKey ? <p>Connected Wallet: {publicKey.toBase58()}</p> : <p>Wallet not connected.</p>}
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
