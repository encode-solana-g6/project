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
    level: {
      h1: { fontSize: "4xl", fontWeight: "bold" }, // Example sizes, adjust as needed
      h2: { fontSize: "3xl", fontWeight: "bold" },
      h3: { fontSize: "2xl", fontWeight: "bold" },
      h4: { fontSize: "xl", fontWeight: "semibold" },
      h5: { fontSize: "lg", fontWeight: "semibold" },
      h6: { fontSize: "md", fontWeight: "semibold" },
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
    level: "h1",
    weight: "normal",
  },
});
