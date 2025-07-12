import { css } from "../../../styled-system/css";

const baseCardStyles = css.raw({
  borderRadius: "16px",
  backgroundColor: "#1A1D2C",
  padding: "24px",
  color: "text.primary",
});

export const card = css(baseCardStyles);

export const borderedCard = (variant: "positive" | "secondary" | "accent") => {
  const colors = {
    positive: "positive",
    secondary: "text.secondary",
    accent: "accent.primary",
  };

  const borderStyles = css.raw({
    border: "1px solid",
    borderColor: colors[variant],
  });

  return css(baseCardStyles, borderStyles);
};
