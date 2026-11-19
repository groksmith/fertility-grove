---
name: http
description: HTTP layer for a Next.js 16 App Router + TypeScript app — choosing httpClient vs serverHttpClient vs bare fetch, service objects, URL and query-param conventions, ProblemDetails → typed ApiError (per-call 400/403/404/409/422 handling), the 401 → refresh → retry interceptor, 429 Retry-After, network and 5xx errors, file upload/download, typed responses, and server reads under Cache Components (cookie reads are dynamic; where "use cache" fits). Use when adding an API call, a service, a server-side read, or changing error handling.
argument-hint: "[client | server | service | error | upload | params | unauthenticated]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# HTTP Layer

Baseline (Nov 2026) — verify against package.json: next 16.4 App Router (`cookies()`, `headers()`,
`params`, `searchParams` are **async only** — sync access is removed), react 19.3, typescript 7.0,
**Cache Components on** (`cacheComponents: true` — **Default — change if your project differs**). The backend is a separate service at `the backend origin (none yet — the prototype has no backend)` (env `NEXT_PUBLIC_API_URL`) with
endpoints under `/api/v1` (default `/api/v1`), JSON in camelCase, errors as RFC 7807
ProblemDetails. Source of truth for shapes: `the OpenAPI spec (not yet available)` (e.g. `docs/api/openapi.json`).

Two transports live in `src/lib/` and every request goes through one of them. Read their comments
before changing anything: the reasons for each branch are recorded there.

## 1. Which client

| Caller | Client |
|---|---|
| Feature `service.ts` (called by TanStack Query hooks) | `httpClient` (`@/lib/http.client`) |
| A page reachable without a session (token links, invite accept) | `httpClient` with `{ skipAuth: true }` |
| Server Component / server layout | `serverHttpClient` (`@/lib/http.server`, `server-only`) inside a feature's `server.ts` leaf |
| `/api/v1/auth/*` (login, refresh, logout, 2FA) | the bare-`fetch` transport `features/auth/request.ts`, called by `features/auth/service.ts` |
| Anonymous public content | bare `fetch`, `credentials: "omit"` |
| Streams (SSE, NDJSON) | bare `fetch` + `apiErrorFromResponse` so failures throw like `httpClient` |

Both clients prepend `${NEXT_PUBLIC_API_URL}/api/v1` — service paths start at the resource:
`httpClient.get("/projects")`.

**Why auth endpoints bypass `httpClient`:** its 401 interceptor refreshes and retries. On an auth
route a 401 means a wrong password or code, not an expired session, and the refresh call itself must
never recurse into the interceptor.

## 2. Error types — `src/types/common.ts`

```typescript
/** RFC 7807 ProblemDetails plus the extensions your backend adds. */
export interface ApiError {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  code?: string;                          // machine-readable; branch on this, never on prose
  errors?: Record<string, string[]>;      // 422 field errors
  retryAfter?: number;                    // seconds, from the Retry-After header
  [extension: string]: unknown;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;
  readonly retryAfter?: number;
  constructor(readonly payload: ApiError) {
    super(payload.detail ?? payload.title ?? `Request failed (${payload.status})`);
    this.name = "ApiRequestError";
    this.status = payload.status;
    this.detail = payload.detail;
    this.errors = payload.errors;
    this.retryAfter = payload.retryAfter;
  }
}

/** No answer at all: offline, DNS, CORS, connection reset. */
export class NetworkError extends Error {
  constructor() {
    super("We couldn't reach the server. Check your connection and try again.");
    this.name = "NetworkError";
  }
}

export interface PaginatedResponse<T> { items: T[]; page: number; pageSize: number; totalCount: number }
```

Construct `ApiRequestError` from **one** `ApiError` object — never `new ApiRequestError(msg, status)`.

## 3. `httpClient` — reference implementation (`src/lib/http.client.ts`)

What it does centrally, so no service or hook repeats it:

1. Prefixes `/api/v1`; serialises `query` (drops `undefined`/`null`/`""`, repeats array keys, keeps `0`/`false`).
2. Sends `Authorization: Bearer <access token>` unless `skipAuth`.
3. **401** → single-flight refresh → retry once → else hard logout to `/login`.
4. **No answer** → `NetworkError`. `AbortError` passes through untouched.
5. **Error body** → ProblemDetails parsed into `ApiError` → `ApiRequestError`.
6. **429** → `retryAfter` parsed from `Retry-After` (seconds or HTTP date).
7. **5xx without a `code`** → `detail` replaced with a human sentence (stack traces never reach a toast).
8. 204 / non-JSON body → `undefined`.

`env` is `@/config/env` (kit `templates/src/config/env.ts`): `env.apiUrl` is `NEXT_PUBLIC_API_URL`
read **statically** (Next inlines it at build time) with the trailing `/` trimmed, throwing a named
error when unset. The error classes are in `@/types/common` (kit `templates/src/types/common.ts`).

```typescript
import { env } from "@/config/env";
import { type ApiError, ApiRequestError, NetworkError } from "@/types/common";
import { getAccessToken, hardLogout, tryRefresh } from "@/lib/auth.refresh"; // see the auth skill file map

type Query = Record<string, string | number | boolean | null | undefined | readonly (string | number)[]>;
export interface RequestOptions { query?: Query; headers?: HeadersInit; signal?: AbortSignal; skipAuth?: boolean }

const BASE = `${env.apiUrl}/api/v1`;
const SERVER_FAULT_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    for (const v of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(v));
  }
  return url.toString();
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds;
  const at = Date.parse(header);
  return Number.isNaN(at) ? undefined : Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

export async function apiErrorFromResponse(res: Response): Promise<ApiRequestError> {
  let body: Partial<ApiError> = {};
  try { body = (await res.json()) as Partial<ApiError>; } catch { /* non-JSON error body */ }
  const problem: ApiError = { ...body, status: res.status, retryAfter: parseRetryAfter(res.headers.get("Retry-After")) };
  if (res.status >= 500 && !problem.code) problem.detail = SERVER_FAULT_MESSAGE;
  return new ApiRequestError(problem);
}

async function send<T>(method: string, path: string, body: BodyInit | undefined, opts: RequestOptions = {}, isRetry = false): Promise<T> {
  const headers = new Headers(opts.headers);
  if (body !== undefined && !(body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = opts.skipAuth ? null : getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body, signal: opts.signal, cache: "no-store", credentials: "omit" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new NetworkError();
  }

  if (res.status === 401 && !opts.skipAuth && !isRetry) {
    if (await tryRefresh()) return send<T>(method, path, body, opts, true);
    hardLogout();                                  // clears tokens, window.location.href = "/login"
  }
  if (!res.ok) throw await apiErrorFromResponse(res);
  if (res.status === 204 || !res.headers.get("Content-Type")?.includes("json")) return undefined as T;
  return (await res.json()) as T;
}

const json = (payload: unknown) => JSON.stringify(payload ?? {});

export const httpClient = {
  get: <T>(path: string, opts?: RequestOptions) => send<T>("GET", path, undefined, opts),
  post: <T>(path: string, payload?: unknown, opts?: RequestOptions) => send<T>("POST", path, json(payload), opts),
  put: <T>(path: string, payload?: unknown, opts?: RequestOptions) => send<T>("PUT", path, json(payload), opts),
  patch: <T>(path: string, payload?: unknown, opts?: RequestOptions) => send<T>("PATCH", path, json(payload), opts),
  delete: <T>(path: string, payload?: unknown, opts?: RequestOptions) =>
    send<T>("DELETE", path, payload === undefined ? undefined : json(payload), opts),
  /** Browser sets the multipart boundary — never set Content-Type yourself. */
  postFormData: <T>(path: string, form: FormData, opts?: RequestOptions) => send<T>("POST", path, form, opts),
};
```

**Single-flight refresh** (`src/lib/auth.refresh.ts`) — concurrent 401s share one refresh call, or
the second rotates away the token the first just received:

```typescript
let inFlight: Promise<boolean> | null = null;
let handler: (() => Promise<boolean>) | null = null;

/** Registered once by the client provider; it calls the auth service's bare-fetch refresh. */
export function setRefreshHandler(fn: () => Promise<boolean>) { handler = fn; }

export function tryRefresh(): Promise<boolean> {
  if (!handler) return Promise.resolve(false);
  inFlight ??= handler().catch(() => false).finally(() => { inFlight = null; });
  return inFlight;
}
```

Token storage, lifetimes and the logout wipe are `localStorage` decisions — see the auth skill.
Add a binary download (`getBlob`, reading `Content-Disposition`) only when a feature needs one.

## 4. `serverHttpClient` — reference implementation (`src/lib/http.server.ts`)

`server-only` is a real dependency (`yarn add server-only`); Vitest aliases it to an empty module so
this file can be unit-tested (`toolchain`).

```typescript
import "server-only";
import { cookies } from "next/headers";

import { env } from "@/config/env";
import { AUTH_COOKIE } from "@/config/auth";       // TBD by the backend
import { apiErrorFromResponse } from "@/lib/http.client";

async function send<T>(method: string, path: string, payload?: unknown): Promise<T> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;     // async only; makes the caller dynamic
  const res = await fetch(`${env.apiUrl}/api/v1${path}`, {
    method,
    // Per-user data. Under Cache Components a fetch is uncached unless it runs inside "use cache",
    // so no cache option is needed; without Cache Components add `cache: "no-store"`.
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  if (!res.ok) throw await apiErrorFromResponse(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const serverHttpClient = {
  get: <T>(path: string) => send<T>("GET", path),
  post: <T>(path: string, payload?: unknown) => send<T>("POST", path, payload),
  put: <T>(path: string, payload?: unknown) => send<T>("PUT", path, payload),
  delete: <T>(path: string) => send<T>("DELETE", path),
};
```

If `apiErrorFromResponse` lives in a `"use client"` module, move it to a shared `lib/http.errors.ts`.
No refresh, no redirect, no `NetworkError` — it just throws `ApiRequestError`. Wrap reads in a
feature's `server.ts` leaf, deduped per request with React `cache()`. The leaf throws; the caller
decides whether to **fail soft** (a layout seeding the client cache catches and lets the client hook
fetch — tanstack skill §5) or to fail the route:

```typescript
// src/features/projects/server.ts
import "server-only";
import { cache } from "react";

import { serverHttpClient } from "@/lib/http.server";
import type { Project } from "./types";

export const getProjects = cache(() => serverHttpClient.get<Project[]>("/projects"));
```

Server layouts import `@/features/<x>/server` (or `keys` / `state`) directly — never the barrel,
which exports client hooks. Route-level 404: `if (err instanceof ApiRequestError && err.status === 404) notFound();`
— when you catch around a server read, call `unstable_rethrow(err)` (from `next/navigation`) first so
`notFound()` / `redirect()` / dynamic bailouts pass through.

### Caching server reads (Cache Components)

| Data | Do | Never |
|---|---|---|
| Per-user (anything that reads `cookies()` / the bearer token) | Plain dynamic read; the component that awaits it sits inside `<Suspense>` so the static shell still prerenders | `"use cache"` around it, or around a function that calls `serverHttpClient` |
| Shared, anonymous, slow-changing (public catalogue, published articles) | A function marked `"use cache"` + `cacheLife("hours")` (or another profile) + `cacheTag("articles")`, fetching with bare `fetch` and no cookies | Passing the session token in; caching anything user-specific |
| Changed by the backend outside Next | A time-based `cacheLife`, or a Route Handler the backend calls (webhook) that runs `revalidateTag("articles", "max")` | The one-argument `revalidateTag(tag)` (deprecated) |

- Route segment exports `dynamic`, `revalidate` and `fetchCache` error under Cache Components;
  `fetch(…, { next: { revalidate, tags } })` becomes `"use cache"` + `cacheLife` / `cacheTag`;
  `unstable_noStore` becomes `await connection()` + `<Suspense>`.
- `"use cache"` storage is **in-memory, per instance, per deployment** by default. On serverless
  (many short-lived instances) the hit rate is low; shared storage needs `'use cache: remote'` or a
  `cacheHandlers` config — check the Next caching docs before relying on either.
- `updateTag` (read-your-writes) works only in Server Actions; this kit doesn't use Server Actions for
  backend mutations, so client data freshness stays TanStack Query's job (tanstack skill).
- Perf trade-offs, `<Suspense>` placement and `ensureStatic`: perf skill.

### Proxy is not an auth boundary

`src/proxy.ts` (Next 16's rename of the middleware file; Node runtime) may redirect a request with no
token to `/login`, but the server gate `requireSession()` in the protected layout is authoritative
(auth skill). A Route Handler under `app/api/*` that spends money or reaches a third-party API checks
the session itself — the proxy matcher usually excludes `/api`, and Server Functions are POSTs a
matcher can silently skip.

## 5. Service objects

```typescript
import { httpClient } from "@/lib/http.client";

import type { CreateProjectInput } from "./schema";
import type { Project } from "./types";

export const projectService = {
  list(filter: { search?: string; status?: string } = {}): Promise<Project[]> {
    return httpClient.get<Project[]>("/projects", { query: filter });
  },
  create(input: CreateProjectInput): Promise<Project> {
    return httpClient.post<Project>("/projects", input);
  },
  remove(id: string): Promise<void> {
    return httpClient.delete<void>(`/projects/${id}`);
  },
};
```

- One exported `<name>Service` object; methods return typed promises. Always type the generic; never `any`; `<void>` for 204.
- **Params go under `query`** — `httpClient.get("/x", { page })` sends no query string. Pass the raw
  filter; the client drops empty values.
- Pure transport: no toast, router, React, try/catch or business logic. A tiny wire-shape fix is fine
  (`.then((rows) => rows ?? [])`).
- JSDoc the non-obvious: status codes the endpoint answers and `code`s callers branch on.

## 6. Turning errors into UI

Provide these once in `lib/` and import them everywhere — never a local copy per feature. Starter
code: kit `templates/src/lib/api-message.ts`, `templates/src/lib/field-errors.ts`, and the error
classes in `templates/src/types/common.ts` (`ApiError`, `ApiRequestError`, `NetworkError`,
`PaginatedResponse`):

| Helper | Suggested module | Use |
|---|---|---|
| `messageFromError(error, fallback)` | `@/lib/api-message` | toast text: offline → 422 lines → `detail` → fallback |
| `errorCode(error)` / `isErrorCode(error, ...codes)` | `@/lib/api-message` | branch on `payload.code`; never on `title`/`detail` text |
| `fieldErrorMessage` / `applyFieldErrors` | `@/lib/field-errors` | 422 `errors` onto form fields (forms skill §4) |
| `apiErrorFromResponse(res)` | `@/lib/http.client` | make a bare-`fetch` failure throw exactly like `httpClient` |

429: show `retryAfter` ("Try again in 30 seconds") rather than auto-retrying. Errors that end the
whole session (401 after a failed refresh, a backend "gate" 403 such as consent or account lock) are
handled once in `httpClient` — never per call.

## 7. Streams (SSE)

Read `text/event-stream` with `res.body.getReader()` in the service. Rules that each cause visible
corruption when broken:
1. Strip exactly **one** space after `data:` — never `trimStart()` (welds words together).
2. Never `trim()` a frame (drops trailing payload).
3. Split frames on `/\r?\n\r?\n/`, join multiple `data:` lines with `\n`, keep the partial tail across reads.

## 8. New endpoint checklist

1. Confirm path, method, body, response and error codes in `the OpenAPI spec (not yet available)`.
2. Response interface → `types.ts`; request/form schema → `schema.ts` (forms skill).
3. Method → `service.ts`; hook → `hooks.ts` (tanstack skill); named export from `index.ts`.
4. Unit-test the service with a mocked `httpClient` (`features/<x>/service.test.ts`).
5. A new third-party origin the browser loads → add it to the matching CSP directive in
   `next.config.*` (never a wildcard).

## Anti-patterns

| Wrong | Right |
|---|---|
| `fetch` in a component or hook | service method → hook |
| `httpClient` for `/auth/*` | the bare-`fetch` transport in `features/auth/request.ts` |
| `serverHttpClient` in `service.ts`, or a feature barrel in a server layout | `features/<x>/server.ts` leaf |
| `` `${env.apiUrl}/api/v1/x` `` in a service | `httpClient.get("/x")` |
| Bare second-arg params object | `{ query: { … } }` |
| `Content-Type: multipart/form-data` set by hand | `postFormData` |
| `new ApiRequestError(msg, status)` | `new ApiRequestError(problem)` |
| `toast.error(error.message)` | `messageFromError(error, fallback)` |
| Branching on `title` / `detail` text | `errorCode` / `isErrorCode` |
| Handling 401 per call | Central in `httpClient` |
| `const c = cookies(); c.get(…)` (sync access) | `(await cookies()).get(…)` |
| `"use cache"` around a cookie-reading fetch | Dynamic read inside `<Suspense>` |
| `export const dynamic = "force-dynamic"` / `revalidate = N` in a segment | Remove it / `"use cache"` + `cacheLife` |
