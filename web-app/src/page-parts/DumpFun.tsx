import React from "react";
import { css } from "../../styled-system/css/index";
import { col } from "../atoms/layout";
import { heading } from "../atoms/text";

const DumpFun = () => {
  return (
    <main className={css(col, { p: "4" })}>
      <h1 className={heading({ l: 1, weight: "bold" })}>dump.fun</h1>
    </main>
  );
};

export default DumpFun;
