---
name: toolchain
description: Toolchain for a Next.js 16 + TypeScript 7 + Biome 2.6 + Vitest 5 app — starter configs, async request APIs and `next typegen`, Turbopack, dev and build side by side, the detached dev-server script, layered test strategy and Vitest 5 rules, standalone deploy notes. Use when setting up or upgrading, editing a config, writing a Vitest test, or a dev/build/test command misbehaves.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Toolchain

`CLAUDE.md` lists the commands; this skill holds the detail behind them. Baseline (Nov 2026) —
verify against package.json: next 16.4, react 19.3, typescript 7.0, @biomejs/biome 2.6, vitest 5
(+ vite ≥ 6.4), jsdom 30, @playwright/test 1.64. **Node ≥ 22.22 (or 24.15+) in dev and CI**: jsdom 30
needs it (via undici 8; yarn hard-fails on an older engine). Vitest 5 alone needs 22.12, Next 20.9.
On an older 22.x, pin `jsdom@^29`. New app from scratch: kit README step 0.

## Next 16 basics

- Request APIs are async: `await cookies()`, `await headers()`, `await params`, `await searchParams`.
- `npx next typegen` generates the global `PageProps<"/route">`, `LayoutProps` and `RouteContext`
  helpers — use them instead of hand-written prop types.
- `next dev` keeps a version-matched block in `AGENTS.md` pointing agents at the installed Next docs
  (`node_modules/next/dist/docs/`). Leave it in place.
- **Turbopack is the default** for `next dev` and `next build`: don't add `--turbopack`, and don't add
  a `webpack` config — `next build` fails when one is present (detail: `perf` → Build toolchain).
- `next build` no longer runs a linter and `next lint` is gone. Biome is the linter: `yarn lint`
  locally, `biome ci` in CI. `next build` type-checks through the `tsc` CLI.

## Commands — how to read them

- Check results by **exit code**, not by the last lines of output — Vitest exits 1 on an unhandled
  error even when every test passed.
- **Dev and build can run side by side.** `next dev` writes to `.next/dev`, so plain `yarn build` is
  fine while a dev server is up, and a lock file stops two `next dev` (or two `next build`) runs on the
  same project. Use a separate `NEXT_DIST_DIR` (the config template's env-overridable `distDir`) only if
  a build still breaks a running dev server.
- `yarn analyze` = `next analyze` (Turbopack bundle analyzer) — `perf`.

### Detached dev server — `scripts/dev-server.sh [port] [log]`

⚠️ A dev server started as `yarn dev &` dies with the shell that launched it. It stays in that
shell's process group; tearing the shell down signals the group, yarn forwards it, and `next dev`
exits *cleanly* — a tidy "Done" in the log and no error, so it reads as "the app randomly stopped".
`nohup` does not help (the signal is SIGTERM, not SIGHUP).

Provide `scripts/dev-server.sh`, which:

1. checks for a LISTENING socket on the port first, and is a no-op if the port already serves;
2. double-forks into its own session (`setsid`, or a Python `os.setsid()` double-fork on macOS, which
   has no `setsid`);
3. writes output to the log path.

A **second** dev server on the same project needs its own `NEXT_DIST_DIR`, because the dev lock file
refuses a second instance in the same dir.

## Testing strategy (layered)

A pyramid, thinnest at the top. Match a new test to the layer that fits — don't push logic up into E2E.

- **Unit + property (Vitest, `src/**/*.test.{ts,tsx}`, node env)** — the widest layer: pure logic,
  validation, Zod schemas, `lib/` helpers, `proxy.ts` (matcher tests use
  `unstable_doesMiddlewareMatch({ config, url })` from `next/experimental/testing/server` — still named
  for middleware in 16.4; pass `proxy.ts`'s exported `config`), and **fast-check property tests**
  (invariants + input fuzzing). No browser, no backend; the Vitest config injects test values for the
  `NEXT_PUBLIC_*` env so config imports don't throw.
- **Guards (Vitest, source scans)** — rules that must hold in every file, including files with no test
  of their own: `src/architecture.test.ts` and the `src/styles/*.test.ts` files (kit:
  `templates/guards/`).
- **Component (Vitest + jsdom + Testing Library, opt in per file with `// @vitest-environment jsdom`)**
  — variants, validation display, adversarial input (emoji, RTL, script tags rendered as inert text),
  and an `axe-core` assertion. Stub heavy client-only barrels with `vi.mock`.
- **E2E (Playwright, `tests/`)** — `tests/public/` runs no-auth journeys against the booted app;
  `*.responsive.spec.ts` run across mobile/tablet/desktop projects; auth-gated journeys skip by
  default and run only with an opt-in env (`PW_LIVE=1` + a token, or a base URL pointing at staging);
  page-level a11y uses `AxeBuilder` from `@axe-core/playwright`. Playwright 1.64 rules (`locator.visible()`,
  `test.step` params, aria snapshots, device `screen` forwarding, hidden iframes, axe
  `label-content-name-mismatch`) → `playwright-testing`.

Runners are split by directory: Vitest owns `src/**`, Playwright owns `tests/**`. Pure logic belongs
in Vitest, never smuggled through Playwright. CI: a fast `quality` job (typecheck + lint + Vitest) on
every PR, plus a public E2E job.

### Vitest 5 rules

- Install `vite` (≥ 6.4) next to it. Name the config `vitest.config.mts` (no `"type": "module"` in a
  create-next-app package.json, so Vite 8 warns about a `.ts` ESM config).
- **TZ is pinned in the config** (`process.env.TZ = …` at the top of `vitest.config.mts`; workers
  inherit it) rather than `TZ=… vitest` in a script, which Windows shells don't understand. Keep it
  equal to Playwright's `timezoneId`.
- **`server-only`**: Next aliases it during a build; Vitest doesn't, and the real package throws
  outside the react-server condition. Install it (`yarn add server-only`) and alias it in the config
  to an empty module (`src/test-utils/server-only.ts`) so server leaves (`features/<x>/server.ts`,
  `lib/http.server.ts`) are unit-testable.
- No `@testing-library/jest-dom` in the baseline: assert on attributes and `textContent`
  (`input.getAttribute("aria-invalid")`), or add jest-dom plus a `setupFiles` entry deliberately.
- `vi.mock`, `vi.unmock` and `vi.hoisted` go at the **top level** of the file only (nesting them now
  throws); `vi.doMock` can go anywhere.
- Always `await` `.resolves` / `.rejects` — an unawaited one fails the test.
- `clearMocks` is on by default: drop manual `vi.clearAllMocks()` in `beforeEach`.
- In browser mode `toHaveTextContent` is exact-match; use `toMatchTextContent` for partial or regex.
- Reports, attachments and the json/junit output go under `.vitest/` — add it to `.gitignore`.
- Don't assert on `useId`-generated ids (prefix `_r_` since React 19.2). Worked examples: `scaffold`
  (service/hooks tests), `forms` (form tests), `a11y` (axe in jsdom).

## TypeScript 7

- Typecheck with `tsc --noEmit` (the package is still `typescript`, the binary still `tsc`);
  `next build` type-checks through the same CLI.
- `tsconfig.json`: no `baseUrl` (removed) — write `"paths": { "@/*": ["./src/*"] }`;
  `moduleResolution: "bundler"` (`node` / `node10` are removed). Include what `next build` would
  otherwise add on its first run (`target: "ES2017"`, `allowJs`, `esModuleInterop` — mandatory —,
  `incremental`, `plugins: [{ "name": "next" }]`), so the file doesn't churn and the editor plugin
  works from the start.
- `include` covers `tests/**/*.ts` and the root `*.config.ts` / `*.config.mts` too: Playwright
  transpiles specs without type-checking them, so `tsc` is the only check they get.
- `types` now defaults to `[]`: list what you rely on, e.g. `"types": ["node"]` (add
  `"vitest/globals"` only if you turn Vitest globals on). An ambient global you forgot to list
  disappears with a "cannot find name" error.
- `noUncheckedSideEffectImports` is on: if `tsc` flags `import "./globals.css"`, add a declaration
  (e.g. `src/types/css.d.ts` with `declare module "*.css";`).
- TS 7 has no programmatic compiler API, so tools that import `typescript` as a library don't work
  with it yet. Memory-limited CI can pass `--checkers 1` or `--singleThreaded`.

## Starter config (kit `templates/config/`)

Minimal starting points — merge into existing files rather than overwriting:

| File | Holds |
|---|---|
| `next.config.ts` | standalone output, Cache Components, optional React Compiler, images, security headers and a CSP sketch (`'unsafe-eval'` in dev only), env-overridable `distDir` |
| `tsconfig.json` | TS 7-safe, with Next's mandatory keys, covering `src`, `tests` and root configs (above) |
| `biome.json` | Biome 2.6: `$schema`, `files.includes`, `organizeImports`, `linter.domains` (react, next, playwright), `css.parser.tailwindDirectives`, `noTailwindRawColors`, and two overrides — three rules stock shadcn primitives trip, off for `src/components/ui/**`; `noImportantStyles` off for `globals.css` (the reduced-motion block, `motion`) |
| `vitest.config.mts`, `playwright.config.ts` | the two runners, split by directory; TZ pin and `server-only` alias in Vitest |
| `postcss.config.mjs` | `@tailwindcss/postcss` |
| `package.scripts.json` | the scripts CLAUDE.md lists — merge into `package.json` |

`yarn lint` is `biome check .`: `src/`, `tests/` and the root configs (`.claude/`, build output and
reports are excluded in `files.includes`). The Playwright domain's `noPlaywrightMissingAwait` then
covers the specs. Starter **code** (cn, env, error helpers, modal layer, FormField, ConfirmDialog,
primitives, theme) is in kit `templates/src/` — see the kit README.

- Run `biome migrate --write` after a Biome upgrade, and bump the `$schema` version by hand (on an
  already-current config `migrate` writes nothing).
- `noTailwindRawColors` flags palette classes such as `text-red-500` without further config; check the
  rule page for whether `tailwind.stylesheet` is needed for your setup (not confirmed) —
  `tailwind-audit`.
- **Biome style — Default, change if your project differs:** 2-space indent, `lineWidth: 100`,
  double quotes, semicolons.

## Deploy notes (any target)

- `output: "standalone"` emits `.next/standalone/server.js`; static files from `.next/static` and
  `public/` are **not** inside it and must be shipped separately.
- Env values read in `next.config.ts` (e.g. `NEXT_PUBLIC_API_URL` for the CSP's `connect-src`) are
  baked in at **build** time, so the env file must exist before `next build`.
- On a self-built serverless target, `after()` has no `waitUntil` to keep the instance alive — never
  use it for work that must finish (`observability`).
