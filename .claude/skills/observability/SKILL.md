---
name: observability
description: Error boundaries for a Next.js 16 App Router app (error.tsx with error unknown + retry(), global-error.tsx, not-found.tsx, catchError), instrumentation.ts onRequestError incl. proxy errors, unstable_rethrow, after() caveats on serverless, a first-party client error endpoint, the logger and PII scrubbing, HTTP status → user-facing error UX, and retry defaults for a Next.js App Router app. Use when adding error pages, logging, error reporting, retry logic, or chasing a swallowed error or white screen.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Observability

Every failure should be **visible** (one searchable log line), **recoverable** (a boundary with
retry) and **actionable** (the user can quote a Reference to support). Build the pieces below
once; afterwards extend them, don't recreate them.

Baseline (Nov 2026) — verify against package.json: next 16.4, react 19.3. `catchError` / `retry`
are stable since Next 16.3.

## The pieces (provide these)

| Piece | Suggested file | What it does |
|---|---|---|
| Root fallback | `src/app/global-error.tsx` | Own `<html>/<body>`, **inline styles** (no CSS has loaded), Reference digest, Try again (a full reload is the safe choice when the root layout failed), reports `"global"` |
| 404 | `src/app/not-found.tsx` | Tokens, `Button asChild` + `<Link>` home |
| Group boundaries | `src/app/(dashboard)/error.tsx`, `src/app/(public)/error.tsx` | `"use client"`; `logger.error` + `reportClientError("<segment>", error)` in an effect; Reference digest; Try again → `retry()` |
| Component boundaries | `catchError` from `next/error` | A boundary around one widget that still lets `redirect()` / `notFound()` through — see the Next API reference for its signature |
| Loading | `(group)/loading.tsx` | `<Skeleton>` sized like the loaded page (CLS — perf skill) |
| Uncaught errors | `src/components/common/ErrorReporter.tsx` (root layout) | `window` `error` + `unhandledrejection`; ignore `ResizeObserver loop` and opaque `Script error.` |
| Client reporting | `src/lib/error-reporting.ts` → `POST /api/client-errors` | Prod only, never throws, dedupes, caps per page load (e.g. 10), `navigator.sendBeacon` with fetch `keepalive` fallback |
| Report sink | `src/app/api/client-errors/route.ts` | Public on purpose (signed-out pages fail too): Zod-validated, size cap (e.g. 8 KB), re-scrubbed, per-IP rate limit, writes one `client_error` log line |
| Server reporting | `src/instrumentation.ts` `onRequestError` | Every server render / route handler / Server Action / proxy error → one `server_error` line with the same `digest` the user sees |
| Logger | `src/lib/logger.ts` | `debug`/`info` dev-only; `warn`/`error` always; `logger.event({ type, … })` = one JSON line |
| Log scrubbing | `src/lib/log-scrub.ts` | `scrubLogText` / `scrubLogPath`: emails, JWTs, long digit runs, query strings, opaque path tokens |
| Error → message | `src/lib/api-message.ts` | `messageFromError`, `errorCode` / `isErrorCode`, a generic `SERVER_FAULT_MESSAGE` |
| HTTP mapping | `src/lib/http.client.ts` | ProblemDetails → `ApiRequestError` (`status`, `code`, `errors`, `retryAfter`); fetch rejection → `NetworkError`; 5xx `detail` replaced with `SERVER_FAULT_MESSAGE` (see `http` skill) |

```ts
// src/instrumentation.ts
import type { Instrumentation } from "next";
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const e = err instanceof Error ? (err as Error & { digest?: string }) : undefined; // err: unknown
  await logger.event({                 // await async work — the hook must not return early
    type: "server_error",
    digest: e?.digest,
    name: e?.name ?? typeof err,
    message: scrubLogText(e?.message ?? String(err)),
    path: scrubLogPath(request.path),
    routeType: context.routeType,      // "render" | "route" | "action" | "proxy"
    routePath: context.routePath,
  });
};
```

`routeType: "proxy"` replaced `"middleware"` in Next 16 — update any log query that filtered on
the old value.

### `after()` is not a delivery guarantee on serverless

`after()` (`next/server`) runs work after the response, in Server Components, Server Functions,
Route Handlers and Proxy. Two traps:

- Inside an `after` callback in a Server Component, `cookies()` / `headers()` **throw** — read them
  before scheduling.
- On a serverless `AWS Lambda (standalone) behind CloudFront` the platform must expose `waitUntil` (via
  `globalThis[Symbol.for("@next/request-context")]`), otherwise the instance can freeze and the
  work is cut off. A self-built server (`output: "standalone"` → `node server.js` on a function
  runtime) does not wire it. **Default — change if your project differs:** never put must-land
  error reports in `after()`; `await` the log write instead.

**Finding a report:** query your log store (`CloudWatch Logs`, e.g. CloudWatch Logs Insights, Loki)
with `type = "client_error"` / `"server_error"`; a user's on-screen Reference → filter by `digest`.

**Default — change if your project differs: no third-party reporter.** A vendor SDK (Sentry,
PostHog, Datadog…) is a new data processor, possibly a cookie-consent category, and a new CSP
`connect-src` origin. Adding one is a product/legal decision — propose it, never wire it
unilaterally. The first-party path sends nothing off-origin.

## Boundaries

```
app/layout.tsx
 └─ global-error.tsx          root layout itself threw (replaces <html>)
     └─ (group)/layout.tsx
         └─ (group)/error.tsx  this segment and below; must be "use client"
             └─ page.tsx
                 └─ notFound() → nearest not-found.tsx
```

- One `error.tsx` per route group at minimum. It receives **`{ error: unknown, retry, reset }`** — narrow before reading `.message` / `.digest`. **Try again calls `retry()`**: it re-fetches and re-renders the segment inside a transition. `reset()` only clears the boundary's state and re-renders with the same data, so a failed fetch fails again. Tokens only; show the digest as "Reference: …"; never the raw message or stack in production.

  ```tsx
  "use client";
  export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
    const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : undefined;
    useEffect(() => { reportClientError("dashboard", error); }, [error]);
    return <ErrorState reference={digest} onRetry={retry} />;
  }
  ```
- `global-error.tsx` still renders its own `<html><body>`; type `error` as `unknown` there too.
- Next 16.2+ ships a default 500 page, Server Function logging and a hydration-diff indicator in dev — use them while debugging; they don't replace your boundaries.
- An `error.tsx` does **not** catch errors from the `layout.tsx` of the same segment — they go to the parent boundary. So an auth-gate failure in `(dashboard)/layout.tsx` (e.g. `/auth/me` 500) lands in `global-error.tsx` unless a parent group has a boundary.
- Add a nested `error.tsx` only where a sub-tree needs a different fallback; if identical, re-export (`export { default } from "../(dashboard)/error"`).
- Server-side missing resource → `notFound()`. Client-side 404 from a query → an empty/not-found state in the page.
- ⚠️ **`redirect()` / `notFound()` / `forbidden()` work by throwing.** Never call them inside a `try/catch` that swallows — call them after the `try`, or call `unstable_rethrow(e)` (from `next/navigation`; still `unstable_` in 16.4) **first** in the `catch`. It also rethrows `permanentRedirect` and dynamic-API bailouts — under Cache Components, swallowing a bailout breaks the prerender. For a component-level fallback use `catchError`, which lets these through by design.

## HTTP status → UX

| Status | Handling |
|---|---|
| 401 | `httpClient` refreshes and retries once; failure → hard logout (auth skill). Pages never handle it |
| 403 | Inline "you don't have access" message; branch on `isErrorCode` for special codes (an app-wide gate code may hard-navigate in `httpClient`) |
| 404 | Server: `notFound()`. Client: empty state |
| 409 | Inline: explain the conflict, offer reload |
| 422 | Field errors via `setError` (forms skill); `messageFromError` joins them for a toast |
| 429 | `ApiRequestError.retryAfter` → "Try again in N seconds"; respect `Retry-After` |
| 5xx | Reworded to `SERVER_FAULT_MESSAGE`; a query failure renders inline or bubbles to `error.tsx` |
| Network | `NetworkError` → caller's sentence + "check your connection" |
| Server Action | Same mapping; the action re-checks the session itself (auth skill) and returns a typed error result for expected failures rather than throwing |

Branch on the ProblemDetails `code`, never on `title`/`detail` prose. One shared
`messageFromError` — never a private copy per feature.

## Severity → UX

| Severity | UX |
|---|---|
| Field | Inline `<FormMessage>` |
| Action (save failed) | `toast.error(...)` in the mutation's `onError` |
| Page (data or render failed) | Inline error state with retry, or the `error.tsx` boundary |
| App (root layout) | `global-error.tsx` |

Never `alert()`, never an empty screen with no way forward.

## Retry defaults

| Operation | Rule |
|---|---|
| Queries | `retry: 1` globally (QueryClient defaults in `src/app/providers.tsx`); no retry on 4xx; `refetchOnWindowFocus: false` unless the data is live |
| Mutations | No retry. `networkMode: "always"` so an offline save fails now with a toast instead of replaying silently later |
| Token refresh | One in-flight attempt; failure → logout |
| One-time codes (2FA, OTP) | Never retried — a replay counts toward lockout |

## Logging rules

- `logger` only; no bare `console.*` in `features/` or `components/` (dev-only `console.error` in `global-error.tsx` is fine).
- Scrub every `logger.event` field that can hold user text. Never log tokens, emails, names, addresses or user-entered values.
- Server logs follow the same rules — `AWS Lambda (standalone) behind CloudFront` log streams are usually retained and searchable by many people.

## Audit recipes

```bash
# Every error.tsx reports (or re-exports one that does)
grep -L "reportClientError\|export { default }" $(find src/app -name error.tsx)

# Bare console in app code
grep -rn "console\." src/features src/components --include='*.ts' --include='*.tsx' | grep -v "\.test\."

# Silent catches
grep -rn "catch {}\|catch (_) {}\|\.catch(() => {})" src --include='*.ts' --include='*.tsx' | grep -v "\.test\."

# error.tsx still on the Next 15 contract (Error-typed prop, reset-only Try again)
grep -rln "error: Error\|onClick={reset}\|onClick={() => reset()}" $(find src/app -name '*error.tsx')

# Log queries / code still expecting the old routeType
grep -rn '"middleware"' src/instrumentation.ts src/lib

# redirect()/notFound() inside try blocks — inspect each hit
grep -rn -A8 "try {" src/app --include='*.tsx' --include='*.ts' | grep -E "redirect\(|notFound\("

# Private messageFromError copies
grep -rln "^function messageFromError" src/features
```

## Anti-patterns

1. `.catch(() => {})` with no comment saying why ignoring is correct (best-effort logout, storage access).
2. A `try/catch` that can't recover — let it reach the boundary.
3. A boundary that doesn't report, or doesn't show the digest.
4. Swallowing `redirect()` / `notFound()` in a `catch`; reading `error.message` without narrowing `unknown`.
5. `reset()` as the only Try again (use `retry()`); must-land reporting inside `after()` on serverless.
6. Logging unscrubbed text.
7. Auto-retrying a mutation.
8. Wiring a third-party reporter without approval.
