import React, { useState } from "react";
import { css } from "../../styled-system/css/index";
import { col } from "../atoms/layout";
import { heading } from "../atoms/text";

const Staking = () => {
  const [amount, setAmount] = useState("");

  const handleStake = () => {
    // Implement staking logic here
    console.log(`Staking ${amount} tokens`);
  };

  return (
    <main className={css(col, { p: "4" })}>
      <h1 className={heading({ l: 1, weight: "bold" })}>Staking</h1>
      <p>This is a placeholder for the Staking functionality.</p>
      <div className={css({ mt: "4", display: "flex", gap: "2", alignItems: "center" })}>
        <input
          type="number"
          placeholder="Enter amount to stake"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={css({
            p: "2",
            borderRadius: "md",
            border: "1px solid #333",
            backgroundColor: "#1A1D2C",
            color: "white",
          })}
        />
        <button
          onClick={handleStake}
          className={css({
            px: "4",
            py: "2",
            borderRadius: "9999px",
            backgroundColor: "#7E6AFF",
            color: "white",
            fontWeight: "500",
            fontSize: "14px",
            cursor: "pointer",
            _hover: { backgroundColor: "#4F46E5" },
          })}
        >
          Stake
        </button>
      </div>
    </main>
  );
};

export default Staking;
