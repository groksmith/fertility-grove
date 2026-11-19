---
name: refactor
description: Plan and carry out minimal-change refactors in a Next.js 16 App Router app that respect the layered architecture and preserve behaviour and UI exactly — when a refactor is justified, impact mapping, pinning behaviour with tests, where code should move, and validation by exit code. Use when restructuring, splitting, moving or deduplicating code.
argument-hint: "[target-area]"
allowed-tools: Read, Glob, Grep, Bash
---

# Refactor

Smallest change that fixes a real problem, with behaviour (and UI/UX) unchanged.

## Justified

- A rule broken: `src/architecture.test.ts` fails, a cross-feature import, a feature reached past
  its barrel
- Logic duplicated in 3+ places (e.g. a private `messageFromError` → `@/lib/api-message`)
- Fetching, toast or invalidation in a component instead of service/hook
- Types drifted from `the OpenAPI spec (not yet available)`
- A god-file split where one file holds several unrelated jobs
- A deprecated API that the next major removes, in code you're already touching or before that
  upgrade: TanStack `fetchQuery` / `prefetchQuery` / `ensureQueryData` → `queryClient.query()`;
  RHF `FormStateSubscribe` → `<FormState>`; a `middleware.ts` entry → `proxy.ts`

## Not justified

"Could be cleaner", typing code you aren't touching, a helper for one call site, future-proofing,
blanket `useMemo`/`memo` without a profile (perf skill), migrating working Zod 3-style schemas to
Zod 4 idioms just for style, rewriting a working `forwardRef` as ref-as-prop just for style,
turning on the React Compiler or Cache Components as part of a refactor (each is its own decision).

**Removing existing memoization** is a behaviour change if the React Compiler is (or will be) on —
its output depends on it. Do it only with tests that pin the behaviour, never as drive-by cleanup.

## Process

1. **Map impact** — every importer of what moves:
   `grep -rn 'from "@/features/<x>"' src` (match the formatter's quote style — Biome/Prettier default
   to double quotes, so a single-quote pattern misses everything).
   <3 files: do it. 3–5: checklist. More: plan first.
2. **Pin behaviour** — make sure tests cover it before moving (`yarn test <path>`); add one if not.
3. **Move, then fix imports, then the barrel** — one concern per change; delete dead code fully
   (no `// removed`, no re-export shims).
4. **Validate** — check exit codes, not tails:
   ```bash
   yarn format && yarn typecheck && yarn lint && yarn test
   yarn build         # Next 16's dev server writes .next/dev, so this no longer clobbers it
   ```
   If a build still breaks a running dev server, build into a separate `distDir`
   (`NEXT_DIST_DIR=.next-check`, CLAUDE.md → Commands).
5. **Update skills** whose described pattern changed.

## Where to move things

| Smell | Destination |
|---|---|
| Component in `shared/` needs a feature hook | `components/common/` |
| Two features need the same logic | `lib/` (domain-agnostic) — never a cross-feature import |
| Server layout needs a feature's data/key | the feature's `server.ts` / `keys.ts` / `state.ts` leaf |
| `httpClient` call outside a service | `features/<x>/service.ts` |
| Route-private component reused elsewhere | promote to `shared` or `common` (component-design skill) |

Boolean-prop sprawl → compound components (`composition-patterns` skill).

## High-risk files

Treat these as wide-blast-radius in any project built on this kit: the shared `FormField` (every
form), `lib/http.client.ts` (every service; 401 handling), the protected layout that runs
`requireSession()` (every signed-in page), `app/providers.tsx`, the project's widest feature modules,
and `components/ui/*` (sanctioned edits are lost on `shadcn add`).

## Don't

Change behaviour or visuals in a refactor; add a new library for something the project already does
(SWR next to TanStack Query, Zustand next to context); widen `ALLOWED` in `architecture.test.ts` to
make a move pass.
