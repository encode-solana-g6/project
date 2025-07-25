import React, { useState, useEffect, type FC } from "react";
import { css } from "../styled-system/css/index";
import { WalletHeaderUI, WalletCard, RequiresWallet, ConnectWalletProvider } from "./components/Connect.tsx";
import CounterPage from "./page-parts/Counter.tsx";
import VotingPage from "./page-parts/Voting.tsx";
import LotteryComp from "./page-parts/Lottery.tsx";
import { col, row } from "./atoms/layout.tsx";

const Header: FC = () => {
  return (
    <header
      className={css({
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "background.secondary",
        borderBottom: "1px solid",
        borderColor: "accent.primary",
      })}
    >
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
      if (hash.startsWith("lottery/")) {
        const parts = hash.split("/");
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          return { name: "lottery", id: Number(parts[1]) };
        }
      }
      if (hash === "lottery") return { name: "lottery", id: null };
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
            })}
          >
            <RequiresWallet>
              {route.name === "counter" && <CounterPage />}
              {route.name === "voting" && <VotingPage />}
              {route.name === "lottery" && <LotteryComp initialLotteryId={route.id} />}
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
