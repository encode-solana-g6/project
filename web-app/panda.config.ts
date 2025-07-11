import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,
  include: ["./src/**/*.{ts,tsx,js,jsx,astro}", "./pages/**/*.{ts,tsx,js,jsx,astro}"],
  exclude: [],
  // Useful for theme customization
  theme: { extend: {} },
  // The output directory for your css system
  outdir: "styled-system",
});
