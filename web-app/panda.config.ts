import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx,astro}", "./pages/**/*.{js,jsx,ts,tsx,astro}"],
  exclude: [],
  // Useful for theme customization
  theme: { extend: {} },
  // The output directory for your css system
  outdir: "styled-system",
});
