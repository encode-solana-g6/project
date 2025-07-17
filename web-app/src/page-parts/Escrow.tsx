import React, { useState } from "react";
import { css } from "../../styled-system/css/index";
import { col } from "../atoms/layout";
import { heading } from "../atoms/text";
import Button from "../atoms/Button"; // Assuming Button component exists

enum Token {
  Apple = "apple",
  Banana = "banana",
  Orange = "orange",
}

const Escrow = () => {
  const [tokenA, setTokenA] = useState<Token>(Token.Apple);
  const [amountA, setAmountA] = useState<string>("");
  const [tokenB, setTokenB] = useState<Token>(Token.Banana);
  const [amountB, setAmountB] = useState<string>("");

  const handlePlaceOffer = () => {
    console.log("Place Offer clicked:", {
      tokenA,
      amountA,
      tokenB,
      amountB,
    });
    // Further logic for placing the offer would go here
  };

  return (
    <main className={css(col, { p: "4", gap: "4" })}>
      <h1 className={heading({ l: 1, weight: "bold" })}>Escrow UI</h1>

      <div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4" })}>
        <div className={css(col, { gap: "4" })}>
          {" "}
          {/* Column 1: Token A & Amount A */}
          <div className={css(col, { gap: "2" })}>
            <label htmlFor="tokenA">Token A you deposit:</label>
            <select
              id="tokenA"
              value={tokenA}
              onChange={(e) => setTokenA(e.target.value as Token)}
              className={css({ p: "2", borderRadius: "md", bg: "background.secondary", color: "text.primary" })}
            >
              {Object.values(Token).map((token) => (
                <option key={token} value={token}>
                  {token.charAt(0).toUpperCase() + token.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className={css(col, { gap: "2" })}>
            <label htmlFor="amountA">Amount of Token A deposited:</label>
            <input
              id="amountA"
              type="number"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              className={css({ p: "2", borderRadius: "md", bg: "background.secondary", color: "text.primary" })}
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className={css(col, { gap: "4" })}>
          {" "}
          {/* Column 2: Token B & Amount B */}
          <div className={css(col, { gap: "2" })}>
            <label htmlFor="tokenB">Token B you ask for:</label>
            <select
              id="tokenB"
              value={tokenB}
              onChange={(e) => setTokenB(e.target.value as Token)}
              className={css({ p: "2", borderRadius: "md", bg: "background.secondary", color: "text.primary" })}
            >
              {Object.values(Token).map((token) => (
                <option key={token} value={token}>
                  {token.charAt(0).toUpperCase() + token.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className={css(col, { gap: "2" })}>
            <label htmlFor="amountB">Amount of Token B asked for:</label>
            <input
              id="amountB"
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              className={css({ p: "2", borderRadius: "md", bg: "background.secondary", color: "text.primary" })}
              placeholder="Enter amount"
            />
          </div>
        </div>
      </div>

      <Button onClick={handlePlaceOffer}>Place Offer</Button>
    </main>
  );
};

export default Escrow;
