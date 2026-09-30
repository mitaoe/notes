import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
