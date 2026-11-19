---
name: playwright-testing
description: Playwright 1.64 E2E for a Next.js 16 app with a server-side auth gate — public specs in CI, gated live specs (PW_LIVE, PW_ACCESS_TOKEN, PW_ALLOW_WRITES), responsive projects, storageState/cookie fixtures, aria snapshots, axe. Use when asked about "Playwright", "E2E", "responsiveness test", "test login flow", "file upload test", "auth in tests", "live/staging spec" or "fix flaky tests".
---

# Playwright Testing

Playwright is the **E2E layer only**. Pure logic and component behaviour go in Vitest
(`src/**/*.test.{ts,tsx}`, `yarn test`) — never assert pure logic through a browser. Vitest owns
`src/**`, Playwright owns `tests/**`. (Proxy matchers are unit-tested in Vitest with
`unstable_doesMiddlewareMatch` against `proxy.ts`'s `config` — auth skill.)

Baseline (Nov 2026) — verify against package.json: @playwright/test 1.64, @axe-core/playwright
4.14, next 16.4, react 19.3.

## Config (`playwright.config.ts`)

- `testDir: "./tests"`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 1 : 0`, `trace: "on-first-retry"`. `workers: 0` is rejected (1.60).
- **Pin `timezoneId` and `locale`** (e.g. `America/Los_Angeles`, `en-US` — a negative UTC offset surfaces date-only off-by-one bugs).
- **`webServer`** boots the app (`yarn dev`, or `yarn build && yarn start` in CI for prod-like runs) unless `PW_BASE_URL` is set, in which case tests target that deployment. `reuseExistingServer: !process.env.CI`.
- **Projects:**
  ```ts
  projects: [
    { name: "chromium", use: devices["Desktop Chrome"], testIgnore: /\.responsive\.spec\.ts/ },
    { name: "mobile",  use: devices["Pixel 7"],          testMatch: /\.responsive\.spec\.ts/ },
    { name: "tablet",  use: devices["Galaxy Tab S4"],    testMatch: /\.responsive\.spec\.ts/ },
    { name: "desktop", use: devices["Desktop Chrome"],   testMatch: /\.responsive\.spec\.ts/ },
  ]
  ```
  **Default — change if your project differs:** Chromium-engine devices only, so CI installs one browser. Add WebKit/Firefox projects (and install them in CI) if Safari matters.
  ⚠️ **1.64: device descriptors now forward `screen`.** `window.screen` and screen-based media queries now match the device, not the default. If a responsive spec should depend on the viewport only, spread the device and set `screen: undefined`.
- Video: `recordVideo` (the `videosPath` / `videoSize` context options were removed in 1.60); modes include `"retain-on-failure-and-retries"` (1.61).
- Flake tooling: `retryStrategy: "isolated"` (1.62) retries in a fresh worker; `--shuffle[=seed]` (1.64) exposes order dependence; `-G` is `--grep-invert`.

## Layers

| Dir / suffix | What | Runs |
|---|---|---|
| `tests/public/` | No-auth pages: auth pages render, responsive layout, email-link pages, security headers (`security.spec.ts`), axe scans | Always, incl. CI |
| `tests/smoke/*.smoke.spec.ts` | Read-only auth-gated journeys | `PW_LIVE=1` + `PW_ACCESS_TOKEN` |
| `tests/<feature>/` | Feature journeys on a signed-in page | Session-gated, skip by default |
| `*.live.spec.ts` that **write** | Signup, checkout, anything that creates data | `PW_LIVE=1 PW_ALLOW_WRITES=1`, never CI |

CI runs `yarn test:e2e tests/public` after `npx playwright install --with-deps chromium`.
Everything else is opt-in.

## Sessions — the part that bites

With `requireSession()` in a **server** layout, `page.route` cannot fake auth: a real token must
reach the Next server as the access cookie. Provide fixtures in `tests/fixtures/`:

```ts
// tests/fixtures/auth.ts
import { test as base, expect } from "@playwright/test";
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const token = process.env.PW_ACCESS_TOKEN;
    if (token) await context.addCookies([{ name: AUTH_COOKIE, value: token, url: baseURL! }]);
    await use(context);
  },
});
export const requireLiveSession = (t: typeof test) =>
  t.skip(!process.env.PW_LIVE || !process.env.PW_ACCESS_TOKEN, "needs PW_LIVE + PW_ACCESS_TOKEN");
export const requireLiveWriteSession = (t: typeof test) => {
  requireLiveSession(t);
  t.skip(!process.env.PW_ALLOW_WRITES, "writes need PW_ALLOW_WRITES=1");
};
export { expect };
```

- Gated specs import `test` / `expect` from the fixture, not `@playwright/test`, and call `requireLiveSession(test)` at the top.
- **A signed-up throwaway user** can be saved with `context.storageState({ path: "playwright/.auth/user.json" })` (gitignore `playwright/.auth/`) and reused via `test.use({ storageState })`; re-sign in over the API when the cookie nears expiry. For many specs, a **setup project** with `dependencies: ["setup"]` is the idiom. `apiRequestContext` has `cookies()` / `addCookies()` / `clearCookies()` (1.64) for API-side sign-in.
- `storageState` keeps cookies + localStorage (and IndexedDB with `indexedDB: true`), **not sessionStorage**. If the refresh token lives there, tests run inside the access-token lifetime; to exercise refresh, use `page.sessionStorage` (WebStorage API, 1.61 — see the API reference for its methods) or restore it with `page.addInitScript`.
- Writes against a live backend are double-gated, must be reversible or use throwaway accounts, and never run in CI. A token in the shell must never let a read-only run mutate data.
- Read routes like the post-login landing from `src/config/auth.ts`, don't hard-code them.
- **Optional — signed-in journeys locally, no real backend.** Make `webServer` an array: a small mock
  backend first (on the origin `NEXT_PUBLIC_API_URL` points at), then `yarn dev`. Gate those specs on
  `PW_MOCK_API=1` and **sign in through the UI**, so the real cookie the mock issues reaches
  `requireSession()` — a cookie faked into the context is rejected by the server gate. Good for
  create → 422-on-a-field → edit → delete journeys in CI without staging.

## Writing specs

**Locators:** `getByRole(…, { name })` (1.60 adds `{ description }`) → `getByLabel` → `getByText` → `getByTestId` (a `data-testid` only when nothing semantic works — sonner's per-toast `testId` prop is one such case). No CSS classes, `nth-child`, or XPath. If a control can't be found by role and name, that's an a11y bug — fix the component. Filter to visible matches with **`locator.visible()`** (1.63), not the `:visible` pseudo-class; scope with `locator.within()` (1.64) where a container makes intent clearer. Don't match React `useId` strings — the prefix changed to `_r_` in React 19.2.

**Assertions are web-first and retrying:** `toBeVisible`, `toHaveURL`, `toHaveText`, `toBeFocused`, `toHaveCount`, `toHaveAccessibleName`. For a measured value use `expect.poll(() => …)` (`expect.soft.poll` for non-fatal). Never `waitForTimeout`; avoid `waitForLoadState("networkidle")` — wait for the UI or `page.waitForResponse(pred)`. Always `await` actions and assertions. Biome 2.6's `noPlaywrightMissingAwait` (on through the
`playwright` linter domain in the kit's `biome.json`, with `yarn lint` covering `tests/`) catches
un-awaited web-first assertions such as `expect(page).toHaveURL()` — not every un-awaited action
(`page.goto()` slips through), so read for it in review.

**Hidden iframes (1.64):** elements inside a hidden iframe now count as hidden for `isVisible`, `toBeVisible` and actions — a test that clicked into an off-screen embed now fails; make the frame visible first.

**Structure:** one user question per test; `test.step(title, body, { timeout, skip, subtitle, params })` for readable traces — `params` (1.63) records the step's inputs. When animations get in the way, `test.use({ reducedMotion: "reduce" })` — a standalone test option since 1.63, alongside `forcedColors` and `contrast`.

**Accessibility structure:** `await expect(page.getByRole("dialog")).toMatchAriaSnapshot(\`…\`)` checks roles/names without pixels; `expect(page).toMatchAriaSnapshot()` works on a whole page (1.60), and `page.ariaSnapshot({ depth, mode })` limits scope.

**Accessibility scans (`@axe-core/playwright`, dev dependency):**

```ts
import AxeBuilder from "@axe-core/playwright";
test("login has no axe violations", async ({ page }) => {
  await page.goto("/login");
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]) // add the WCAG 2.2 tag per axe's tag list
    .analyze();
  expect(violations).toEqual([]);
});
```

It injects into every frame, cross-origin included. axe 4.14 enables **`label-content-name-mismatch`** by default: an icon button whose `aria-label` doesn't contain its visible text now fails — a real WCAG 2.5.3 issue, fix the label. Drop `landmark-complementary-is-top-level` from any rule list (deprecated in 4.12). Component-level axe checks still belong in Vitest; page-level scans of public pages go here.

**Visual:** prefer aria snapshots and layout assertions. If you add `toHaveScreenshot`, mask dynamic regions, pin the project, and expect per-platform baselines (CI is usually Linux). WebP baselines (`.webp` names, 1.62) are smaller. **`--update-snapshots=missing` now passes the run** (1.64) — use it to seed new baselines in CI without failing; the old default mode is named `"default"`.

**Responsive:** name the file `*.responsive.spec.ts` and write one viewport-agnostic test — the projects run it per viewport. Useful checks: no horizontal overflow (`scrollWidth - clientWidth ≤ 1`), primary tap targets ≥ 44px, nav switches to its mobile form.

**Network:** `page.route` shapes backend responses on an already-authenticated page; it does not fake the session. `route.fetch()` + `route.fulfill({ response, json })` to modify a real response.

**Uploads/downloads:** `locator.setInputFiles(path | { name, mimeType, buffer })`; start `page.waitForEvent("download")` before the click.

**Clock:** `page.clock.install({ time })` / `page.clock.fastForward()` for timers and session expiry instead of waiting.

**Next.js:** routes stay mounted after navigation (`<Activity>`), so state and an open dialog can reappear on Back — assert what the user sees, not that state reset. For Instant Navigations, `@next/playwright` provides an `instant()` helper (Next 16.3).

## Running

```bash
yarn test:e2e tests/public                          # what CI runs
yarn test:e2e tests/public --project=mobile         # one form factor
yarn test:e2e:ui                                    # UI mode
yarn test:e2e tests/public --shuffle --repeat-each=5   # flake hunt
PW_LIVE=1 PW_ACCESS_TOKEN=<jwt> PW_BASE_URL=<staging-url> yarn test:e2e tests/smoke
PW_LIVE=1 PW_ALLOW_WRITES=1 yarn test:e2e tests/smoke/<name>.live.spec.ts --project=chromium
yarn playwright show-trace test-results/<…>/trace.zip
```

Next 16's `next dev` writes `.next/dev`, so a production build beside the webServer's dev server
no longer clobbers it; use a separate `distDir` only if you still see unstyled pages or 500s
everywhere (then stop the server, `rm -rf .next`, restart).

**Agents and tooling:** since 1.62 Playwright bundles its MCP server and CLI
(`npx playwright mcp`, `npx playwright cli`); `npx playwright init-agents --loop=claude` scaffolds
test-planning/generation/healing agents. Treat generated specs like any other: role locators, the
fixtures above, the gating rules.

## Flakes

Never fix by raising a timeout. Find the race: asserting before a query settles (assert on the
rendered result), a cold dev-server compile (`expect.poll`, or test a prod build), shared live
account state across parallel tests (`test.describe.configure({ mode: "serial" })` for one
account's journey), order dependence (`--shuffle`), animation (reduced motion), or a modal still
transitioning (assert on the top dialog by role and name). A test that passes once and fails once
is failing.
