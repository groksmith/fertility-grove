---
name: perf
description: Measurement-first performance for a Next.js 16 App Router app on Turbopack — production-build measurement, `next analyze`, the Cache Components / partial-prerendering model, client-reference and barrel bloat, next/dynamic for closed dialogs and heavy widgets, `<Activity>`, the React Compiler stance, next/image defaults, fonts, Web Vitals, busy-until-navigated buttons, TanStack Query hydration, and serverless cold start. Use when something is slow, re-renders too often or input lags, requests run one after another (waterfalls), a bundle is large, or LCP/INP/CLS regress. Always measure before optimizing; code-level React rules are in `react-best-practices`.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Performance

**Measure first, optimize second.** "Component X is slow" without a number is a hypothesis. Quote
the number, fix that, re-measure, report before → after.

General React/Next rules (waterfalls, bundle, server work) live in the vendored
**`react-best-practices`** skill — read its project-overrides block first. This skill wins on
conflict: apply its `rerender-` / `rendering-` / `js-` / `advanced-` rules only where a profile
points, and drop any of its manual-memo advice that contradicts the React Compiler stance below.

Baseline (Nov 2026) — verify against package.json: next 16.4 (Turbopack default for dev and
build), react 19.3, Node ≥ 22.22 in dev/CI (Next itself runs on ≥ 20.9).

## Measure

| Tool | Use |
|---|---|
| Production build | `yarn next build && yarn next start -p 3005`. **Never Lighthouse `yarn dev`** — unminified, compiled on request. `next dev` writes `.next/dev`, so a build no longer clobbers a running dev server; use a separate `distDir` (`NEXT_DIST_DIR=.next-perf`, with `distDir: process.env.NEXT_DIST_DIR ?? ".next"`) only if you still see it |
| `yarn next analyze` | Turbopack bundle analyzer (UI). `--output` writes `.next/diagnostics/analyze`; `next analyze --output --snapshot <name>` + `next analyze export --snapshot <name>` (16.4) give before/after snapshots to diff. This measures the bundle that ships |
| `@next/bundle-analyzer` | Webpack-only (`ANALYZE=true next build --webpack`) — not the Turbopack output. Legacy; prefer `next analyze` |
| Lighthouse / PageSpeed | Page weight and LCP. `next build` no longer prints per-route `size` / First Load JS — don't quote it |
| `<WebVitalsReporter>` | `"use client"` component in the root layout using `useReportWebVitals`: logs in dev; in prod sends `{ name, value, rating, route template }` to your analytics endpoint. Report the route **template**, never the URL (ids, tokens) |
| Chrome DevTools Performance | INP, long tasks, layout shifts; React 19.2+ adds **Scheduler** and **Components** tracks — profile there, not only in React Profiler |
| Next devtools | Instant Insights / Navigation Inspector (16.3) flag blocking prerenders and slow navigations in dev |

Targets (web.dev, p75): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.

## Build toolchain

- **Turbopack is the default** for `next dev` and `next build`; no `--turbopack` flag. A `webpack`
  key in `next.config` (including one a plugin injects) makes `next build` **fail** — don't add
  one. Config lives under top-level `turbopack` (`resolve.fallback` → `turbopack.resolveAlias`).
  Opt out only with `--webpack`, as a recorded decision.
- The Turbopack filesystem cache is on for dev and build; a slow first build after a clean is
  expected, not a regression.
- Routing prefetches are deduplicated and incremental: expect **more, smaller** prefetch requests
  than on Next 15 — not a regression.

## Rendering model — Cache Components

**Default — change if your project differs:** `cacheComponents: true` together with
`partialPrefetching: true` in `next.config` (leaving the latter unset logs a warning; both become
the default in the next major). Then:

- **Everything is dynamic by default.** The build prerenders a **static shell**; dynamic parts
  stream into it (this *is* partial prerendering — there is no separate PPR flag).
- **Per-user reads are dynamic.** `cookies()`, `headers()`, `searchParams`, and **always**
  `useSearchParams`, sit inside a `<Suspense>` with a layout-stable fallback, or the build reports
  a blocking prerender. Signed-in pages: static chrome in the shell, session-gated content in the
  boundary (auth skill).
- **`"use cache"` + `cacheLife` / `cacheTag` only for shared data** (catalogue, public content) —
  never for anything keyed by the user or token. Invalidate with `revalidateTag(tag, "max")` (the
  one-argument form is deprecated), `updateTag(tag)` for read-your-writes in a Server Action, and
  `refresh()` to refresh the client router from a Server Action.
- **No `dynamic` / `revalidate` / `fetchCache` segment exports** (they error); no `runtime` export
  at all (Node is required; `runtime = "edge"` is deprecated). `generateStaticParams` must return at
  least one entry. `new Date()` / `Math.random()` during prerender is a build error — move it below
  `await connection()` inside Suspense. `export const instant = false` is the per-segment escape
  hatch; `ensureStatic` (16.4) asserts a segment stays static.
- **Serverless:** `"use cache"` is **in-memory, per instance, per deployment** — on a function
  `AWS Lambda (standalone) behind CloudFront` each cold instance starts empty. Use `"use cache: remote"` or `cacheHandlers`
  when a shared cache is the point.
- **Visited routes stay mounted** (`<Activity mode="hidden">`): state and inputs survive
  back-navigation; effects clean up and re-run; an open dialog may reappear. Don't "fix" this with
  remount keys — design for it.

If your project turns Cache Components off, delete this section, the one-line Caching rule in
`CLAUDE.md`, and the matching notes in `http` (Caching server reads) and `auth` (session gate under
Suspense).

If your app is client-rendered (pages `"use client"`, data from TanStack Query, session seeded via
`HydrationBoundary`), Cache Components mostly buys you the shell. Converting a page to a Server
Component is a deliberate, measured refactor, not a default fix. The cheap levers are what a page
**imports** (rules 1–3, 9) and what it does **while navigating** (rule 6).

## React Compiler

**Default — change if your project differs: off, documented.** Enabling is `reactCompiler: true`
(top-level) + `yarn add -D babel-plugin-react-compiler`; `compilationMode: "annotation"` with
`"use memo"` opts in per component, `"use no memo"` opts out. Keep it off until the form and data
libraries are verified with it (react-hook-form v7 compatibility is unverified — check its release
notes). It raises dev and build time.

Either way:

- **No new manual `useMemo` / `useCallback` / `React.memo` without a profile.** Keep existing ones
  unless tests cover their removal (it can change compiler output).
- Write compiler-safe code now: components pure, no synchronous `setState` in effects, no ref
  reads during render. The compiler's lint rules ship in `eslint-plugin-react-hooks`; if you lint
  with Biome, check which of them it covers.

## Rules

1. **Declare `"sideEffects"` in `package.json`** (e.g. `["*.css"]`). Without it the bundler keeps every re-export of a barrel (`@/components/shared`, feature `index.ts`) — one `FormField` import can drag in every heavy field widget. A module imported only for its side effect must be listed.
2. **Keep heavy libraries out of read-only views.** Phone inputs, flag sets, date pickers, rich-text editors, maps, charts are tens to hundreds of KB. Put pure helpers (formatters, `isEmpty` checks) in their own modules so a display component never imports the widget's module.
3. **Load on demand what starts closed.** Conditionally rendered dialogs, sheets and menus' heavy contents use `next/dynamic`; an always-mounted, store-driven dialog mounts on first open and stays. Heavy widgets inside a form load behind a same-height placeholder (no layout shift). Widgets that touch `window` → `next/dynamic` with `ssr: false`, or `use(browser())` from `react-dom` (19.3) instead of `mounted`-state hacks.
4. **`<Activity>` over unmount when state must survive** (tabs, wizard steps): `<Activity mode={active ? "visible" : "hidden"}>` keeps the DOM (`display:none`) and state, destroys effects, and still re-renders at low priority — so it is not free. Pause media in a `useLayoutEffect` cleanup. Use plain conditional rendering when nothing needs to survive.
5. **Suspense fallbacks are the real UI.** Under Cache Components the fallback is what the shell ships. Make it the page rendered without the dynamic data; keep animated chrome outside the boundary; give small `useSearchParams` readers their own boundary.
6. **A button that acts then navigates stays busy until the new page is on screen.** Wrap navigation in a transition (`const [isNavigating, start] = useTransition(); start(() => router.push(url))`, e.g. a `useNavigate()` hook) and hold `busy = mutation.isPending || isNavigating`; keep a dialog open through it. For a full-page navigation, keep the mutation pending until the browser leaves (return a never-resolving promise after setting `location.href`). Not `isPending || isSuccess` — that also sticks on paths that never navigate. Plain links stay `<Link>` (prefetched, so `loading.tsx` shows immediately).
7. **Skeletons match the loaded size**, and async text holds its slot — otherwise CLS.
8. **Nothing in `Providers` beside the page reads a hydrated query during render.** It renders before the protected layout's data resolves, creates an empty cache entry, and the hydrated value then arrives in an effect — signed-out UI on the server, full re-render on hydration. Mount such readers after mount.
9. **A `"use client"` file a server file imports ships ALL its exports.** It becomes a client reference and every export is kept. Never collect several route screens in one `"use client"` file; one file per screen.
10. **No per-load network work in global components** (analytics identify, profile sync) — gate to once per session/day.
11. **Effect-only callbacks use `useEffectEvent`** (19.2) instead of a latest-value ref or a dependency that re-subscribes every render. Never put it in deps or pass it on.
12. **Fonts:** `next/font/google` (any Google family) or `next/font/local`, only the weights the design uses (`Instrument Sans`), `display: "swap"` (default), preload the body face; secondary faces like `none (no mono face loaded)` with `preload: false`. Each extra weight is a request on the critical path.

## Images

`next/image` for everything under `public/assets/`, with `alt`, dimensions (or `fill` in a sized
parent) and `sizes` when responsive; mark only the **one** LCP image as priority/preload (check the
`next/image` reference for the prop name on your version). `unoptimized` is right for tiny fixed
marks. Plain `<img>` only for the cases your project sanctions (see the `icon-audit` skill).

Next 16 changed the defaults — check `next.config` `images` when upgrading:

- `qualities` defaults to **`[75]`**: any other `quality` is coerced to the nearest allowed value,
  and a direct `/_next/image?q=` with an unlisted value returns 400. List every quality you use.
- `minimumCacheTTL` is **14400 s** (was 60); `16` is gone from `imageSizes`; `maximumRedirects` is 3.
- A local `src` with a query string needs `images.localPatterns[].search`; local-IP upstreams are
  blocked unless `images.dangerouslyAllowLocalIP`.
- `images.domains` is deprecated — `images.remotePatterns`, narrowly.

## Serverless cold start — `AWS Lambda (standalone) behind CloudFront`

- `output: "standalone"` for a self-hosted/serverless server; it still does **not** copy `public/`
  or `.next/static` — the deploy syncs them. Cold start scales with the server bundle and
  server-side imports: `du -sh .next/standalone/node_modules/* | sort -h | tail -20`. A new server
  dependency is a cold-start cost — weigh it like a client one.
- Node runtime only (Node ≥ 20.9); drop any `runtime = "edge"` export.
- `after()` needs the platform's `waitUntil`; a self-built `node server.js` doesn't wire it
  (observability skill). `"use cache"` is per instance (above).
- Provisioned / min instances are an ops decision; flag, don't enable.
- **CDN:** `/_next/static/*` and hashed assets are long-cached. HTML and `/api/*` carry personal
  data — never add public `Cache-Control` to them.
- `experimental.optimizePackageImports` already includes `lucide-react` and `date-fns` by default;
  add others only after the analyzer shows their barrel costing.

## Audits

```bash
# Bundle: before/after snapshot of the Turbopack output
yarn next analyze --output --snapshot before   # change …
yarn next analyze --output --snapshot after

# "use client" files exporting several components imported by server files (rule 9) — inspect hits
grep -rl '"use client"' src/app --include='*.tsx' | xargs grep -c "^export function" | grep -v ":[01]$"

# Heavy widgets imported eagerly (rules 2–3) — replace with your heavy modules
grep -rn "react-phone-number-input\|react-day-picker" src --include='*.tsx' | grep -v "\.test\."

# Next 15-era segment config / per-user caching (Cache Components)
grep -rnE "export const (dynamic|revalidate|fetchCache|runtime)\b" src/app
grep -rn -B2 -A8 '"use cache' src | grep -E "cookies\(|headers\(|getSession|requireSession"

# next/image qualities in use vs images.qualities
grep -rnoE "quality=\{?[0-9]+" src | sort -u
```

## Anti-patterns

1. New `useMemo` / `useCallback` / `React.memo` without a profile.
2. Lighthouse on the dev server; quoting a "First Load JS" number from the build log.
3. `"use cache"` on per-user data; `revalidate` / `dynamic` segment exports under Cache Components.
4. A `webpack` config block on a Turbopack build; `@next/bundle-analyzer` as the source of truth.
5. More than one priority image; `<img>` outside the sanctioned cases; an unlisted `quality`.
6. Suspense without a layout-stable fallback.
7. A shared `"use client"` file of several route screens; heavy widgets imported eagerly.
8. `router.push` after `mutateAsync` with the button re-enabling before the page changes.
9. Refactoring "to make it faster" without a before/after number.
