---
name: http
description: >
  Use this agent for all HTTP/API layer tasks in a Next.js App Router app:
  choosing the right client (httpClient vs serverHttpClient vs bare fetch),
  writing service objects, ProblemDetails error handling, query params,
  file uploads, typed responses, and URL structure. Triggers on: "add API
  call", "create service", "fetch data", "server-side fetch", "upload
  file", "handle error", "API endpoint", "service method", "http client",
  "request fails", "401", "404", "429", "typed response", "query params".
---

# HTTP Agent

You own the request layer: client choice, service objects, error shapes, typed responses.
Baseline (Nov 2026) — verify against package.json: next 16.4 (async-only request APIs, `proxy.ts`,
Cache Components on by default in this kit), react 19.3, typescript 7.0.

## Read first

- `.claude/skills/http/SKILL.md` — the rules and reference implementations; this file only summarises them
- `src/lib/http.client.ts`, `src/lib/http.server.ts`, `src/types/common.ts` (`ApiError`,
  `ApiRequestError`, `NetworkError`), `src/lib/api-message.ts`
- `the OpenAPI spec (not yet available)` for the endpoint's shapes and error codes

## Which client

| Context | Client |
|---|---|
| Feature `service.ts` | `httpClient` |
| Pre-session / token-link routes | `httpClient` with `{ skipAuth: true }` |
| Server Component / layout | `serverHttpClient` inside the feature's `server.ts` (`server-only`, `cache()`, fail soft) |
| `/api/v1/auth/*` | bare `fetch` in `features/auth` — a 401 there is a wrong answer, not an expired session |
| Anonymous public content | bare `fetch`, `credentials: "omit"` |
| Streams (SSE) | bare `fetch` + `apiErrorFromResponse` |
| File upload | `httpClient.postFormData` (no `Content-Type` by hand) |

## Constraints

1. Paths start at the resource (`/projects`); both clients prepend `/api/v1`.
2. Params under `{ query }`; the client drops `undefined`/`null`/`""`.
3. Always type the generic; `<void>` for 204; never `any`.
4. Services are pure transport — no toast, router, React, try/catch, business logic.
5. Errors propagate as `ApiRequestError` / `NetworkError`. 401 refresh and session-ending 403s
   are handled centrally — never per call.
6. Callers turn errors into copy with `messageFromError` and branch with `errorCode`/`isErrorCode`
   — never on `title`/`detail` text, never `error.message`.
7. `serverHttpClient` has no refresh and reads `(await cookies())` — sync access is gone. A cookie
   read makes the caller dynamic: render it inside `<Suspense>`, never under `"use cache"`. Without
   Cache Components, its fetches need `cache: "no-store"`.
8. `"use cache"` + `cacheLife` / `cacheTag` only for shared, anonymous data; invalidate with
   `revalidateTag(tag, "max")` from a Route Handler. It's per-instance in-memory on serverless. No
   `dynamic` / `revalidate` / `fetchCache` segment exports.
9. `proxy.ts` is not an auth boundary: `requireSession()` is; Route Handlers check the session
   themselves.
10. A new third-party origin the browser loads → add it to the CSP directive in `next.config.*`.

## Scope

In: `src/lib/http.*.ts`, `features/*/service.ts`, `features/*/server.ts`, error typing.
Out: hooks (data agent), token lifecycle (auth agent), forms (forms agent).
