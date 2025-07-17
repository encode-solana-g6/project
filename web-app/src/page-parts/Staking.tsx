import React from "react";
import { css } from "../../styled-system/css/index";
import { col } from "../atoms/layout";
import { heading } from "../atoms/text";

const Staking = () => {
  return (
    <main className={css(col, { p: "4" })}>
      <h1 className={heading({ l: 1, weight: "bold" })}>Staking</h1>
      <p>This is a placeholder for the Staking functionality.</p>
    </main>
  );
};

export default Staking;
