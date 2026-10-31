import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  // `next dev` compiles each route on first hit, so allow generous timeouts.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Use a system Chromium when provided (e.g. sandboxed CI images).
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 740 } }, grep: /@mobile/ },
  ],
  webServer: {
    // E2E runs against `next dev`: the dev-login provider is only allowed when
    // NODE_ENV=development on localhost (see src/lib/dev-login.ts). The production
    // build is verified separately by `npm run build` in the quality gate.
    command: `npx next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ENABLE_DEV_LOGIN: "true", NEXTAUTH_URL: baseURL },
  },
});
