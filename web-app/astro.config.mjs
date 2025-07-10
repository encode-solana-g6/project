// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import panda from '@pandacss/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), panda()]
});
