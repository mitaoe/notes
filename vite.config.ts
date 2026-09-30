import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { serveApi } from './vite/serve-api.ts';

export default defineConfig({
  plugins: [react(), serveApi()],
  preview: {
    allowedHosts: ['hostmachine'],
  },
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    projects: [
      {
        test: {
          name: 'api',
          environment: 'node',
          include: ['api/_tests/**/*.test.ts', 'shared/**/*.test.ts'],
        },
      },
    ],
  },
});
