import { cva, css } from "../../styled-system/css";
import React, { type FC } from "react";

export const heading = cva({
  base: {
    fontFamily: "sans-serif", // Assuming a default sans-serif font
    mb: "0.5em",
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
    l: 1,
    weight: "normal",
  },
});

type HeadingProps = {
  l?: 1 | 2 | 3 | 4 | 5 | 6;
  weight?: "light" | "normal" | "semibold" | "bold" | "extrabold";
  color?: "primary" | "secondary" | "accent" | "positive" | "negative";
  children: React.ReactNode;
  className?: string;
};

export const Heading: FC<HeadingProps> = ({ l, weight, color, children, className }) => {
  return <h1 className={css(heading.raw({ l, weight, color })) + (className ? ` ${className}` : "")}>{children}</h1>;
};
