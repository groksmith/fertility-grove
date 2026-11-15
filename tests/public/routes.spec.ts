import { expect, test } from "@playwright/test";

import { watchPageHealth } from "../fixtures/page-health";

// Every signed-out page renders, with no console error, CSP violation, uncaught exception or missing
// asset. This is the cheap net under the restructure-sensitive parts of the app: route groups, the
// public/assets/ paths and the security headers in next.config.ts.

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
  "/help",
  "/terms",
  "/privacy",
  "/community",
  "/demo",
  "/art",
];

for (const route of PUBLIC_ROUTES) {
  test(`${route} renders cleanly`, async ({ page }) => {
    const health = watchPageHealth(page);
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(health.problems).toEqual([]);
  });
}

test("security headers are set", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("old links redirect", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/feed$/);
});
