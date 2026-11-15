import { defineConfig, devices } from "@playwright/test";

// End-to-end (real-browser) tests. Pure-logic suites live in Vitest (`src/**/*.test.ts`, run with
// `yarn test`); this config owns only browser-level specs under `tests/`.
//
// Layout under tests/:
//   public/ — signed-out journeys (landing, auth, legal, community) against a booted app.
//   app/    — member journeys. The prototype has no backend: a spec signs in by picking a demo
//             persona at /demo, and the state lives in that page's localStorage.
//
// Responsive coverage runs the SAME `*.responsive.spec.ts` files across mobile/tablet/desktop via the
// per-viewport projects below; every other spec runs once on desktop chromium.

// Pin a deterministic timezone + locale so date-sensitive rendering is reproducible across machines
// and CI. Set before Playwright forks its workers so they inherit it.
process.env.TZ = "America/Los_Angeles";

// When PW_BASE_URL is set (e.g. a preview deploy), test that deployment and do NOT boot a local
// server. Otherwise boot the app locally so `yarn test:e2e` is self-contained.
const externalBaseUrl = process.env.PW_BASE_URL;
const port = Number(process.env.PW_PORT ?? 3100);
const baseURL = externalBaseUrl ?? `http://localhost:${port}`;

const RESPONSIVE = /\.responsive\.spec\.ts$/;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    timezoneId: "America/Los_Angeles",
    locale: "en-US",
  },
  projects: [
    // Desktop runs every spec EXCEPT the responsive matrix (those run on all three viewports below).
    {
      name: "chromium",
      testIgnore: RESPONSIVE,
      use: { ...devices["Desktop Chrome"] },
    },
    { name: "mobile", testMatch: RESPONSIVE, use: { ...devices["Pixel 5"] } },
    // Galaxy Tab S4 is a Chromium-engine tablet (iPad devices default to WebKit, which would need a
    // separate browser install). Keeps the whole matrix on the one installed engine.
    { name: "tablet", testMatch: RESPONSIVE, use: { ...devices["Galaxy Tab S4"] } },
    { name: "desktop", testMatch: RESPONSIVE, use: { ...devices["Desktop Chrome"] } },
  ],
  // Boot the app for local runs on its own port and dist dir, so it never collides with a dev server
  // you already have open on :3000 (two servers sharing `.next/` overwrite each other's manifests).
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `NEXT_DIST_DIR=.next-e2e yarn dev -p ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
