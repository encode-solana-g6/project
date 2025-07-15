import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const Button: React.FC<ButtonProps> = ({ children, variant = "primary", ...props }) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: "8px",
    padding: "8px 16px",
    margin: "8px 0",
    fontWeight: "500",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    color: "oklch(100% 0 0 / 1)", // white, fully opaque
    transition: "background-color 0.3s ease",
    boxShadow: "0 2px 0 oklch(60% 0.1 282 / 0.2), 0 8px 24px oklch(60% 0.1 282 / 0.2)",
    display: "inline-block",
    textAlign: "center",
    textDecoration: "none",
    outline: "none",
  };

  const variantStyle: React.CSSProperties = {
    primary: {
      backgroundColor: "#7E6AFF",
    },
    secondary: {
      backgroundColor: "#1A1D2C",
    },
  }[variant];

  return (
    <button style={{ ...baseStyle, ...variantStyle }} {...props}>
      {children}
    </button>
  );
};

export default Button;
