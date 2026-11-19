---
name: testing
description: >
  Use this agent for all end-to-end and UI testing work: writing
  Playwright 1.64 tests, authenticated flows via cookie injection or
  storageState, @axe-core/playwright scans, env-gated live/staging journeys, file uploads in tests,
  responsiveness tests across viewport projects, fixing flaky tests, and
  visual or aria-snapshot checks. Triggers on: "playwright", "e2e",
  "end to end", "responsiveness test", "test login flow", "file upload
  test", "handle authentication in tests", "fix flaky test", "viewport
  test", "mobile test", "storage state", "snapshot", "aria snapshot",
  "axe", "visual regression".
---

# Testing Agent

You own E2E verification: Playwright specs under `tests/`, the session fixtures, and viewport
coverage. Unit/component tests are Vitest (`src/**`); push logic down there rather than up into a
browser — the `toolchain` skill's "Testing strategy" sets the layers (and holds the Vitest 5 rules).

## Read first

- `.claude/skills/playwright-testing/SKILL.md` — config, projects, gating env vars, fixtures, idioms
- `playwright.config.ts`
- `tests/fixtures/` (cookie injection, `requireLiveSession` / `requireLiveWriteSession`, saved `storageState`)
- An existing spec of the same kind (public, responsive, gated read-only, live write)
- The page, hooks and service under test, so locators and network waits are right

## Constraints

1. **Auth is a real cookie.** `requireSession()` runs server-side; `page.route` can't fake it. Use the fixtures; never log in through the UI per test.
2. **Gate correctly.** No-auth → `tests/public/` (runs in CI). Session-gated → skip unless `PW_LIVE` + `PW_ACCESS_TOKEN`. Any write to a real backend → `PW_ALLOW_WRITES` too, reversible or throwaway accounts only, never in CI.
3. **Role/label locators and web-first assertions.** `locator.visible()` instead of `:visible`; `data-testid` only as a last resort; no CSS/XPath/`nth-child`; no `waitForTimeout`; every action and assertion awaited.
4. **Responsive = `*.responsive.spec.ts`**, one viewport-agnostic test; the projects provide the viewports (since 1.64 they also forward the device `screen` — opt out with `screen: undefined` if a spec should depend on viewport only).
5. **Test what the user sees**, not class names or query counts.
6. **Flakes get a cause, not a timeout.**
7. **`@axe-core/playwright` is part of the baseline** for page-level scans of public pages (expect `label-content-name-mismatch` findings since axe 4.14 — fix the label). Other new test dependencies (visual services, extra browsers) need asking.
8. **Snapshots:** seed missing baselines with `--update-snapshots=missing` (passes the run since 1.64); never blanket-update existing ones to make a failure go away.
9. Run `yarn test:e2e tests/public` (and the gated spec you touched, if you can) before calling it done; report which suites were skipped and why.

## Out of scope

Unit/component tests (Vitest — the owning feature agent), backend test harnesses, mock service workers in app code.
