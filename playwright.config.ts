import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for MomDaily E2E.
 *
 * Run locally:
 *   npm run e2e:install   # one-time, downloads browsers
 *   npm run dev           # in one terminal
 *   npm run e2e           # in another
 *
 * CI: the webServer block below starts `npm run dev` for you, so just
 * `npm run e2e` works in CI as long as DATABASE_URL is set.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // db state is shared; serial is safer for now
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
