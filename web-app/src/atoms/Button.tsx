import React from "react";
import { cva } from "../../styled-system/css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const buttonStyle = cva({
  base: {
    borderRadius: "8px",
    padding: "8px 16px",
    margin: "8px 0",
    fontWeight: "500",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    color: "oklch(100% 0 0 / 1)", // white, fully opaque
    transition: "background-color 0.15s ease",
    boxShadow: "0 2px 0 oklch(60% 0.1 282 / 0.3), 0 0 1rem oklch(60% 0.1 282 / 0.2)",
    display: "inline-block",
    textAlign: "center",
    textDecoration: "none",
    outline: "none",
    "&:hover": {
      backgroundColor: "#6A5CD2", // A slightly darker shade for hover effect
    },
  },
  variants: {
    variant: {
      primary: {
        backgroundColor: "#7E6AFF",
        "&:hover": {
          backgroundColor: "#6A5CD2", // Primary hover color
        },
      },
      secondary: {
        backgroundColor: "#1A1D2C",
        "&:hover": {
          backgroundColor: "#2C314A", // Secondary hover color
        },
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

const Button: React.FC<ButtonProps> = ({ children, variant, ...props }) => {
  return (
    <button className={buttonStyle({ variant })} {...props}>
      {children}
    </button>
  );
};

export default Button;
