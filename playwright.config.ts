import { defineConfig } from '@playwright/test';

const PORT = 8799;
export default defineConfig({
  testDir: 'e2e',
  timeout: 240_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? undefined, args: ['--autoplay-policy=no-user-gesture-required'] },
    viewport: { width: 960, height: 600 },
  },
  webServer: {
    command: 'npx vite build --logLevel warn && npx tsx src/server/index.ts',
    env: { ...process.env, PORT: String(PORT), KK_ALLOW_DEBUG: '1' },
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
