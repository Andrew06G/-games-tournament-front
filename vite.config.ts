/// <reference types="vitest/config" />
import { defineConfig as testConfig } from "vitest/config";
import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
const config = defineConfig({plugins: [react()],});

const tsconfig = testConfig({test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  env: {
    VITE_API_URL: 'http://localhost:3000/api',
    VITE_SOCKET_URL: 'http://localhost:3000',
  },
  coverage: {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/main.tsx',
      'src/vite-env.d.ts',
      'src/test/**',
      'src/**/*.test.{ts,tsx}',
    ]
  }
},});

export default {
  ...config,
  ...tsconfig,
};