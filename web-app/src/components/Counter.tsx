import React, { useState } from "react";
import { css } from "../../styled-system/css";

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  return (
    <div className={css({ border: "2px solid token(colors.purple.500)", padding: "4", borderRadius: "md" })}>
      <h2>Counter: {count}</h2>
      <button type="button" onClick={increment}>
        Increment
      </button>
      <button type="button" onClick={decrement}>
        Decrement
      </button>
    </div>
  );
}

export default Counter;
