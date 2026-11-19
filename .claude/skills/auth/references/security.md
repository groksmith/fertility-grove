# Auth Security Hardening Reference

OWASP-aligned controls for a Next.js app using backend-issued JWTs and cookies. Pair with the
storage decision in `../SKILL.md` §9. Items marked *backend* are asks for the API team, not
front-end code.

---

## 1. Cookie attribute matrix

| Attribute | Access-token cookie (JS-readable default) | Refresh-token cookie (if used) | Rationale |
|---|---|---|---|
| `HttpOnly` | No — JS sets `Authorization: Bearer` | **Required** | Refresh must never be readable by script |
| `Secure` | Required on https | Required | No cleartext transmission |
| `SameSite` | `Lax` | `Lax` or `Strict` | Blocks cross-site fetch CSRF; `Lax` allows top-level navigations from email links |
| `Path` | `/` | `/` (or the refresh endpoint's path when not `__Host-`) | |
| `Max-Age` | = access lifetime | = refresh lifetime | Prefer `Max-Age` over `Expires` (client-clock independent) |
| `__Host-` prefix | Recommended | Recommended | Forces `Secure` + `Path=/` + no `Domain` — blocks subdomain cookie injection |

Write the access cookie in one helper, with the value URL-encoded and `Secure` added on https:

```ts
// src/features/auth/storage.ts
document.cookie =
  `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${ACCESS_MAX_AGE}; SameSite=Lax` +
  (location.protocol === "https:" ? "; Secure" : "");
```

An HttpOnly refresh cookie can only be set server-side — by the backend, or by a Route Handler
that proxies login/refresh:

```ts
response.cookies.set("__Host-refresh", refreshToken, {
  httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE,
});
```

Don't use `__Host-` if the app is served from a sub-path or must share the cookie across subdomains.

⚠️ If the backend sets its *own* cookies on its origin (e.g. a CSRF-protected session cookie), a
`credentials: "include"` request will carry them and may be refused without a CSRF header.
Credential only the requests that need a backend cookie.

---

## 2. CSRF

`SameSite=Lax` does not stop same-site requests from another subdomain, or GET-triggered
mutations (don't have any). Layer:

- **`Sec-Fetch-Site` check** (*backend* or Route Handler) — reject `cross-site` on unsafe methods. Not forgeable by cross-origin script; zero round-trips.
- **Signed double-submit token** when cookies authenticate a mutation: `__Host-csrf` (non-HttpOnly, `SameSite=Strict`) = HMAC(session id, secret); the client echoes it as `X-CSRF-Token`; the server recomputes and compares.
- A pure `Authorization: Bearer` request is not CSRF-able (the browser never adds it on its own).

---

## 3. Token fingerprinting (optional, *backend*)

Bind the JWT to the browser: at login generate 128 random bits, put `SHA-256(fp)` in the token
as a claim, send the raw value as `__Host-fp` (`HttpOnly; Secure; SameSite=Strict`). Every
request re-hashes the cookie and compares. A stolen JWT without the cookie is useless.

---

## 4. Revocation

JWTs stay valid until expiry. In increasing cost:

1. **Short access lifetime** — the revocation gap equals it. ≤15 min is the ideal; longer lifetimes need the measures below.
2. **Revoke the refresh token on logout** (`POST /auth/logout` with the bearer) and **rotate on every refresh** (a reused old token → revoke the family).
3. **Token version** on the user record, bumped on logout-everywhere / password change (1 DB read per request).
4. **Denylist** of token hashes with TTL = remaining lifetime (cache read per request).

---

## 5. JWT signing (*backend*)

HS256 for one service (secret ≥ 64 random chars); RS256/ES256 when other services only verify.
Pin the algorithm on verify; never accept `alg: "none"`.

---

## 6. Proxy is not a gate (history: CVE-2025-29927)

In 2025 a crafted `x-middleware-subrequest` header let requests skip the old `middleware.ts`
(fixed in 14.2.25 / 15.2.3). Next 16 replaced middleware with `proxy.ts` (Node runtime), and its
docs still say not to rely on Proxy alone for auth — Server Functions are POSTs to their page
route and a matcher can silently skip them. Keep `requireSession()` in the protected layout and at
the top of every Server Action / Route Handler; the proxy is an optimization only. Track Next
security releases and stay on the latest patch of your minor.

---

## 7. Content Security Policy

The primary XSS mitigation for any JS-readable token. Set headers once (`next.config` `headers()`,
or `proxy.ts` when you need a per-request nonce — a nonce makes every page render dynamically) and guard them with an E2E spec
(e.g. `tests/public/security.spec.ts`):

```ts
const csp = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' the backend origin (none yet — the prototype has no backend)",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");
```

Add each new third-party origin to the exact directive it needs — never widen to a wildcard.
Render any operator-authored HTML only through a sanitizer (e.g. DOMPurify) wrapper.

Also set: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY` (or `frame-ancestors`), a `Permissions-Policy`, and
`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (at the CDN or in
`headers()` — verify it on production responses).

---

## Checklist

### Cookies
- [ ] Access cookie: `Secure; SameSite=Lax; Path=/`, value encoded, `Max-Age` = lifetime
- [ ] Refresh token stored per the SKILL §9 decision; HttpOnly if in a cookie
- [ ] No `Domain=` on sensitive cookies

### CSRF
- [ ] Cookie-authenticated mutations protected (`Sec-Fetch-Site` and/or double-submit)
- [ ] No state change on GET
- [ ] Only the requests that need backend cookies use `credentials: "include"`

### Tokens
- [ ] Access lifetime decided and documented (`TBD by the backend`)
- [ ] Refresh rotated on use, revoked on logout
- [ ] Single in-flight refresh on the client
- [ ] Algorithm pinned, `alg: none` rejected (*backend*)
- [ ] Tokens never logged, never in URLs, never in analytics

### XSS
- [ ] CSP deployed and tested; nonce-based `script-src` where feasible
- [ ] Rich text only through the sanitizer

### Infrastructure
- [ ] HSTS on every response
- [ ] Next.js on the latest patch of its minor (security releases ship often)
- [ ] `requireSession()` in the protected layout; `/api/*` handlers and Server Actions authenticate themselves
- [ ] No per-user read inside `"use cache"` (Cache Components) — session data is never shared-cached

### Logout
- [ ] Clear access cookie (`Max-Age=0`) and refresh token
- [ ] Best-effort `POST /auth/logout`
- [ ] `queryClient.clear()` + hard redirect
- [ ] Other tabs notified (storage event or `BroadcastChannel`)
