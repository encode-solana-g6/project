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

const NavItem: FC<{ href: string; label: string; currentRoute: string | null; setRoute: (route: string) => void; routeName: string }> = ({
  href,
  label,
  currentRoute,
  setRoute,
  routeName,
}) => {
  return (
    <li>
      <a
        href={href}
        onClick={() => setRoute(routeName)}
        className={css(row, {
          alignItems: "center",
          p: "2",
          fontSize: "base",
          fontWeight: "normal",
          rounded: "lg",
          backgroundColor: currentRoute === routeName ? "accent.secondary" : "transparent",
          color: "text.primary",
          opacity: currentRoute === routeName ? "1" : "0.7",
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

const Navbar: FC<{ setRoute: (route: string) => void; currentRoute: string | null }> = ({ setRoute, currentRoute }) => {
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
        <NavItem href="#counter" label="Counter" currentRoute={currentRoute} setRoute={setRoute} routeName="counter" />
        <NavItem href="#voting" label="Voting" currentRoute={currentRoute} setRoute={setRoute} routeName="voting" />
        <NavItem href="#lottery" label="Lottery" currentRoute={currentRoute} setRoute={setRoute} routeName="lottery" />
      </ul>
    </aside>
  );
};

export const Layout: FC = () => {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const getRouteFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "voting") return "voting";
      if (hash === "lottery") return "lottery";
      return "counter";
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
      <div className={css(col, { h: "100vh", margin: "0", bg: "background.primary", width: "100vw" })}>
        <Header />
        <div className={css(row, { flexGrow: "1" })}>
          <Navbar setRoute={setRoute} currentRoute={route} />
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
              {route === "counter" && <CounterPage />}
              {route === "voting" && <VotingPage />}
              {route === "lottery" && <LotteryComp />}
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
