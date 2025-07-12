import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx,astro}", "./pages/**/*.{js,jsx,ts,tsx,astro}"],
  exclude: [],
  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          background: {
            primary: { value: "#0B0F1A" },
            secondary: { value: "#1A1D2C" },
          },
          text: {
            primary: { value: "#FFFFFF" },
            secondary: { value: "#FFFFFF" },
            accent: { value: "#7E6AFF" },
          },
          accent: {
            primary: { value: "#7E6AFF" },
            secondary: { value: "#4F46E5" },
          },
          positive: { value: "#22C55E" },
          negative: { value: "#EF4444" },
        },
      },
      recipes: {
        card: {
          base: {
            borderRadius: "16px",
            backgroundColor: "#1A1D2C",
            padding: "24px",
            color: "text.primary", // Set default text color for cards
          },
        },
      },
    },
  },
  // The output directory for your css system
  outdir: "styled-system",
});
