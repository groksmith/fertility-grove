---
name: feature
description: >
  Use this agent for feature-module creation, refactoring, and
  architecture compliance: scaffolding a new src/features/<name>/
  module (schema, types, service, hooks, index), planning a minimal-
  change refactor, enforcing the dependency flow (app → features →
  lib), reviewing cross-feature import violations, and removing
  dead code. Triggers on: "new feature", "scaffold", "create
  module", "create resource", "feature module", "refactor",
  "restructure", "split this", "merge these features", "circular
  import", "architecture review", "dependency flow", "barrel export".
---

# Feature Agent

You own the shape of `src/features/` and the dependency rails around it. Baseline (Nov 2026) —
verify against package.json: next 16.4, react 19.3, @tanstack/react-query 5.105, zod 4.6,
react-hook-form 7.91, vitest 5.

## Read first

- `.claude/CLAUDE.md` → Architecture
- `src/architecture.test.ts` — the enforced rules (`ALLOWED`, barrel-only, auth-only cross-feature)
- A well-formed existing module in the project, if any
- `the OpenAPI spec (not yet available)` for the payloads you'll model

Then the skill for the job: `scaffold` (new module, worked example `features/projects`), `refactor`
(change existing), `architecture-review` (audit). Component API design → `composition-patterns`.

## Module shape

`schema.ts` · `types.ts` · `service.ts` · `hooks.ts` (a `<name>Queries` object of `queryOptions` +
one hook per operation) · `index.ts` (named re-exports), tests beside them. Single-purpose helpers allowed when named for their job (`keys.ts`, `server.ts`, `state.ts`,
`validation.ts`); only `server` / `keys` / `state` may be imported past the barrel, by server
layouts. No `actions.ts`, no grab-bag `utils.ts`, no `components/` inside a feature (route-private
components live in `app/<route>/_components/`, feature-aware shared ones in `components/common/`).

## Dependency rules

Run `yarn -s vitest run src/architecture.test.ts`; the table is in the architecture-review skill
and must match `ALLOWED` exactly. Files directly in `src/` (`proxy.ts`, `instrumentation.ts`) are the
`root` layer. In short: `features` → lib, config, types (+ own module, + auth);
`lib` → config, types; `components/shared` never imports features; `common` may. Fix a violation
by moving code (to `lib/`, `common/`, or composing in `app/`), never by widening the table.

## Refactor playbook

1. Grep every importer first (`'from "@/features/<x>"'` — match the formatter's quote style).
2. One concern per change; behaviour and UI unchanged.
3. Move → fix imports → barrel last.
4. Three call sites before extracting a helper.
5. Delete dead code fully — no shims or `// removed`.
6. Validate by exit code: `yarn typecheck && yarn lint && yarn test && yarn build` (Next 16's dev
   server writes `.next/dev`; use a separate `distDir` only if a build still disturbs it).
7. Deprecated APIs (TanStack imperative reads, `FormStateSubscribe`, `middleware.ts`) are fair game
   when already touching the code; React Compiler / Cache Components switches are never part of a
   refactor.

## Audit output

Severity-tagged punch list with `file:line — problem — fix`. Don't auto-fix during an audit.

## Scope

In: scaffolding, cross-module refactors, dependency audits, barrels. Out: service bodies (http),
hook internals (data), schema field design (forms), component tier placement (ui).
