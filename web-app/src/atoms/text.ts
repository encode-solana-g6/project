import { cva } from "../../styled-system/css";

export const heading = cva({
  base: {
    fontFamily: "sans-serif", // Assuming a default sans-serif font
  },
  variants: {
    color: {
      primary: { color: "text.primary" },
      secondary: { color: "text.secondary" },
      accent: { color: "text.accent" },
      positive: { color: "positive" },
      negative: { color: "negative" },
    },
    l: {
      1: { fontSize: "3xl", fontWeight: "bold" }, // Example sizes, adjust as needed
      2: { fontSize: "2xl", fontWeight: "bold" },
      3: { fontSize: "1.5xl", fontWeight: "bold" },
      4: { fontSize: "xl", fontWeight: "semibold" },
      5: { fontSize: "lg", fontWeight: "semibold" },
      6: { fontSize: "md", fontWeight: "semibold" },
    },
    weight: {
      light: { fontWeight: "light" },
      normal: { fontWeight: "normal" },
      semibold: { fontWeight: "semibold" },
      bold: { fontWeight: "bold" },
      extrabold: { fontWeight: "extrabold" },
    },
  },
  defaultVariants: {
    color: "primary",
    l: "h1",
    weight: "normal",
  },
});
