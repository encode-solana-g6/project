import React, { useState, useEffect, type FC } from "react";
import { css } from "../styled-system/css/index";
import { AppWalletContextProvider, WalletHeaderUI, WalletCard } from "./components/Connect.tsx";
import CounterComp from "./components/Counter.tsx";
import VotingComp from "./components/Voting.tsx";

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
      <div className={css({ display: "flex", gap: "1rem", alignItems: "center" })}>
        <WalletHeaderUI />
      </div>
    </header>
  );
};

const Navbar: FC<{ setRoute: (route: string) => void }> = ({ setRoute }) => {
  return (
    <aside className={css({ w: "64", h: "100%", overflowY: "auto", py: "4", px: "3", bg: "background.secondary", rounded: "lg" })} aria-label="Sidebar">
      <ul className={css({ spaceY: "2" })}>
        <li>
          <a
            href="#counter"
            onClick={() => setRoute("counter")}
            className={css({
              display: "flex",
              alignItems: "center",
              p: "2",
              fontSize: "base",
              fontWeight: "normal",
              color: "text.primary",
              rounded: "lg",
              _hover: { bg: "accent.secondary" },
            })}
          >
            <span className={css({ ml: "3" })}>Counter</span>
          </a>
        </li>
        <li>
          <a
            href="#voting"
            onClick={() => setRoute("voting")}
            className={css({
              display: "flex",
              alignItems: "center",
              p: "2",
              fontSize: "base",
              fontWeight: "normal",
              color: "text.primary",
              rounded: "lg",
              _hover: { bg: "accent.secondary" },
            })}
          >
            <span className={css({ ml: "3" })}>Voting</span>
          </a>
        </li>
      </ul>
    </aside>
  );
};

export const ClientApp: FC = () => {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const getRouteFromHash = () => {
      const hash = window.location.hash.slice(1);
      return hash === "voting" ? "voting" : "counter";
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
    <AppWalletContextProvider>
      <div className={css({ height: "100vh", margin: "0", display: "flex", flexDirection: "column", bg: "background.primary" })}>
        <Header />
        <div className={css({ display: "flex", flexGrow: "1" })}>
          <Navbar setRoute={setRoute} />
          <main className={css({ flexGrow: "1", p: "4", overflowY: "auto" })}>
            {route === "counter" && <CounterComp />}
            {route === "voting" && <VotingComp />}
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
    </AppWalletContextProvider>
  );
};
