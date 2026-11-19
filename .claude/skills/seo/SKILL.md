---
name: seo
description: SEO and discoverability for an authenticated Next.js 16 App Router app with a few public pages — Metadata API (title template, description, OpenGraph, Twitter, viewport), per-route titles on "use client" pages via a server layout, canonical pitfalls, sitemap.ts and robots.ts that keep signed-in and token routes out of the index, icons, opengraph-image, JSON-LD. Use when touching metadata, link previews, robots, sitemap or indexability.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# SEO

Baseline (Nov 2026) — verify against package.json: next 16.4 (async request APIs only, Cache
Components), react 19.3.

## Scope first

Decide which repo owns what. **Default — change if your project differs:** this repo is the
**signed-in app** (`siteConfig.url` from `NEXT_PUBLIC_APP_URL`); a separate marketing site owns
content SEO, rich results, `Organization` JSON-LD and keyword work.

Here, SEO means:

1. Good **tab titles** everywhere and **link previews** (OpenGraph/Twitter) for the public pages people share or land on (`/login`, `/signup`, `/forgot-password`, public content).
2. **Nothing signed-in or token-bearing is indexed.**
3. Correct canonical, sitemap, robots and icons.

## What to provide

| Piece | Where | Notes |
|---|---|---|
| Single source | `src/config/site.ts` | `name`, `description`, `url`, contact/legal links — import, never retype |
| Root `metadata` | `src/app/layout.tsx` | `title: { default: siteConfig.name, template: "%s · Fertility Grove" }`, `description`, `applicationName`, `metadataBase: new URL(siteConfig.url)`, `openGraph`, `twitter`. **No `alternates.canonical` here** (pitfall below) |
| Root `viewport` | `src/app/layout.tsx` `export const viewport` | `themeColor`, `colorScheme`, `viewportFit` live here, not in `metadata`. Server-only; export `viewport` **or** `generateViewport`, never both. Viewport cannot stream |
| Icons | `metadata.icons` pointing at `/assets/...`, or `app/icon.*` file conventions | Pick one; if the project keeps all images under `public/assets/`, use `metadata.icons`. Since 16.2, `icon.svg` + `icon.png` (same base name) render as separate `<link>`s |
| Per-route metadata | server `layout.tsx` beside each client page | See rule 2 |
| `sitemap.ts` | `src/app/sitemap.ts` | Public, indexable pages only |
| `robots.ts` | `src/app/robots.ts` | Allow public pages; disallow signed-in prefixes and token routes |
| OG image | `src/app/opengraph-image.tsx` (optional) | Rule 7 |

## Canonical pitfalls

- **A root-level `alternates.canonical` is inherited by every page that doesn't override it.** Put `canonical: "/"` in the root layout and `/login`, `/signup` and every public page declare `/` as their canonical — telling search engines they are duplicates of the home page. Set a self canonical per public page (or per public layout) instead.
- If `/` redirects (e.g. to `/login` or the dashboard), it is not a page: no canonical pointing at it, not in the sitemap.
- Canonicals are paths (`metadataBase` resolves them) and never include searchParams or tokens.

## Rules

1. **Metadata API or file conventions only** — never hand-written `<head>`, never `document.title`.
2. **A `"use client"` page cannot export `metadata`.** Put the route's `metadata` in a server `layout.tsx` beside the page, or in a route-group layout for a shared default:
   ```tsx
   // src/app/(dashboard)/settings/layout.tsx  (server component)
   export const metadata: Metadata = { title: "Settings" };
   export default function Layout({ children }: { children: React.ReactNode }) { return children; }
   ```
   `generateMetadata` likewise lives in a server file.
3. **`params` / `searchParams` are Promises, and the sync forms are gone** — `await` them in `generateMetadata`. Type props with the generated `PageProps<"/route">` (`npx next typegen`). A fetching `generateMetadata` runs on every request; for signed-in pages a static title is almost always enough.
   Under **Cache Components**, a `generateMetadata` / `generateViewport` that reads runtime data (cookies, headers, uncached fetches) needs `"use cache"` (shared data only — never per-user), a dynamic marker, or `export const instant = false` on that segment; otherwise the build reports a blocking prerender. Static `metadata` objects need none of this.
4. **Titles:** short (`"Dashboard"`, `"Settings"`); the template adds the brand. ≤ 60 chars, front-loaded. Descriptions ≤ 155 chars, only where previews matter.
5. **Public, shareable pages** get a self canonical: `alternates: { canonical: "/login" }`.
6. **Signed-in and token pages** get `robots: { index: false, follow: false }` (a `(dashboard)` group layout can set it once) **and** a `robots.ts` disallow, and never appear in the sitemap. A token page must not echo its token into `<title>`, OG tags or canonical. Every new public token route (verify email, reset password, accept invite) needs both.
7. **OG image**, if added: `src/app/opengraph-image.tsx` with `ImageResponse` from `next/og`, 1200×630, brand colours from the values in `src/styles/theme.css`, `Instrument Sans` loaded explicitly from the font files (the default `ImageResponse` font is Geist since 16.2). Next wires `og:image` automatically — don't hand-reference a URL that might 404. **No `runtime` export** — Node is the default, `runtime = "edge"` is deprecated, and Cache Components rejects any `runtime` export. Image functions (`opengraph-image`, `twitter-image`, `icon`, `apple-icon`) receive `params` **and `id`** as Promises:
   ```tsx
   export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
     const { slug } = await params;
     return new ImageResponse(<Card title={titleFor(slug)} />, { width: 1200, height: 630 });
   }
   ```
8. **JSON-LD** only for a real public content page: server-rendered `<script type="application/ld+json">` (data, not executed, so a strict CSP doesn't block it), data from `siteConfig`, escape `<` in the JSON, validate with the Rich Results Test.
9. **No `keywords` meta, no stuffing**; previews must match the page.
10. **`alternates.languages`** only with real localized routes.

```ts
// src/app/sitemap.ts — split sitemaps: `id` is a Promise in Next 16
export async function generateSitemaps() { return [{ id: 0 }]; }
export default async function sitemap({ id }: { id: Promise<number> }): Promise<MetadataRoute.Sitemap> {
  const page = await id;
  return publicEntries(page).map((p) => ({ url: `${siteConfig.url}${p.path}`, lastModified: p.updatedAt }));
}
```

A single `sitemap.ts` without `generateSitemaps` takes no arguments. `robots.ts` is unchanged in
Next 16:

```ts
// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/login", "/signup"], disallow: ["/dashboard", "/settings", "/verify-email", "/reset-password"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

Keep the disallow list in step with the protected route prefixes and the token routes in
`publicPaths` (`src/config/auth.ts`, auth skill). Signed-in routes are also protected by the auth
gate (a crawler is redirected to `/login`), but token pages are public and rely on `noindex`.

## Audits

```bash
# Server files that set metadata
grep -rln "export const metadata\|generateMetadata" src/app

# Next 15-era sync access / runtime exports in metadata files
grep -rnE "params\.[a-zA-Z]+|export const runtime" src/app --include='*image.tsx' --include='icon.tsx' --include='sitemap.ts' --include='layout.tsx'

# A root canonical (should not exist)
grep -n "canonical" src/app/layout.tsx

# Public routes vs robots disallow — every token route should be disallowed
sed -n '/export const publicPaths/,/]/p' src/config/auth.ts
cat src/app/robots.ts src/app/sitemap.ts

# Rendered tags on a production build
curl -s http://localhost:3005/login | grep -oE '<(title|meta|link)[^>]*>' | grep -E 'title|canonical|robots|og:|twitter:'
```

Check `/robots.txt`, `/sitemap.xml` and the rendered `<meta name="robots">` on a token page after any change.

## Anti-patterns

1. A root-level `alternates.canonical`.
2. Signed-in or token URLs in the sitemap; a token in a title, OG tag or canonical.
3. `disallow: ["/"]` — de-indexes the public pages too.
4. A redirecting `/` listed in the sitemap.
5. `document.title` in a client effect instead of a server layout's `metadata`.
6. Content/marketing SEO built into the app when another repo owns it.
7. Reading `params` / `id` without `await` in metadata, image or sitemap functions; a `runtime` export on an OG image.
