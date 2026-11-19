---
name: auth
description: Authentication in a Next.js 16 App Router app talking to a separate backend — login/logout, bearer + refresh token lifecycle, server-side session gate (requireSession) under Cache Components, proxy.ts limits, single-flight refresh, cross-tab renewal, post-auth navigation, optional two-factor (202 challenge) and OAuth, token storage trade-offs. Use when building or debugging sign-in, sessions, 401 handling or route protection.
argument-hint: "[login | logout | refresh | session | protect | oauth | 2fa | security]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Auth

The default design for an App Router app whose backend issues tokens. Each rule below exists
because breaking it produced a real bug (loops, stale pages, surprise logouts). Read the project's
own auth files before changing them — their comments carry the reasons.

Baseline (Nov 2026) — verify against package.json: next 16.4 (`proxy.ts`, async request APIs
only, Cache Components), react 19.3, Node ≥ 22.22 (`toolchain`).

**Default — change if your project differs:** backend-issued **bearer access token + refresh
token**, endpoints under `the backend origin (none yet — the prototype has no backend)/api/v1/auth/*`. The placeholders this skill uses (named
without brackets here so a global replace leaves the table readable):

| Placeholder | Meaning |
|---|---|
| `ACCESS_TOKEN_LIFETIME` | Access-token lifetime, e.g. 15 min – 8 h. Shorter = smaller revocation gap |
| `REFRESH_TOKEN_LIFETIME` | Refresh-token lifetime, e.g. 7–30 days; rotated on every refresh |
| `ACCESS_COOKIE` | Name of the access-token cookie (e.g. `app_access`) |
| `TOKEN_STORAGE` | Where the refresh token lives — see §9 |
| `POST_LOGIN_ROUTE` / `POST_LOGOUT_ROUTE` | Where login and logout land, e.g. `/dashboard` / `/login` |

## Architecture

```
Browser                                              Backend (/api/v1/auth/*)
[Login form] ─ POST /auth/login ───────────────────→ 200 { accessToken, refreshToken, ...routing blocks }
                                                     or 202 { challenge }  (2FA on — no tokens, §7)
  accessToken  → cookie TBD by the backend (SameSite=Lax, Secure on https, Max-Age = lifetime)
  refreshToken → TBD by the backend (prototype: localStorage)

[Every API call] httpClient reads the cookie → Authorization: Bearer
  401 → tryRefresh() → POST /auth/refresh-token → rotate both → retry once
        └ refresh fails → hardLogout(): clear storage, window.location.href = "/login"

[Server render]
  proxy.ts         — Node runtime; cookie PRESENCE only (no cookie + non-public → /login?from=…)
  (dashboard)/layout.tsx — static shell + <Suspense><SessionGate/></Suspense>
  SessionGate      — requireSession() → GET /auth/me → app-level gates (onboarding, consent…)
  getSession()     — React cache(): per-request dedupe, never a persistent cache
```

### File map (provide these)

| File | Responsibility |
|---|---|
| `src/config/auth.ts` | Every key and route constant: `AUTH_COOKIE`, refresh/redirect storage keys, `POST_LOGIN_REDIRECT`, `POST_LOGOUT_REDIRECT`, `publicPaths` (each entry commented with *why* it is public) |
| `src/features/auth/request.ts` | Bare-`fetch` transport for `/auth/*` (never `httpClient`) — maps ProblemDetails to `ApiRequestError` incl. `code` |
| `src/features/auth/service.ts`, `hooks.ts` | `authService`; `useSession`, `useLogin`, `useSignup`, `useLogout`, `useRedirectIfSignedIn`, `refreshFromAuth` |
| `src/features/auth/storage.ts` | Token writers/clearers (`writeAuthTokens`, `clearAuthStorage`), pending-redirect helpers, `isSafeInternalPath` |
| `src/features/auth/cross-tab.ts` | Renewal via another tab; one account per browser (§4) |
| `src/features/auth/keys.ts` | `sessionQueryKey` — server-safe leaf |
| `src/features/auth/server.ts` | `import "server-only"`; `getSession = cache(...)`, `requireSession()`. **Not** in the barrel |
| `src/lib/auth.refresh.ts` | `setRefreshHandler` / `tryRefresh` — promise-locked bridge so `lib` never imports `features/auth`; also `getAccessToken()` (reads `AUTH_COOKIE` / `TBD by the backend (prototype: localStorage)`) and `hardLogout()` (clear + `window.location.href = /login`) for `httpClient` |
| `src/lib/http.client.ts` / `http.server.ts` | 401 → refresh → retry → hard logout / `await cookies()` + throw `ApiRequestError` on 401 (see `http` skill) |
| `src/app/providers.tsx` | Registers `setRefreshHandler(refreshFromAuth)` on mount |
| `src/proxy.ts` | Cookie-presence redirect only (exports `proxy`; Node runtime, not configurable) |

### Layering

- `features/auth` owns auth semantics. `lib/http.*` and `lib/auth.refresh.ts` know cookie mechanics only and **never import `features/auth`** — they read `AUTH_COOKIE` from `@/config/auth` and call the registered handler. Enforced by `src/architecture.test.ts`.
- Client code imports `@/features/auth`; server code imports `@/features/auth/server` (or `keys`). `server-only` makes a client import fail the build.
- Nothing outside the auth feature touches the cookie literal — import `AUTH_COOKIE`.

---

## 1. Login and post-auth routing

`useLogin` (and an OAuth callback) branch in this order:

1. 2FA challenge (`isTwoFactorChallenge(data)`, if enabled) → park it in sessionStorage, go to the challenge page. **Before** any token write — there are no tokens on a 202.
2. `writeAuthTokens(...)`, `queryClient.removeQueries({ queryKey: sessionQueryKey })`.
3. Target = safe `from` param → else `consumePendingRedirect()` → else a route derived from the **server's** routing blocks on the response (e.g. `onboarding.completed`), never from profile presence or localStorage.
4. **Hard navigation** — `window.location.href = target`. Never `router.push()`: the Router Cache and the already-rendered RSC payload don't see the new cookie, so the next page renders signed-out or bounces.

**Already signed in on `/login` / `/signup`:** `useRedirectIfSignedIn()` asks `GET /auth/me` client-side and, on a live session, navigates where a fresh sign-in would land. Never in the proxy (§3).

Login errors render inline, not as toasts. Forgot-password always reports success (no account enumeration). An unverified-email refusal should be distinguishable by ProblemDetails `code` so the form can offer "resend".

### Return path across off-app hops

`?from=` doesn't survive an email-verification round-trip, an OAuth hop, or a login ⇄ signup switch. Login/signup call `writePendingRedirect(from)`; the next successful sign-in `consumePendingRedirect()`s it (single use, cleared on logout). Only same-origin paths pass `isSafeInternalPath` — reject `//evil`, `/\evil`, schemes, and tab/newline tricks.

## 2. Session validation (server) — the authoritative gate

```ts
// src/features/auth/server.ts
import "server-only";
export const getSession = cache(async () => {
  try { return await serverHttpClient.get<Session>("/auth/me"); } // awaits cookies() inside
  catch (e) {
    // Only "no session" collapses to null. A 500 / network error re-throws to error.tsx —
    // never bounce a user to /login because the backend hiccuped.
    if (e instanceof ApiRequestError && (e.status === 401 || e.status === 404)) return null;
    throw e;
  }
});
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}
```

- **Request APIs are async only.** `await cookies()`, `await headers()`, `await params`,
  `await searchParams` — the synchronous forms are gone in Next 16. Type pages with the generated
  `PageProps<"/route">` / `LayoutProps<"/route">` (`npx next typegen`) instead of hand-written props.
- **Cache Components (`cacheComponents: true`) — Default — change if your project differs.** A
  session read touches cookies, so it is **dynamic**: it must run inside a `<Suspense>` boundary or
  the build reports a blocking prerender. The protected layout renders a static shell (no per-user
  content) and puts the gate below it:

  ```tsx
  // src/app/(dashboard)/layout.tsx
  export default function Layout({ children }: LayoutProps<"/">) {   // global from `next typegen`
    return (
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <SessionGate>{children}</SessionGate>  {/* async: requireSession() + gates + HydrationBoundary */}
        </Suspense>
      </AppShell>
    );
  }
  ```
- **Never cache a per-user read.** No `"use cache"` (or `cacheLife`/`cacheTag`) around
  `getSession`, `/auth/me` or anything keyed by the token — a shared cache entry leaks one user's
  session to another. React `cache()` is fine: it dedupes within one request only.
- Run app-level gates (onboarding, consent…) from the same response, and seed `session` into a
  dehydrated `QueryClient` (`HydrationBoundary`) so the client `useSession()` doesn't refetch. A new
  signed-in page goes under `(dashboard)` — no per-page guard. Call `redirect()` **outside** any
  `try` (observability skill).
- **Server Functions authenticate themselves** (if the project uses any). A Server Action is a POST to its page route, so a
  proxy matcher can silently skip it and the layout gate does not run for it — call
  `requireSession()` (or verify the token) at the top of every action, like a Route Handler.

## 3. Proxy — presence check, never the gate

`src/proxy.ts` (exports `proxy`, Node runtime — setting `runtime` there throws) checks cookie
**presence** only: no cookie + non-public path → `/login?from=<path>`. Matcher skips `_next/`,
`assets/`, `api/` and files with an extension — so every `/api/*` route handler must authenticate
itself. Next's own docs say not to rely on Proxy alone for auth.

⚠️ **Never redirect a token-present user away from `/login`.** An expired cookie passes the proxy,
`requireSession()` gets a 401 and redirects to `/login`; if the proxy bounced cookie + `/login` back
into the app, that is a 307 loop.

*History:* Next 16 renamed `middleware.ts` → `proxy.ts` (codemod
`npx @next/codemod@canary middleware-to-proxy .`; config keys renamed, e.g.
`skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`). The 2025 CVE-2025-29927 header bypass of
the old middleware is why this kit treats the proxy as an optimization, never the gate.

Unit-test the matcher in Vitest with `unstable_doesMiddlewareMatch({ config, url })` (still named
for middleware in 16.4; pass `proxy.ts`'s exported `config`), plus `isRewrite` / `getRewrittenUrl` /
`getRedirectUrl`, from `next/experimental/testing/server`. Testing `server.ts` itself needs the
`server-only` alias in `vitest.config.mts` (`toolchain`).

A new public route (email link, token page) goes into `publicPaths` with a comment saying why.
Match segment-bounded (`/account/x` must not make `/account-x` public).

## 4. Refresh, 401 and cross-tab

- `httpClient` on 401 → `tryRefresh()`; retry once on success, else `hardLogout()`. Exclude 401s whose `code` means "wrong second-factor code" — refreshing would replay it toward lockout.
- **Single flight:** `tryRefresh()` holds one module-scoped `inFlight` promise, so a burst of concurrent 401s sends exactly one refresh. Rotation revokes the old token — two parallel refreshes log the user out.
- **Cross-tab renewal** (when the refresh token is per tab): a tab without one asks over `BroadcastChannel("<app>-auth")`; one tab holding a token answers (pick it with a Web Lock); the access cookie is shared. Only when no tab answers (~3 s) → clear and fail.
- **One browser, one account (recommended):** each signed-in tab records `{ id, email }` in localStorage; a different record → that tab shows "You signed in as another account"; removal (logout elsewhere) → other tabs go to `/login`.
- Per-account browser state is keyed by account id (`<app>:<accountId>:<thing>`). Never an account-less shared key that an effect "corrects" — two tabs overwrite each other in a loop.
- **Auth endpoints bypass the interceptor.** `features/auth/*` calls never go through `httpClient`: the interceptor would recurse into refresh, and a 401 from a wrong password/code would "log out" a session that does not exist yet.

## 5. Logout

Best-effort `POST /auth/logout` (revokes the refresh token server-side; `.catch` with a comment) → `clearAuthStorage()` (cookie `Max-Age=0`, refresh token, pending redirect, signed-in record — the last tells other tabs) → `queryClient.clear()` → `window.location.href = /login`.

## 6. OAuth (optional)

1. `GET /auth/<provider>` → `{ authorizationUrl, state }`. Verify the URL's origin is the provider's (https) before navigating. Store `state` (and anything else that must survive the hop, e.g. a terms-accepted flag) in sessionStorage — a URL param won't survive.
2. Callback page `/auth/<provider>/callback?code&state` verifies `state` **client-side**; a mismatch throws and is never swallowed. Send `code` to the backend, clear the stored keys.
3. Same branches as §1: 2FA challenge (the provider is the first factor only) → tokens → route. An `isNewAccount` flag is for analytics, never routing.
4. The `code` is single-use — a recoverable refusal (e.g. consent missing) renders a screen that restarts authorize, not a toast.

## 7. Two-factor (optional)

It changes how a session is **obtained**, never what it may do — don't gate routes on "2FA enabled".

- **Login / OAuth callback can answer 202 `{ challenge }`.** Branch on `isTwoFactorChallenge(data)` — not `response.ok` (a 202 passes it), not `data.accessToken`. Challenge token → sessionStorage, never the URL. Post-login routing runs on the response to the **completed** challenge.
- **Enrollment** is a backend state machine (off → pending → verified → enabled). Recovery codes are shown once (copy/download/print); announce success only after the final step. No optimistic UI.
- **Re-auth:** sensitive routes may answer `403` with a re-auth `code`; prompt inline, retry the call, never restart the flow.
- **Errors:** branch on the ProblemDetails `code`, never `title`/`detail`; render `detail` verbatim. Never auto-retry a code (single-use; replays count toward lockout); latch the submit button.
- Always offer the setup key next to the QR code (accessibility path) and "use a recovery code instead".
- A **trusted-device** cookie (HttpOnly, set by the backend) needs `credentials: "include"` on exactly the routes that set/read/clear it; keep the rest of the auth transport `credentials: "omit"` so backend CSRF checks don't refuse them.

## 8. Password

Mirror the backend's rules in the Zod schema exactly (min/max length); drive a live checklist from one rules array instead of duplicating `.refine()`s. Reset pages read `token` from searchParams and hard-redirect to `/login` on success.

## 9. Token storage — `TBD by the backend (prototype: localStorage)` (decide per project)

| Option | XSS exposure | CSRF exposure | Notes |
|---|---|---|---|
| Refresh token in **HttpOnly `__Host-` cookie**, set by the backend or a Route Handler | Not readable by JS | Needs CSRF defense (SameSite + `Sec-Fetch-Site` or double-submit) | **Recommended** when the backend can do it. Refresh endpoint must be same-site |
| Refresh token in **sessionStorage** | Readable by injected script, but per tab, gone on close | None (sent explicitly) | Needs cross-tab renewal (§4); mitigate with a short access token + strict CSP |
| Refresh token in **localStorage** | Readable by injected script, survives forever | None | Avoid |
| Access token in a **JS-readable cookie** | Readable by script | Bearer header, not auto-sent auth → low | Lets `serverHttpClient` read it via `await cookies()` and the proxy check presence |
| Access token **in memory only** | Smallest | None | Server render can't see it — conflicts with `requireSession()`; only for client-only apps |

Whatever you pick: rotate refresh tokens, revoke on logout, never log tokens, never send the refresh token anywhere but the refresh endpoint. Cookie attributes, CSRF, CSP, revocation and the security checklist: `references/security.md`.

## 10. Anti-patterns

| Wrong | Right |
|---|---|
| `router.push()` after login/logout/callback | `window.location.href` |
| Proxy redirecting a token-present user off `/login` | `useRedirectIfSignedIn` on the page |
| Proxy as the only guard | `requireSession()` in the protected layout (and in each Server Action) |
| `"use cache"` around the session / any per-user read | Dynamic read inside `<Suspense>`; React `cache()` only |
| Sync `cookies()` / `params` access | `await` them (Next 16 removed the sync forms) |
| `getSession` returning null on a 500 | Only 401/404 → null; re-throw the rest |
| `httpClient` for `/auth/*` | Bare-fetch transport in `features/auth/request.ts` |
| `lib/*` importing `features/auth` | `AUTH_COOKIE` from config + `setRefreshHandler` bridge |
| `@/features/auth/server` in a client component | `@/features/auth` barrel |
| Two refresh requests in parallel | One in-flight promise |
| Branching login on `response.ok` / `accessToken` | `isTwoFactorChallenge(data)` first |
| Routing on profile presence / localStorage flags | The server's routing blocks |
| Account-less shared localStorage key | Key it by account id |
| `redirect()` inside a `try` that catches everything | Call it after the `try` |

## Related

`http` (client/server clients, ProblemDetails), `observability` (error boundaries, digest),
`playwright-testing` (session fixtures), `references/security.md`.
