import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
    include: ['**/__tests__/**/*.test.{js,jsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(process.cwd()) },
  },
});
