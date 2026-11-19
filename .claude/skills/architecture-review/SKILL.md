---
name: architecture-review
description: Review a Next.js 16 App Router codebase for architecture compliance — the layered dependency rules enforced by src/architecture.test.ts, barrel-only feature imports, no cross-feature imports, five-file feature module shape, sanctioned patterns (TanStack Query, RHF + Zod, httpClient), component tiers and asset placement. Use when auditing structure, reviewing a PR for layering, or a guard test fails.
allowed-tools: Read, Glob, Grep, Bash
---

# Architecture Review

**Start by running the guard** — it checks every import in `src/` (tests excluded) and names the
file, the import and the rule it breaks:

```bash
yarn -s vitest run src/architecture.test.ts
```

If the project doesn't have it yet, copy the kit's `templates/guards/architecture.test.ts` to
`src/architecture.test.ts`. Spend the manual pass on what the guard cannot see: placement, module
shape, patterns (§2–§4).

## 1. Dependency rules (mirrors `ALLOWED` in `src/architecture.test.ts`)

A layer may always import itself. Layer = first path segment under `src/` (`components/<tier>` for
components); a file directly in `src/` (`proxy.ts`, `instrumentation.ts`) is `root`.

| Layer | May import |
|---|---|
| `app` | features, components/ui, components/shared, components/common, components/icons, lib, config, hooks, types |
| `features` | lib, config, types — plus **its own module** and **`features/auth`** |
| `components/common` | features, components/ui, components/shared, components/icons, lib, config, hooks, types |
| `components/shared` | components/ui, components/icons, lib, config, hooks, types (**no features**) |
| `components/ui` | lib, hooks, types |
| `components/icons` | lib |
| `hooks` | lib, config, types |
| `lib` | config, types |
| `config` | components/icons, types |
| `types` | — |
| `test-utils` | everything except `root` |
| `root` | lib, config, types |

Nothing imports `app`. Two further checks the guard runs:
- **Barrel only** across modules: `@/features/<x>`. The only deep paths allowed from outside are the
  server-safe leaves `server`, `keys`, `state` (used by server layouts, because the barrel exports
  client hooks).
- **No cross-feature imports**, `auth` excepted (session key / identity). **Default — change if your
  project differs:** if you sanction a different shared feature, change it in the guard *and* here.

A failure is fixed by **moving code**, never by widening `ALLOWED`: a component that needs a feature
hook belongs in `common`, not `shared`; logic two features need goes to `lib/` (domain-agnostic); a
composition of two features happens in `app/` or `common/`. `config/` reaches authored icons by
direct path (`@/components/icons/<Name>`), never through the shared barrel, which would pull the
whole shared graph into config.

## 2. Feature module shape

Core files: `schema.ts`, `types.ts`, `service.ts`, `hooks.ts`, `index.ts`, tests beside them (scaffold
skill). A small module may need fewer. Single-purpose helpers named for their job are fine (`keys.ts`,
`server.ts`, `state.ts`, `validation.ts`, `grouping.ts`).

Flag:
- `actions.ts` / server actions, `data.ts`, `mappers.ts`, a grab-bag `utils.ts`
- a global query-key registry (per-feature `keys.ts` is fine)
- standalone exported service functions instead of a `<name>Service` object
- `export *` in a barrel (named re-exports only)
- client hooks or `"use client"` in `server.ts` / `keys.ts` / `state.ts`
- `serverHttpClient` outside a `server.ts` leaf or `lib/`
- a `components/` folder inside a feature

## 3. Patterns

- Server state: TanStack Query; forms: react-hook-form + Zod; local UI: `useState` / context. No
  second server-state library (SWR, Redux) alongside.
- HTTP through `httpClient` / `serverHttpClient`. Bare `fetch` only where the http skill allows:
  auth endpoints, anonymous public content, streams.
- Toast + invalidation inside mutation hooks; errors via `@/lib/api-message`. Flag new private copies
  of `messageFromError`; don't mass-refactor old ones in a review.

### Version drift (baseline Nov 2026: next 16.4, react 19.3, TanStack Query 5.105, RHF 7.91, zod 4.6)

Flag in **new or changed** code; list old occurrences as Low without fixing them in the review:

| Flag | Expected |
|---|---|
| A `middleware.ts` entry point | `proxy.ts` exporting `proxy` (Node runtime) — unless the project deliberately keeps Edge, which only the deprecated `middleware.ts` still offers |
| Sync `cookies()` / `headers()` / `params` / `searchParams` | `await` them (sync access is removed in Next 16) |
| Segment exports `dynamic`, `revalidate`, `fetchCache`, `runtime` under Cache Components | Remove; `"use cache"` + `cacheLife` / `cacheTag` for shared data |
| `"use cache"` on anything that reads cookies or calls `serverHttpClient` | A dynamic read inside `<Suspense>` |
| One-argument `revalidateTag(tag)` | `revalidateTag(tag, "max")` |
| `fetchQuery` / `prefetchQuery` / `ensureQueryData` (+ infinite variants), `isServer`, `query.promise` | `queryClient.query()` / `infiniteQuery()`, `environmentManager.isServer()`, `useSuspenseQuery` |
| `FormStateSubscribe`, `<Watch names>`, `watch(callback)` | `<FormState>`, `<Watch name>`, `subscribe` |
| `.pick` / `.omit` / `.extend` / `.merge` on a refined Zod object | Compose unrefined, refine last; `.safeExtend()` |
| `forwardRef` in a new component | `ref` as a prop |
| New `useMemo` / `useCallback` / `React.memo` with no profile cited | Remove, or cite the measurement (React Compiler stance: perf skill) |

## 4. Components and assets

| Tier | Location | Import |
|---|---|---|
| ui | `components/ui/` | direct path; shadcn, only the project's sanctioned ⚠️-commented edits (shadcn-ui skill) |
| shared | `components/shared/` | barrel `@/components/shared`; no domain knowledge |
| common | `components/common/` | direct path; may use feature hooks |
| icons | `components/icons/` | direct path; leaf files |
| route-private | `app/<route>/_components/` | relative |

Static images live under `public/assets/<subfolder>/`, never `public/` root or `src/`.

Component API shape (compound components vs boolean props): `composition-patterns` skill. Perf
findings: perf skill. Project rules in CLAUDE.md win over any vendored skill's defaults.

## Output

```markdown
## Architecture Review
- architecture.test.ts: pass / N violations
- Module shape: …   Patterns: …   Components: …

### Critical — rule violations, cross-feature imports
### Medium — wrong pattern, misplaced module
### Low — naming, small structural issues
Each: file:line — problem — fix (move/rename), never "widen the table".
```
