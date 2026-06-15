/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Chemin de publication : GitHub Pages sert le site sous /<nom-du-dépôt>/.
// Surchargez-le avec BASE_PATH (ex. BASE_PATH=/ pour un hébergement à la racine).
const base = process.env.BASE_PATH ?? '/ai-usecase-factory/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
});
