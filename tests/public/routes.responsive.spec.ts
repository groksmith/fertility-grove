import { expect, test } from "@playwright/test";

// Responsive smoke — runs on the mobile / tablet / desktop projects (see playwright.config.ts). The
// same assertions execute at each form factor, catching horizontal overflow on the entry points
// without a per-viewport loop inside the test.

for (const route of ["/", "/login", "/signup", "/community"]) {
  test(`${route} has no horizontal overflow`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    // Allow 1px for sub-pixel rounding; anything more means the layout pushes the page sideways.
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
