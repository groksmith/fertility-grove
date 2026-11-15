import { expect, test } from "@playwright/test";

import { watchPageHealth } from "../fixtures/page-health";

// The member app, signed in as the established demo persona. There is no backend: picking a persona
// at /demo writes the prototype's state to this page's localStorage, which every route then reads.

const MEMBER_ROUTES = [
  "/feed",
  "/groups",
  "/stories",
  "/people",
  "/dashboard",
  "/learn",
  "/guide",
  "/credits",
  "/mentors",
  "/messages",
  "/notifications",
  "/family",
  "/settings",
  "/saved",
  "/posts/new",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Annie, six weeks in/ }).click();
  await expect(page).toHaveURL(/\/feed$/);
});

for (const route of MEMBER_ROUTES) {
  test(`${route} renders cleanly for a member`, async ({ page }) => {
    const health = watchPageHealth(page);
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator("h1").first()).toBeVisible();
    expect(health.problems).toEqual([]);
  });
}
