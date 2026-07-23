import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    globalSetup: './tests/global-setup.js',
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
