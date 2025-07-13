import React from "react";
import theme from "../../../../.clinerules/ui-theme.json";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const Button: React.FC<ButtonProps> = ({ children, variant = "primary", ...props }) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: theme.button.borderRadius,
    padding: theme.button.padding,
    fontWeight: theme.button.fontWeight,
    fontSize: theme.button.fontSize,
    border: "none",
    cursor: "pointer",
    color: theme.colors.text.primary,
  };

  const variantStyle: React.CSSProperties = {
    primary: {
      backgroundColor: theme.colors.accent.primary,
    },
    secondary: {
      backgroundColor: theme.colors.background.secondary,
    },
  }[variant];

  return (
    <button style={{ ...baseStyle, ...variantStyle }} {...props}>
      {children}
    </button>
  );
};

export default Button;
