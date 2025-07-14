// TODO create a connect component with a button, when you click it it sets a random address and diaplys it
// create a context, a provider for that context, and a hook for other components to use that context
// make another component use that state (and display the address

import { Children, createContext, useState, type PropsWithChildren } from "react";


// the state

interface WalletContext {
    address: String;
    setAddress: (addr: string) => void;
    network: String;
    setNetwork: (net: string) => void;
}
const WalletContext = createContext<WalletContext | undefined>(undefined);


// a component that provides the state

export const WalletContextProvider: React.FC<PropsWithChildren>= ({children}) => {
    // create state
    const [address, setAddress] = useState(); 
    const [ network, setNetwork] = useState("devnet");

    // TODO create a WalletContext 
    const newconnection  = new WalletContext ()
    return (
    // TODO return Thing.Provider that wraps children
    <WalletContext.Provider value={}>
        {children}
    </WalletContext.Provider>
  )
}

// TODO a function to let other components consume the state: function useWalletContext()


