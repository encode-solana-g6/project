// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [nodePolyfills()],
    define: {
      "process.env.ANCHOR_BROWSER": "true",
    },
  },
});
