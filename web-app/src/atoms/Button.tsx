import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const Button: React.FC<ButtonProps> = ({ children, variant = "primary", ...props }) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: "9999px",
    padding: "8px 16px",
    fontWeight: "500",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    color: "#FFFFFF",
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
