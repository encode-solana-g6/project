// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
// import { Buffer } from "buffer";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    define: {
      "process.env.ANCHOR_BROWSER": "true",
      Buffer: { Buffer: Buffer },
    },
  },
});
