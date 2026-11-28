import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL?.trim() || undefined,
  base: process.env.SITE_BASE?.trim() || '/',
  output: 'static',
  integrations: [mdx(), react()],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
  vite: {
    plugins: [tailwind()],
  },
  devToolbar: { enabled: false },
});
