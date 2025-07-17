import React, { useState, useEffect, type FC, use } from "react";
import { css } from "../styled-system/css/index";
import { WalletHeaderUI, WalletCard, RequiresWallet, ConnectWalletProvider, useIdentity } from "./components/Connect.tsx";
import CounterPage from "./page-parts/Counter.tsx";
import VotingPage from "./page-parts/Voting.tsx";
import LotteryComp from "./page-parts/Lottery.tsx";
import EscrowPage from "./page-parts/Escrow.tsx";
import StakingPage from "./page-parts/Staking.tsx";
import DumpFunPage from "./page-parts/DumpFun.tsx";
import { col, row } from "./atoms/layout.tsx";
import { MultiButton } from "./atoms/Button.tsx";

const Header: FC = () => {
  const [localSelectedPerson, setLocalSelectedPerson] = useState<"alice" | "bob" | "charlie">("alice");
  const { selectedPerson, setSelectedPerson } = useIdentity();
  useEffect(() => {
    if (!selectedPerson) {
      setSelectedPerson(localSelectedPerson);
    }
  });

  const handlePersonSelect = (person: "alice" | "bob" | "charlie") => {
    setSelectedPerson(person);
    setLocalSelectedPerson(person);
    // You can add logic here to switch wallets or contexts based on the selected person
    console.log(`Selected person: ${person}`);
  };

  return (
    <header
      className={css({
        display: "flex",
        justifyContent: "space-between", // Changed to space-between
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "background.secondary",
        borderBottom: "1px solid",
        borderColor: "accent.primary",
      })}
    >
      <MultiButton
        options={[
          { label: "Alice", value: "alice" },
          { label: "Bob", value: "bob" },
          { label: "Charlie", value: "charlie" },
        ]}
        selected={localSelectedPerson}
        onSelect={handlePersonSelect}
      />
      <div className={css(row, { gap: "1rem", alignItems: "center" })}>
        <WalletHeaderUI />
      </div>
    </header>
  );
};

const NavItem: FC<{ href: string; label: string; currentRouteName: string; routeName: string }> = ({ href, label, currentRouteName, routeName }) => {
  return (
    <li>
      <a
        href={href}
        className={css(row, {
          alignItems: "center",
          p: "2",
          fontSize: "base",
          fontWeight: "normal",
          rounded: "lg",
          backgroundColor: currentRouteName === routeName ? "accent.secondary" : "transparent",
          color: "text.primary",
          opacity: currentRouteName === routeName ? "1" : "0.7",
          _hover: {
            backgroundColor: "accent.secondary",
            opacity: "1",
          },
        })}
      >
        <span className={css({ ml: "3" })}>{label}</span>
      </a>
    </li>
  );
};

const Navbar: FC<{ currentRouteName: string }> = ({ currentRouteName }) => {
  return (
    <aside
      className={css(col, {
        w: "48",
        flexGrow: "0",
        flexShrink: "0",
        alignSelf: "stretch",
        overflowY: "auto",
        py: "4",
        px: "3",
        bg: "background.secondary",
        rounded: "lg",
      })}
      aria-label="Sidebar"
    >
      <ul className={css({ spaceY: "2" })}>
        <NavItem href="#counter" label="Counter" currentRouteName={currentRouteName} routeName="counter" />
        <NavItem href="#voting" label="Voting" currentRouteName={currentRouteName} routeName="voting" />
        <NavItem href="#lottery" label="Lottery" currentRouteName={currentRouteName} routeName="lottery" />
        <NavItem href="#escrow" label="Escrow" currentRouteName={currentRouteName} routeName="escrow" />
        <NavItem href="#staking" label="Staking" currentRouteName={currentRouteName} routeName="staking" />
        <NavItem href="#dumpfun" label="dump.fun" currentRouteName={currentRouteName} routeName="dumpfun" />
      </ul>
    </aside>
  );
};

export const Layout: FC = () => {
  const [route, setRoute] = useState<{ name: string; id: number | null }>({ name: "counter", id: null });

  useEffect(() => {
    const getRouteFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "voting") return { name: "voting", id: null };
      if (hash === "lottery") return { name: "lottery", id: null };
      if (hash === "escrow") return { name: "escrow", id: null };
      if (hash === "staking") return { name: "staking", id: null };
      if (hash === "dumpfun") return { name: "dumpfun", id: null };
      return { name: "counter", id: null };
    };

    setRoute(getRouteFromHash());

    const handleHashChange = () => {
      setRoute(getRouteFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <ConnectWalletProvider>
      <div className={css(col, { h: "100vh", margin: "0", bg: "background.primary", width: "100vw", overflowY: "auto" })}>
        <Header />
        <div className={css(row, { flexGrow: "1" })}>
          <Navbar currentRouteName={route.name} />
          <main
            className={css(col, {
              flexGrow: "1",
              flexShrink: "1",
              width: "100%",
              minWidth: "0",
              p: "4",
              overflowY: "auto",
              alignItems: "flex-start",
              color: "text.primary",
            })}
          >
            <RequiresWallet>
              {route.name === "counter" && <CounterPage />}
              {route.name === "voting" && <VotingPage />}
              {route.name === "lottery" && <LotteryComp initialLotteryId={route.id} />}
              {route.name === "escrow" && <EscrowPage />}
              {route.name === "staking" && <StakingPage />}
              {route.name === "dumpfun" && <DumpFunPage />}
            </RequiresWallet>
          </main>
        </div>
        <div
          className={css({
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            zIndex: "1000",
          })}
        >
          <WalletCard />
        </div>
      </div>
    </ConnectWalletProvider>
  );
};
