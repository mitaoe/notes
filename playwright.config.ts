import { defineConfig } from '@playwright/test';

const PREVIEW_PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 },
  },
  use: {
    baseURL: `http://hostmachine:${PREVIEW_PORT}`,
    connectOptions: { wsEndpoint: 'ws://127.0.0.1:3000/' },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', grepInvert: /@mobile-only/, use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', grepInvert: /@desktop-only/, use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host --port ${PREVIEW_PORT} --strictPort`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
