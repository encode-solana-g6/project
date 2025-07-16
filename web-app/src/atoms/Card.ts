import { cva } from "../../styled-system/css";

export const card = cva({
  base: {
    borderRadius: "16px",
    backgroundColor: "#1A1D2C",
    color: "#FFFFFF", // text.primary
  },
  variants: {
    mood: {
      positive: { color: "green", bg: "lightGreen" },
      highlight: {
        backgroundColor: "accent.primary",
      },
    },
    size: {
      small: { padding: "8px 12px", borderRadius: "8px" },
      medium: { padding: "24px" },
      large: { padding: "32px" },
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

export const bordered = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
  },
  variants: {
    mood: {
      accent: {
        borderColor: "#7E6AFF", // colors.accent.primary
        color: "#FFFFFF", // colors.text.primary
      },
      positive: {
        borderColor: "oklch(0.68 0.21 145 / 0.5)", // colors.positive with opacity in oklch
        color: "#22C55E", // colors.positive
      },
      negative: {
        borderColor: "#EF4444", // colors.negative
        color: "#EF4444", // colors.negative
      },
      secondary: {
        borderColor: "#1A1D2C", // colors.background.secondary
        color: "#FFFFFF", // colors.text.secondary
      },
    },
  },
});

// const className = css(
//   // returns the resolved style object
//   card.raw({ mood: "positive" })
// );

// => 'bg_red border_1px_solid_black color_white font-size_12px'
