import React from "react";
import { css } from "../../styled-system/css/index";
import { col } from "../atoms/layout";
import { heading, Heading } from "../atoms/text.tsx"; // Import Heading component
import { row } from "../atoms/layout"; // Import row for layout
import { MultiButton } from "../atoms/Button"; // Assuming MultiButton can be adapted for dropdowns, or I'll create a new one.
import { AppNetwork } from "../components/Connect.tsx";

const DumpFun = () => {
  return (
    <main className={css(col, { p: "4", gap: "1rem" })}>
      <Heading l={1} weight="bold" className={css({ textAlign: "center", mb: "2rem" })}>
        Create <span className={css({ color: "accent.primary" })}>Token</span>
      </Heading>

      <div className={css(row, { gap: "1rem", flexWrap: "wrap", justifyContent: "center" })}>
        <input
          type="text"
          placeholder="Token Name"
          className={css({
            flex: "1",
            minWidth: "200px",
            p: "0.5rem",
            borderRadius: "md",
            border: "1px solid",
            borderColor: "accent.primary",
            backgroundColor: "background.secondary",
            color: "text.primary",
            "&::placeholder": { color: "text.secondary" },
          })}
        />
        <input
          type="text"
          placeholder="Symbol"
          className={css({
            flex: "1",
            minWidth: "200px",
            p: "0.5rem",
            borderRadius: "md",
            border: "1px solid",
            borderColor: "accent.primary",
            backgroundColor: "background.secondary",
            color: "text.primary",
            "&::placeholder": { color: "text.secondary" },
          })}
        />
      </div>

      <div className={css(row, { gap: "1rem", flexWrap: "wrap", justifyContent: "center" })}>
        <input
          type="text"
          placeholder="Total Supply"
          className={css({
            flex: "1",
            minWidth: "200px",
            p: "0.5rem",
            borderRadius: "md",
            border: "1px solid",
            borderColor: "accent.primary",
            backgroundColor: "background.secondary",
            color: "text.primary",
            "&::placeholder": { color: "text.secondary" },
          })}
        />
        <select
          className={css({
            flex: "1",
            minWidth: "200px",
            p: "0.5rem",
            borderRadius: "md",
            border: "1px solid",
            borderColor: "accent.primary",
            backgroundColor: "background.secondary",
            color: "text.primary",
            appearance: "none", // Remove default arrow
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23FFFFFF' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.5em",
          })}
        >
          <option>18 decimals</option>
          {/* Add more decimal options if needed */}
        </select>
      </div>

      <select
        className={css({
          width: "100%",
          p: "0.5rem",
          borderRadius: "md",
          border: "1px solid",
          borderColor: "accent.primary",
          backgroundColor: "background.secondary",
          color: "text.primary",
          appearance: "none", // Remove default arrow
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23FFFFFF' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.5rem center",
          backgroundSize: "1.5em",
          mt: "1rem",
          mb: "1rem",
        })}
      >
        <option value={AppNetwork.Local}>Localhost</option>
        <option value={AppNetwork.Devnet}>Devnet</option>
        <option value={AppNetwork.Testnet}>Testnet</option>
      </select>

      <div className={css(col, { gap: "0.5rem", alignItems: "center" })}>
        <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", color: "text.primary" })}>
          <input type="checkbox" defaultChecked />
          Add to Uniswap
        </label>
        <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", color: "text.primary" })}>
          <input type="checkbox" defaultChecked />
          Pausable
        </label>
        <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", color: "text.primary" })}>
          <input type="checkbox" defaultChecked />
          Mintable
        </label>
      </div>

      <button
        className={css({
          mt: "2rem",
          p: "0.8rem 2rem",
          borderRadius: "full",
          backgroundColor: "accent.primary",
          color: "white",
          fontSize: "lg",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          justifyContent: "center",
          _hover: { backgroundColor: "accent.secondary" },
          cursor: "pointer",
        })}
      >
        Launch Token{" "}
        <span role="img" aria-label="rocket">
          🚀
        </span>
      </button>
    </main>
  );
};

export default DumpFun;
