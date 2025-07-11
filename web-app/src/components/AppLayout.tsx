import React, { type FC } from "react";
import { css } from "../../styled-system/css";
import { WalletProviderComponent } from "./Connect.tsx";
import Navbar from "./Navbar.astro";
import Header from "./Header.astro";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  return (
    <WalletProviderComponent>
      <div className={css({ height: "100vh", margin: "0", display: "flex", flexDirection: "column" })}>
        <Header client:load />
        <div className={css({ display: "flex", flexGrow: "1" })}>
          <Navbar client:load />
          <main className={css({ flexGrow: "1", p: "4", overflowY: "auto" })}>{children}</main>
        </div>
      </div>
    </WalletProviderComponent>
  );
};
