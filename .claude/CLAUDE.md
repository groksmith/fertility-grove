# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Built on the **Next.js kit** (`claude-nextjs-kit`): its structure, skills, agents and guards, with this
project's facts and rules filled in. It follows the same conventions as `pharos-web` (tooling,
layering, naming, quality gates). Where this project differs from the kit or from Pharos, it is
because Fertility Grove is a different product, and the difference is spelled out here — **this file
wins** over the kit's defaults and over habits carried from Pharos. It loads every session, so it
holds rules only; the why and how live in the named skill (→ `skill`).

## Project Overview

**Fertility Grove** member web app — a clickable, **front-end-only prototype** of the Fertility Grove
MVP (PRD v2.0): a private community for people going through infertility and their partners. It
covers the member app only; the moderator and admin panel (PRD §19–20) is out of scope. Output is
`standalone`, deployed to AWS Lambda behind CloudFront.

**There is no backend.** `src/lib/mock-server/` stands in for it: its database (`db.ts`, persisted
to the browser's `localStorage`), seed data (`seed/`) and shared helpers. Each domain is a
`src/features/<name>/` module whose `service.ts` reads and writes the mock server; every method marked
`TODO(api)` becomes a request when the backend lands, and the screens that call it should not need to
change.

### Stack baseline (Nov 2026) — verify against package.json

| Area | Packages |
|---|---|
| Framework | `next` 16.4 (App Router, Turbopack for dev and build), `react` / `react-dom` 19.3 |
| Language, lint | `typescript` 7.0 (`tsc --noEmit`, `strict` + `noUncheckedIndexedAccess`), `@biomejs/biome` 2.6 |
| Styling | `tailwindcss` 4.3 + `@tailwindcss/postcss` |
| UI | Own primitives in `components/ui` (**no shadcn**), `lucide-react` 1.x |
| Data and forms | Feature services over the mock server (no TanStack Query or sonner yet), `react-hook-form` 7.92 + `@hookform/resolvers` 7 + `zod` 4.6 |
| Tests | `vitest` 5 (+ `vite` 8, `jsdom` 29, Testing Library, fast-check, axe-core), `@playwright/test` 1.65 |
| Runtime | Node 22 in dev and CI (22.13 locally — hence `jsdom` 29, not 30) |

Next 16 request APIs are async (`await cookies()` / `headers()` / `params` / `searchParams`); use the
`next typegen` helpers (`PageProps<"/route">`, `LayoutProps`, `RouteContext`). Read the relevant guide
in `node_modules/next/dist/docs/` before writing Next code (see `AGENTS.md`) — Next 16 differs from
what you may remember (`middleware` is `proxy`, `next lint` is gone). Leave the `AGENTS.md` block
`next dev` writes in place. TS 7 tsconfig rules, configs → `toolchain`.

## Reference Documents

- `docs/Fertility-Grove-MVP-PRD-v2.0.docx` — the product PRD, **source of truth** (local only, never
  committed — see `.git/info/exclude`). `docs/PRD-v2.0-frontend-additions.md` holds what the front
  end added on top of it.
- `PRODUCT.md` — users, purpose, positioning, scope.
- `DESIGN.md` — the design system: fixed palette, type, components, the art layers.
- `docs/figma/` — the Figma push tooling and screen inventories.

Order of authority: **PRD → product-owner answers → code.**

**Working documents, one per audience** (rules → `handoff-docs`; guarded by `src/docs-rules.test.ts`,
each check skipped while its file does not exist): `docs/fe-tasks.md` (for us, temporary — delete each
task when done, the file when empty) · `docs/po-questions.md` (for the PO, plain words; no ids, `§`
references, codes or endpoints) · `docs/backend-tasks.md` (`B<n>` backend / `O<n>` ops asks).

## Commands

```bash
yarn install         # yarn only (lockfile parity with CI); never npm
yarn dev             # Next dev server (port 3000)
scripts/dev-server.sh [port] [log]   # Same server, DETACHED — survives the shell that started it
yarn build           # Production build (also validates types)
yarn build:check     # Same build into .next-check — ⚠️ use this while a dev server is running
yarn typecheck       # tsc --noEmit
yarn lint            # biome check .  — src, tests, root configs (docs/ and scripts/ excluded)
yarn lint:ci         # biome ci .
yarn format          # biome check --write .
yarn analyze         # next analyze — Turbopack bundle analyzer
yarn test            # Vitest — unit/property/component/guard tests (src/**/*.test.{ts,tsx}), TZ pinned in vitest.config.mts
yarn test:watch      # Vitest watch mode
yarn test:coverage   # Vitest with V8 coverage
yarn test:e2e        # Playwright E2E (specs in tests/) — boots its own server on :3100
yarn test:e2e:ui     # Playwright UI mode
```

- Before calling work done: `yarn typecheck && yarn lint && yarn test`, plus `yarn test:e2e` for
  anything a page renders. CI (`.github/workflows/ci.yaml`) runs the same gates on every PR and on
  pushes to `development` / `main`. Check results by **exit code**, never by the tail of the output.
- Biome: 2-space indent, `lineWidth: 100`, double quotes, semicolons, trailing commas, `import type`
  for type-only imports, organised imports, `noTailwindRawColors`. **Project deviations from the kit:**
  `noNonNullAssertion` and `noArrayIndexKey` are off (as in Pharos). A suppression goes on the line
  **above the element** (Biome 2 ignores one placed between JSX attributes), one rule per comment,
  with the reason.
- ⚠️ **`yarn build` and `yarn dev` share `.next/`, and the build wins.** Use `yarn build:check` while
  a dev server is up. Playwright boots its own server with `NEXT_DIST_DIR=.next-e2e` on `:3100` for
  the same reason — and so it never reuses another project's server on `:3000`.
- ⚠️ **A dev server started as `yarn dev &` dies with the shell that launched it.** Use
  `scripts/dev-server.sh`, which double-forks into its own session → `toolchain`.

### Testing strategy (layered)

A test pyramid, thinnest at the top. Match new tests to the layer that fits — don't push logic up
into E2E (→ `toolchain`, `playwright-testing`).

- **Unit + property (Vitest, `src/**/*.test.ts`, node env)** — the widest layer. The PRD rules in
  `src/lib/rules/` (validation, Sunlight and levels, credits, crisis detection, guest access,
  matching, the Grove Guide), with `fast-check` property tests for their invariants, and each
  feature's `schema.test.ts` (same PRD messages, in the same order). Co-locate the
  test beside its module (`sunlight.ts` → `sunlight.test.ts`). Import `describe` / `it` / `expect`
  from `"vitest"` (`globals: false`).
- **Component (Vitest + jsdom + Testing Library)** — opt in per file with
  `// @vitest-environment jsdom` on line 1; `axe-core` for a11y assertions. `vitest.setup.ts`
  registers Testing Library's cleanup.
- **E2E (Playwright, `tests/`)** — `tests/public/` runs signed-out pages; `tests/app/` signs in by
  picking a demo persona at `/demo` (state lives in that page's `localStorage`).
  `*.responsive.spec.ts` run across mobile/tablet/desktop projects (all Chromium).
  `tests/fixtures/page-health.ts` fails a page on any console error, CSP violation, uncaught
  exception or missing asset.
- **Guards (Vitest, scan the source)** — `src/architecture.test.ts` (dependency flow below),
  `src/styles/theme.test.ts` (WCAG AA contrast of token pairs, no utility shadowing),
  `src/components/shared/FormField.test.tsx` (label/hint/error wiring, axe),
  `src/docs-rules.test.ts` (working documents). Never silence a guard by widening it.

Runners are separated by directory: Vitest owns `src/**`, Playwright owns `tests/**`.

## Deployment

Push to `development` → `.github/workflows/deploy.staging.yaml`; push to `main` →
`deploy.production.yaml` (its trigger still reads `master` — fix before relying on it). Each deploy
writes `.env` from a secret, builds the `standalone` output, copies `runserver.sh` and `public/` into
it, zips it for AWS Lambda, syncs `.next/static` and `public/assets` to S3 behind CloudFront and
invalidates the cache. **A push to a deploy branch is a release.** `output: "standalone"` in
`next.config.ts`, `runserver.sh` and the `public/` copy (the image optimizer reads source files from
the Lambda's own `public/`) are what the Lambda runs; don't remove any of them. Names and secrets:
README "Deployment" → `toolchain`, `perf`.

## Backend API Conventions

**None yet** — the prototype has no backend. When one lands, fill this in from its API guide and adopt
the kit's defaults (→ `http`, `auth`, `tanstack`, `forms`): `httpClient` / `serverHttpClient` under
`/api/v1`, RFC 7807 ProblemDetails mapped once at the HTTP layer, bearer + refresh tokens with one
refresh in flight, `requireSession()` as the gate. Until then those skills are reference only.

## Architecture

```
src/
  app/
    (dashboard)/        # Member app (AppShell) — feed, groups, posts, messages, settings…
    (public)/           # Signed-out pages — auth, legal, help, guest community, shared post
    onboarding/         # The 8-screen onboarding
    demo/ art/          # Prototype tools: persona picker, art sheet
    <route>/_components/  # Route-private components
    page.tsx            # Landing
  features/<name>/      # Domain modules: auth, onboarding, groups, posts, stories, social, mentors,
                        # messages, notifications, guide, credits, partner, family, settings, learn,
                        # demo, search, support
  components/
    ui/                 # The app's own primitives (button, field, input, dialog…) — import by path
    shared/             # Reusable composites + FormField, no domain state — barrel via index.ts
    common/             # Shell + app-level composites that use features / the store — by path
      landing/          # The landing page
    icons/              # Authored marks (the logo) — leaf files, by path
    art/                # The brand's painted art (tree, scenes, cosy layer) — leaf files, by path
  hooks/                # Cross-cutting React hooks (useCopy, useMounted) — no domain
  lib/
    mock-server/        # The backend stand-in: db.ts (state + useStore), seed/, helpers.ts
    rules/              # PRD rules as pure functions — never the mock server's state
    format.ts  hue.ts  navigation-guard.ts   # domain-agnostic helpers
  config/               # Catalog constants and sample values (options.ts)
  types/                # Domain model (domain.ts), shared until the API spec lands
  styles/               # theme.css — the design tokens (fixed palette → semantic → component)
public/
  assets/               # All static images, films and plates — never at public/ root or in src/
```

`src/app/icon.png` and `apple-icon.png` are Next metadata file conventions and stay in `app/`.

**Dependency flow:** `app/ → features/ → lib/ → config/ → types/`, with `components/` below app:
`app` → features, all components, lib, config, hooks, types · `components/common` → features, ui,
shared, icons, art, lib, config, hooks, types · `components/shared` → ui, icons, art, lib, config,
hooks, types (**no features, no mock-server state**) · `components/ui` → lib, hooks, types ·
`components/icons` → lib · `components/art` → lib, config, types · `hooks` → lib, config, types ·
`features` → lib, config, types · `lib` → config, types. No cross-feature imports (`auth` — identity
and session — excepted); import a feature through its barrel, except the server-safe leaves
(`server.ts`) that server layouts use. `lib/rules` never reads the mock server's state (its `seed/`
is static data). **Enforced by `src/architecture.test.ts`** — fix a failure by moving code, never by
widening the table (→ `architecture-review`).

**Feature module** (→ `scaffold`; deviations from the kit's five files are deliberate while there is
no backend):

```
src/features/<name>/
  schema.ts     # Zod 4 form schemas (messages from @/lib/rules/validation, word for word) + z.input types
  types.ts      # the shapes it returns — re-exports its part of @/types/domain
  service.ts    # export const <name>Service = { … } over the mock server (TODO(api) → httpClient)
  selectors.ts  # pure derived views of the state (feed, unread counts, matches…)
  server.ts     # optional: server-safe reads for server layouts (generateMetadata)
  index.ts      # barrel — named re-exports
```

No `hooks.ts` yet: screens read state with `useStore` from `@/lib/mock-server`, the stand-in for
TanStack Query's cache. When the backend lands, each service body becomes an `httpClient` call, a
`hooks.ts` (TanStack Query) replaces `useStore` + selectors, `lib/mock-server` is deleted and nothing
outside `features/` changes. No `actions.ts`, no Server Actions: mutations go screen → service.

**Import conventions:**

```typescript
import { postService, feed, createPostSchema } from "@/features/posts";  // features: barrel
import { FormField, PageHeader } from "@/components/shared";             // shared: barrel
import { Button } from "@/components/ui/button";                         // ui: direct path
import { AppShell } from "@/components/common/AppShell";                 // common: direct path
import { Logo } from "@/components/icons/Logo";                          // icons: direct path
import { TreeArt } from "@/components/art/Tree";                         // art: direct path
import { useStore, type State } from "@/lib/mock-server";                // mock server: barrel
import { checks } from "@/lib/rules/validation";                         // lib: direct path
import type { Member } from "@/types/domain";                            // types: direct path
```

Use `@/` everywhere except between siblings in the same folder. Inside `components/shared/`, import
siblings relatively, never through the barrel (cycle).

**Naming:** components `PascalCase.tsx`, one component family per file in `shared/` (`Avatar.tsx`,
`PostChips.tsx`); `ui/` primitives are kebab-case like shadcn's (`button.tsx`, `dropdown-menu.tsx`).
Non-component modules lowercase / camelCase; hooks `useX`. Route folders kebab-case; route groups in
parentheses; route-private code in `_components/`. Services `<name>Service`. Tests
`<module>.test.ts(x)` beside the module; E2E `*.spec.ts`, responsive `*.responsive.spec.ts`.

**Key patterns** (one line each; detail in the skill):

- **Forms:** `useForm({ resolver: zodResolver(schema), defaultValues })` + `<FormField>` (the app's
  own `Field` around Input / PasswordInput / Textarea / Select) or `Controller` for custom controls;
  messages from `MSG` / `checks` via `superRefine`; service errors → `setError(field | "root")`.
  Errors appear on submit and stay until the next one (`reValidateMode: "onSubmit"`), focus doesn't
  jump (`shouldFocusError: false`) unless the screen focuses an error summary → `forms`.
- **Unsaved changes:** `useUnsavedGuard` (shared) + `lib/navigation-guard.ts` (`requestLeave`).
- **Indexed access:** `noUncheckedIndexedAccess` is on — guard the lookup (`arr[i] ?? fallback`,
  `if (!x) return`) or type a fixed list as a non-empty tuple (`[T, ...T[]]`, `as const`); no `!`
  to silence it in new code.
- **Pages:** `"use client"` screens reading the store after hydration (`useHydrated`).
- **React 19:** `ref` is a prop — the ui primitives take it directly, no `forwardRef`.
- **Responsive:** mobile overrides as `max-md:` where a base + `md:` pair would fight; container
  queries for components → `responsive-patterns`, `tailwind-css-patterns`.

## Critical Rules

**Git & GitHub — ask first, every time.** Never run `git commit`, `git push`, or any other command
that writes to the repository or to GitHub without explicit approval for *that specific action*.
This covers commit, push, branch create/delete, merge, rebase, reset, revert, tag, stash drop,
`git checkout --` over uncommitted work, and every `gh` write. Approval is **per action, not
standing** ("commit this" is one commit, not the push or the next commit); if a branch deploys on
push, a push is a release. Editing files in the working tree is fine. When work is ready, say so,
show what changed, and wait. Unknown uncommitted changes may belong to a parallel session: keep them
out of your commits.

**Local-only files.** `.git/info/exclude` keeps leftovers from an old backend checkout and the
private PRD files out of git. Don't commit them and don't delete them.

**Brand — fixed.** The logo, palette and fonts come from fertilitygrove.com and never change, no
matter what a design skill, client brief or tool suggests: the orange logo
(`src/components/shared/Logo.tsx`), the fixed palette in `src/styles/theme.css`, Instrument Serif
for display and titles, Instrument Sans for text. Gouache art is the backdrop only — it never
supplies UI colours. See `DESIGN.md` (The Fixed Palette Rule, The Art Layer Rule).

**Theme (semantic design tokens).** Use the semantic classes the theme defines (`text-ink`,
`text-ink-soft`, `text-muted`, `bg-panel`, `bg-raised`, `bg-accent`, `border-line`, the hue tints
and inks…). Forbidden in components: Tailwind palette colours (`text-gray-600`; Biome
`noTailwindRawColors`) and arbitrary hex (`text-[#3d3d3d]`). Raw hex is sanctioned only in
`components/art/` and for third-party marks (the Google "G"). Text tokens must clear 4.5:1
(`src/styles/theme.test.ts`). ⚠️ Known gaps the fixed palette can't close in code: coral ink on coral
tint (4.12:1) and pink ink on pink tint (3.71:1) — a design decision, recorded in the guard.
→ `tailwind-css-patterns`, `tailwind-audit`.

**Decisions to record:**
- **Colour scheme:** light only — no `dark:` classes in components; `theme.test.ts` checks `:root`.
- **Reduced motion:** the global `prefers-reduced-motion` handling in `src/app/globals.css`; it wins
  over vendored advice → `motion`.
- **Caching:** Cache Components **off** (kit default is on): every screen is a client component over
  `localStorage`, and turning it on would need new `<Suspense>` boundaries in the member layout.
  Revisit when the backend lands → `perf`.
- **React:** 19.3 APIs (`<Activity>`, `useEffectEvent`, `<ViewTransition>`, `ref` as a prop — no
  `forwardRef` in new code). React Compiler off; no new `useMemo` / `useCallback` / `React.memo`
  without a profile → `component-design`, `perf`.

**UI rules.** The kit's primitive guards (no double outlines, end-action colour, dialog corner ✕, one
pop-up at a time) target shadcn primitives and are **not adopted** — this project's own
`components/ui` primitives are the standard; follow their existing behaviour rather than the kit's
shadcn recipes.

**Icons:** lucide-react (decorative by default; a standalone icon gets `aria-label`). Allowed inline
`<svg>`: `components/art/Tree.tsx`, `components/common/AuthFrame.tsx` (the Google "G"),
`components/common/AppShell.tsx`, `components/common/landing/Landing.tsx`; plain `<img>`: none
→ `icon-audit`.

**Security headers.** CSP, HSTS, `X-Frame-Options`, `nosniff`, Referrer- and Permissions-Policy are
set in `next.config.ts` and checked by `tests/public/routes.spec.ts`. A new origin the browser loads
from (script, fetch, font, frame, media) must be **added** to the matching CSP directive — never
widened to a wildcard — or it is blocked with a "Content Security Policy" console error.

**Static assets.** Every image, film and plate lives under `public/assets/<subfolder>/` and is
referenced as `/assets/<path>` via `next/image` (or `<video>` for the growth film). Nothing at
`public/` root or inside `src/`. `tests/public/routes.spec.ts` fails on a missing asset.

**Copy.** Field rules and error messages come word for word from the PRD (`src/lib/rules/validation.ts`).
Nothing is medical advice; the crisis resources (988) stay reachable everywhere.

**Performance:** measure before optimizing — `yarn analyze`, Lighthouse on a production build → `perf`.

## Skills

Read the relevant `SKILL.md` **before** starting related work. After any change that adds, removes
or modifies a convention, update this file (and the skill) so it reflects the codebase.

Project skills (`.claude/skills/`) — this project's own:

| Skill | Use when |
|---|---|
| landing-page-design | Building, styling or writing copy for the landing page or any marketing section |
| figma-designer | Creating or editing anything in Figma (the Figma push tooling is in `docs/figma/tools`) |

From the kit (`.claude/skills/`):

| Skill | Use when | Skill | Use when |
|---|---|---|---|
| a11y | ARIA, keyboard, focus, screen-reader UX, contrast, WCAG 2.2 AA | playwright-testing | E2E, responsive specs, fixtures, flakes |
| architecture-review | Auditing dependency flow and pattern compliance | refactor | Minimal-change refactors that respect the architecture |
| component-design | Tier placement, design-system usage, React 19.3 idioms for a new component | responsive-patterns | `max-md:` overrides, container queries, fluid type, intrinsic layouts |
| handoff-docs | FE task list, PO questions, backend/ops asks | seo | Metadata, sitemap/robots, OpenGraph, JSON-LD, canonical, no-index |
| icon-audit | Icons, images, alt text, asset placement | tailwind-audit | Auditing Tailwind and colour/token compliance (incl. contrast) |
| implement-design | Figma → production code (needs the Figma MCP server) | tailwind-css-patterns | Writing Tailwind v4 here: tokens, scales, variants |
| motion | Transitions, View Transitions, scroll-driven motion, reduced motion | toolchain | Next 16 / TS 7 / Biome / Vitest 5 setup, configs, dev server, test layers, deploy notes |
| observability | Error boundaries, logger, error reporting, retry, error UX | ui-validate | Reviewing UI against the design-system, dialog, responsive and a11y rules |
| perf | Measurement, Cache Components, React Compiler, bundles, images, cold start |  |  |

**Partly dormant until the backend lands:** `scaffold` and `forms` apply (feature modules, RHF + Zod +
FormField) except their TanStack/httpClient parts; `auth`, `http` and `tanstack` are reference only;
`shadcn-ui` doesn't apply (own primitives in `components/ui`).

Third-party skills (vendored by the kit — sources and licences in the kit's `README.md`):

| Skill | Use when | Skill | Use when |
|---|---|---|---|
| animate | Building an animation from scratch | improve-animations | Read-only motion audit and fix plan |
| animation-performance | Janky animations; composite-only properties | mobile-native | Making a web app feel native on a phone |
| apple-design | Gestures, springs, materials, Apple-style foundations | prototype | Divergent UI versions behind a picker (explicit only) |
| ask-sonner | Sonner toasts (not used here yet) | react-best-practices | React/Next.js performance guidelines |
| break-ui | Stress-testing UI with worst-case data | review-animations | Strict motion review (explicit only) |
| composition-patterns | Compound components over boolean props | web-design-guidelines | Review against the Web Interface Guidelines |
| emil-design-eng | UI polish and details | frontend-design | Aesthetic direction for non-templated UI |

Also used on this project (installed globally, see README "Design skills used"): `design-taste-frontend`,
`impeccable` (owns `PRODUCT.md`, `DESIGN.md`, `.impeccable/`), `ui-ux-pro-max`, `design-system`,
`find-animation-opportunities`.

⚠️ **Skills never override this file.** Where one prescribes its own palette, fonts, component
library, shadcn edits or an `end-action` colour, the project rules win: fixed brand palette and
Instrument fonts, semantic tokens only, our own `components/ui` primitives (no shadcn). Use them for their
judgement (motion, polish, edge cases, UX review), not their house style.

Project agents (`.claude/agents/`, from the kit) — spawn via the Agent tool for deep or parallel work.
The same project rules bind them; `auth`, `data` and `http` are dormant until the backend:

| Agent | Domain | Agent | Domain |
|---|---|---|---|
| a11y | ARIA, keyboard, focus, screen-reader UX, WCAG audits | http | Client choice, services, errors, uploads |
| auth | Login, tokens, sessions, refresh, protected routes, 2FA | motion | Transitions, View Transitions, reduced motion |
| data | TanStack Query hooks, tables, pagination, filters | observability | Error boundaries, logger, error reporting, retry |
| design | Figma → code, design direction, visual fidelity | perf | Bundles, RSC boundaries, Web Vitals, cold start |
| feature | Scaffolding modules, refactoring, architecture | seo | Metadata, sitemap/robots, OpenGraph, JSON-LD |
| forms | Forms, multi-step, validation | styling | Tailwind, tokens, responsive, audits |
| testing | Playwright E2E, responsive tests, fixtures | ui | Components, tiers, primitives, dialogs and menus |
