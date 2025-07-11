import React, { type FC } from "react";
import { css } from "../../styled-system/css";
import { WalletProviderComponent, WalletHeaderUI, WalletConnectUI } from "./Connect.tsx";

interface AppLayoutProps {
  children: React.ReactNode;
}

const Header: FC = () => {
  return (
    <header
      className={css({
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "gray.100",
        borderBottom: "1px solid",
        borderColor: "gray.200",
        _dark: { backgroundColor: "gray.900", borderColor: "gray.700" },
      })}
    >
      <div className={css({ display: "flex", gap: "1rem", alignItems: "center" })}>
        <WalletHeaderUI />
      </div>
    </header>
  );
};

const Navbar: FC = () => {
  return (
    <aside className={css({ w: "64", h: "100%", overflowY: "auto", py: "4", px: "3", bg: "gray.50", rounded: "lg", _dark: { bg: "gray.800" } })} aria-label="Sidebar">
      <ul className={css({ spaceY: "2" })}>
        <li>
          <a
            href="/counter"
            className={css({
              display: "flex",
              alignItems: "center",
              p: "2",
              fontSize: "base",
              fontWeight: "normal",
              color: "gray.900",
              rounded: "lg",
              _dark: { color: "white" },
              _hover: { bg: "gray.100", _dark: { bg: "gray.700" } },
            })}
          >
            <span className={css({ ml: "3" })}>Counter</span>
          </a>
        </li>
        <li>
          <a
            href="/voting"
            className={css({
              display: "flex",
              alignItems: "center",
              p: "2",
              fontSize: "base",
              fontWeight: "normal",
              color: "gray.900",
              rounded: "lg",
              _dark: { color: "white" },
              _hover: { bg: "gray.100", _dark: { bg: "gray.700" } },
            })}
          >
            <span className={css({ ml: "3" })}>Voting</span>
          </a>
        </li>
      </ul>
    </aside>
  );
};

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  return (
    <WalletProviderComponent>
      <div className={css({ height: "100vh", margin: "0", display: "flex", flexDirection: "column" })}>
        <Header />
        <div className={css({ display: "flex", flexGrow: "1" })}>
          <Navbar />
          <main className={css({ flexGrow: "1", p: "4", overflowY: "auto" })}>{children}</main>
        </div>
        <div
          className={css({
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            zIndex: "1000",
          })}
        >
          <WalletConnectUI />
        </div>
      </div>
    </WalletProviderComponent>
  );
};
