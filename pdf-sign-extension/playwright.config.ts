import { defineConfig, devices } from '@playwright/test'

// Drives the *built* extension (dist/) as a plain web page via a static server,
// with chrome.* shimmed in the test. This verifies the real product flow
// (open PDF -> sign/fill -> export) without needing a headed browser or the
// extension runtime. Run `npm run build` first.
const PORT = 5178

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    acceptDownloads: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node tests/static-server.mjs`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 15_000,
    env: { PORT: String(PORT) },
  },
})
