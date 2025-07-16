// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    define: {
      "process.env.ANCHOR_BROWSER": "true",
    },
  },
});
