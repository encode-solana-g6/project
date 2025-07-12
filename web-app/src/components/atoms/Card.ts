import { css, cx, cva } from "../../../styled-system/css";

// const baseCardStyles = css.raw({
//   borderRadius: "16px",
//   backgroundColor: "#1A1D2C",
//   padding: "24px",
//   color: "text.primary",
// });

// const overrideStyles = css.raw({
//   bg: "red",
//   color: "white",
// });

export const card = cva({
  base: {
    borderRadius: "16px",
    backgroundColor: "#1A1D2C",
    padding: "24px",
    color: "text.primary",
  },
  variants: {
    mood: {
      positive: { color: "green", bg: "lightGreen" },
    },
  },
});

const className = css(
  // returns the resolved style object
  card.raw({ mood: "positive" })
);

// => 'bg_red border_1px_solid_black color_white font-size_12px'
