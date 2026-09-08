import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for gamification E2E coverage (test plan §5).
 * Assumes the backend (middlewareNode) is already running and reachable
 * at MIDDLEWARE_URL — these specs exercise real HTTP calls through the UI,
 * not mocked network responses.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false, // gamification specs share seeded DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
