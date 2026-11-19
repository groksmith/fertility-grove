# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

It follows the same conventions as `pharos-web` (tooling, layering, naming, quality gates). Where this
project differs, it is because Fertility Grove is a different product, and the difference is spelled
out here; this file wins over habits carried from Pharos.

## Project Overview

**Fertility Grove** member web app — a clickable, **front-end-only prototype** of the Fertility Grove
MVP (PRD v2.0): a private community for people going through infertility and their partners. It
covers the member app only; the moderator and admin panel (PRD §19–20) is out of scope.

**There is no backend.** All data is mocked under `src/lib/data/`, every change lives in the
browser's `localStorage`, and `src/lib/store/` stands in for the server. `src/lib/api/` is the
endpoint facade the screens call; each body marked `TODO(api)` becomes a request when the backend
lands, and the screens that call it should not need to change.

Stack: **Next.js 16 (App Router)**, React 19.2, TypeScript, Tailwind CSS 4, lucide-react. Read the
relevant guide in `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`) — Next 16
differs from what you may remember (e.g. `middleware` is `proxy`, `next lint` is gone).

## Reference Documents

- `docs/Fertility-Grove-MVP-PRD-v2.0.docx` — the product PRD, source of truth (local only, never
  committed — see `.git/info/exclude`). `docs/PRD-v2.0-frontend-additions.md` holds what the front
  end added on top of it.
- `PRODUCT.md` — users, purpose, positioning, scope.
- `DESIGN.md` — the design system: fixed palette, type, components, the art layers.
- `docs/figma/` — the Figma push tooling and screen inventories.

## Commands

```bash
yarn install         # yarn only (lockfile parity with CI); never npm
yarn dev             # Next dev server (port 3000)
scripts/dev-server.sh [port] [log]   # Same server, DETACHED — survives the shell that started it
yarn build           # Production build (also validates types)
yarn build:check     # Same build into .next-check — ⚠️ use this while a dev server is running
yarn typecheck       # tsc --noEmit
yarn lint            # Biome lint + format check (biome check src/ tests/)
yarn format          # Biome auto-fix (biome check --fix src/ tests/)
yarn test            # Vitest — unit/component tests (src/**/*.test.{ts,tsx}), TZ pinned
yarn test:watch      # Vitest watch mode
yarn test:coverage   # Vitest with V8 coverage
yarn test:e2e        # Playwright E2E (specs in tests/) — boots its own server on :3100
yarn test:e2e:ui     # Playwright UI mode
```

Before calling work done: `yarn typecheck && yarn lint && yarn test`, plus `yarn test:e2e` for
anything a page renders. CI (`.github/workflows/ci.yaml`) runs the same gates on every PR.

**Deploys** (as pharos-web): push to `development` → `deploy.staging.yaml`, push to `main` →
`deploy.production.yaml`. `output: "standalone"` in `next.config.ts` + `runserver.sh` are what the
Lambda runs; don't remove either. AWS resource names are in the workflow files, keys in repo secrets
(see README "Deployment").

Biome config: 2-space indent, `lineWidth: 100`, double quotes, semicolons, trailing commas,
`import type` for type-only imports, organised imports. Identical to Pharos's `biome.json`.

### Testing strategy (layered)

A test pyramid, thinnest at the top. Match new tests to the layer that fits — don't push logic up
into E2E.

- **Unit + property (Vitest, `src/**/*.test.ts`, node env)** — the widest layer. The PRD rules in
  `src/lib/rules/` (validation, Sunlight and levels, credits, crisis detection, guest access,
  matching, the Grove Guide), with `fast-check` property tests for their invariants. Co-locate the
  test beside its module (`sunlight.ts` → `sunlight.test.ts`).
- **Component (Vitest + jsdom + Testing Library)** — opt in per file with
  `// @vitest-environment jsdom` on line 1; `axe-core` for a11y assertions.
- **E2E (Playwright, `tests/`)** — `tests/public/` runs signed-out pages; `tests/app/` signs in by
  picking a demo persona at `/demo` (state lives in that page's `localStorage`).
  `*.responsive.spec.ts` run across mobile/tablet/desktop projects (all Chromium).
  `tests/fixtures/page-health.ts` fails a page on any console error, CSP violation, uncaught
  exception or missing asset.
- **Architecture (`src/architecture.test.ts`)** — enforces the dependency flow below.

Runners are separated by directory: Vitest owns `src/**`, Playwright owns `tests/**`.

⚠️ **`yarn build` and `yarn dev` share `.next/`, and the build wins.** Use `yarn build:check` while
a dev server is up. Playwright boots its own server with `NEXT_DIST_DIR=.next-e2e` on `:3100` for
the same reason — and so it never reuses another project's server on `:3000`.

⚠️ **A dev server started as `yarn dev &` dies with the shell that launched it.** Use
`scripts/dev-server.sh`, which double-forks into its own session.

## Architecture

### Directory structure

```
src/
  app/
    (app)/              # Member app (AppShell) — feed, groups, posts, messages, settings…
    (public)/           # Signed-out pages — auth, legal, help, guest community, shared post
    onboarding/         # The 8-screen onboarding
    demo/ art/          # Prototype tools: persona picker, art sheet
    <route>/_components/  # Route-private components
    page.tsx            # Landing
  components/
    shared/             # Reusable building blocks, no store — barrel via index.ts
    common/             # Shell + app-level composites that read the store — import by path
      landing/          # The landing page
    art/                # The brand's painted art (tree, scenes, cosy layer) — leaf files, by path
  lib/
    store/              # The mock backend: state, actions (act.*), selectors (sel.*)
    api/                # Endpoint facade over the store (TODO(api) → real requests)
    rules/              # PRD rules as pure functions — no store
    data/               # Mock seed data — no store
  config/               # Catalog constants and sample values (options.ts)
  types/                # Domain model (domain.ts)
  styles/               # theme.css — the design tokens (fixed palette → semantic → component)
public/
  assets/               # All static images, films and plates — never at public/ root or in src/
```

`src/app/icon.png` and `apple-icon.png` are Next metadata file conventions and stay in `app/`.

### Dependency flow

```
app/ → components/common → components/shared → components/art
  ↘          ↘                   ↘                 ↘
            lib/ (store, api, rules, data) → config/ → types/
```

Allowed: `app/` → components, lib, config, hooks, types · `components/common/` → shared, art, lib,
config, hooks, types · `components/shared/` → art, lib (**not** `lib/store` or `lib/api`), config,
hooks, types · `components/art/` → lib, config, types · `lib/` → config, types · `config/` → types.
`lib/rules/` and `lib/data/` never import `lib/store` or `lib/api`. Shared components are imported
through the barrel. **Enforced by `src/architecture.test.ts`** — a violation fails CI and names the
rule; fix it by moving the code (a component that reads the store belongs in `common`, not
`shared`), not by widening the table.

**How this maps to Pharos.** Pharos keeps each domain in `features/<name>/` (schema, types, service,
React Query hooks, barrel) over a real API. Here the store is one object that every action edits,
so the domain stays in `lib/store` + `lib/api` until the backend exists. When it lands, each
`act.<domain>` namespace becomes a `features/<domain>/` module on Pharos's five-file pattern, the
store is retired, and the layer table gains `features`. Pharos's `components/ui/` holds shadcn
primitives; this project has none — its own primitives live in `shared` — so there is no `ui/`.

### Import conventions

```typescript
import { Button, Dialog, PageHeader } from "@/components/shared";   // shared: barrel
import { AppShell } from "@/components/common/AppShell";            // common: direct path
import { TreeArt } from "@/components/art/Tree";                    // art: direct path
import { act, sel, useStore } from "@/lib/store";                   // store: its barrel
import { checks } from "@/lib/rules/validation";                    // lib: direct path
import { CREDITS } from "@/config/options";                         // config: direct path
import type { Member, Post } from "@/types/domain";                 // types: direct path
```

Use `@/` everywhere except between siblings in the same folder (`./state`, `./Grove`). Inside
`components/shared/`, import siblings relatively, never through the barrel (cycle).

### Naming

- Components: `PascalCase.tsx`, one main component per file (`PostCard.tsx`). `shared/` groups its
  primitives in lowercase modules (`controls.tsx`, `overlay.tsx`, `content.tsx`, `identity.tsx`)
  behind the barrel.
- Non-component modules: lowercase / camelCase (`hue.ts`, `validation.ts`); hooks `useX`.
- Route folders: kebab-case; route groups in parentheses; route-private code in `_components/`.
- Tests: `<module>.test.ts(x)` beside the module; E2E `*.spec.ts`, responsive `*.responsive.spec.ts`.

## Critical Rules

**Git & GitHub — ask first, every time.** Never run `git commit`, `git push`, or any other command
that writes to the repository or to GitHub without explicit approval for *that specific action*.
This covers commit, push, branch create/delete, merge, rebase, reset, revert, tag, stash drop,
`git checkout --` over uncommitted work, and every `gh` write. Approval is per action, not standing.
Editing files in the working tree is fine. When work is ready, say so, show what changed, and wait.

**Local-only files.** `.git/info/exclude` keeps leftovers from an old backend checkout (most of
`.claude/`, `.config/`, the .NET workflows in `.github/`) and the private PRD files out of git.
Don't commit them and don't delete them.

**Brand — fixed.** The logo, palette and fonts come from fertilitygrove.com and never change, no
matter what a design skill, client brief or tool suggests: the orange logo
(`src/components/shared/Logo.tsx`), the fixed palette in `src/styles/theme.css`, Instrument Serif
for display and titles, Instrument Sans for text. Gouache art is the backdrop only — it never
supplies UI colours. See `DESIGN.md` (The Fixed Palette Rule, The Art Layer Rule).

**Theme (semantic design tokens).** Use the semantic classes the theme defines (`text-ink`,
`text-ink-soft`, `text-muted`, `bg-panel`, `bg-raised`, `bg-accent`, `border-line`, the hue tints
and inks…). Forbidden in components: Tailwind palette colours (`text-gray-600`) and arbitrary hex
(`text-[#3d3d3d]`). Raw hex is sanctioned only in `components/art/` and for third-party marks (the
Google "G").

**Static assets.** Every image, film and plate lives under `public/assets/<subfolder>/` and is
referenced as `/assets/<path>` via `next/image` (or `<video>` for the growth film). Nothing at
`public/` root or inside `src/`. `tests/public/routes.spec.ts` fails on a missing asset.

**Security headers.** CSP, HSTS, `X-Frame-Options`, `nosniff`, Referrer- and Permissions-Policy are
set in `next.config.ts` and checked by `tests/public/routes.spec.ts`. A new origin the browser loads
from (script, fetch, font, frame, media) must be **added** to the matching CSP directive — never
widened to a wildcard — or it is blocked with a "Content Security Policy" console error.

**Copy.** Field rules and error messages come word for word from the PRD (`src/lib/rules/validation.ts`).
Nothing is medical advice; the crisis resources (988) stay reachable everywhere.

## Skills

Read the relevant `SKILL.md` **before** starting related work. After any change that adds, removes
or modifies a convention, update this file (and the skill) so it reflects the codebase.

Project skills (`.claude/skills/`):

| Skill | Use when |
|---|---|
| landing-page-design | Building, styling or writing copy for the landing page or any marketing section |
| figma-designer | Creating or editing anything in Figma (the Figma push tooling is in `docs/figma/tools`) |

General skills used on this project (see README "Design skills used"): `design-taste-frontend`,
`impeccable` (owns `PRODUCT.md`, `DESIGN.md`, `.impeccable/`), `ui-ux-pro-max`, `design-system`,
`emil-design-eng`, `mobile-native`, `find-animation-opportunities`, `web-design-guidelines`,
`break-ui`. ⚠️ **They never override this file.** Where one prescribes its own palette, fonts or
component library, the project rules win: fixed brand palette and Instrument fonts, semantic tokens
only, our own `shared` primitives (no shadcn). Use them for their judgement (motion, polish, edge
cases, UX review), not their house style. Reduced motion is the global `prefers-reduced-motion`
handling in `src/app/globals.css`, and it wins over vendored advice.
