---
name: tailwind-audit
description: Audit Tailwind CSS 4.3 usage and colour/token compliance (incl. contrast) in a Next.js app for design-system compliance — Biome 2.6 Tailwind lint rules first, then palette classes, arbitrary hex/rgb/oklch, off-scale arbitrary values that have a scale form, forbidden font weights, v3 and deprecated v4.0 leftovers (start-/end-, safelist, hand-written scrollbar CSS), double focus outlines, and error red on actions that end something. Use for an audit or sweep across many files (or before a PR that touches classes), not for styling one component (that's `tailwind-css-patterns`).
allowed-tools: Read, Glob, Grep, Bash
---

# Tailwind Audit

Audit Tailwind CSS usage for consistency. Assumes Tailwind v4 with semantic tokens (any value format — hex by default) bridged via `@theme inline` in `src/styles/theme.css`. Conventions come from `tailwind-css-patterns`; colour depth is in `references/colour-deep-pass.md`.

Baseline (Nov 2026) — verify against package.json: `tailwindcss` 4.3, `cn` (tailwind-merge 3.7-compatible),
`tw-animate-css` 1.4, `@biomejs/biome` 2.6.

## When to run

- Before opening a PR that touches classes, `theme.css` or a primitive's styling.
- When reviewing styling across several files (one component's styling is `tailwind-css-patterns`;
  a full UI review is `ui-validate`).
- After a Tailwind / tailwind-merge / Biome upgrade, for the v3 / deprecated-v4 leftovers.
- With the colour deep pass whenever the question is colour, contrast or tokens.

## Step 0 — let Biome do the mechanical part

Biome 2.6 ships Tailwind-aware rules. Run them before the greps below and treat the greps as the
backstop for what the linter doesn't cover:

| Rule (Biome 2.6) | Catches |
|---|---|
| `nursery/noTailwindRawColors` | Tailwind palette colours (`text-gray-600`) — see `references/colour-deep-pass.md` |
| `nursery/useTailwindSortedClasses` (renamed from `useSortedClasses` in 2.6) | class order |
| `nursery/noTailwindRestyledComponents`, `nursery/useTailwindStaticClassStrings` | new in 2.6 — read each rule page before enabling; the second targets class strings Tailwind can't see statically |
| assist `noDuplicateClasses` (2.4) | duplicate classes inside `cn` / `clsx` / `cva` |
| `nursery/noUnusedClasses`, `nursery/noUndeclaredClasses` (2.5, cross-file) | class names with no matching rule, or rules nobody uses — check the rule pages for Tailwind coverage |

Nursery rules are opt-in and may change between minors — enable them explicitly and check the Biome
rule pages for their options (2.6 also adds a top-level `tailwind.stylesheet` setting pointing at the
CSS entry so the rules can read your design system). `biome.json` must set
`css.parser.tailwindDirectives: true` for `theme.css` to parse. Run
`biome check --reporter=concise src/` (the concise reporter is meant for agents).

## References (load on demand)

| File | Contains |
|---|---|
| `references/scale-and-syntax.md` | Authoring rule of thumb and the full scale tables (spacing ÷ 4, border width, the `--radius`-derived radius scale, font size, duration/delay, leading/tracking, opacity), the v3 → v4 syntax migrations (`!` suffix, `outline-none` vs `outline-hidden`, renamed shadow/blur/radius steps, `ring` width, gradients, `theme()`), deprecated v4.0–4.3 forms, and when an arbitrary value **is** right |
| `references/colour-deep-pass.md` | Biome `noTailwindRawColors` setup and limits, the approved token families and how to list the live ones, the forbidden → fix table, colour scans, the contrast test, the semantic mapping, 4.1–4.3 colour-taking utilities, translucent variants |
| `references/scans.md` | Every grep for the categories below, in one block |

**Authoring rule of thumb:** before writing `class-[N]`, divide the px value by 4 — if the result is
any number (`1.75`, `3.25`, `3.5` included), the scale class exists. Arbitrary is for values the scale
can't express, never for colour. Tailwind emits nothing for an unknown class, so confirm the rule
exists in the built CSS. Tables → `references/scale-and-syntax.md`.

## Audit categories (checklist)

Each line is one category; the matching scan is in `references/scans.md`.

- [ ] **1. Colour tokens** — semantic tokens only (`text-foreground`, `text-muted-foreground`,
  `bg-background`, `bg-card`, `bg-muted`, `bg-primary`, `border-border`, the project's `brand-*`
  family). Flag palette classes (`text-gray-600`, `text-red-500`), arbitrary literals
  (`text-[#242233]`, `[oklch(…)]`), inline colour styles, and `[var(--token)]` where a `@theme inline`
  alias exists (`text-[var(--brand-text)]` → `text-brand-text`). Full pass, fill-vs-text and contrast:
  `references/colour-deep-pass.md`. `theme.css` holds literals by design — never flag it.
- [ ] **2. Spacing / sizing** — scale classes over arbitrary px (`p-[16px]` → `p-4`,
  `min-h-[140px]` → `min-h-35`, `w-[200px]` → `w-50`). If page padding is owned by one wrapper (e.g.
  `components/common/PageContent.tsx`), flag pages that re-pad themselves.
- [ ] **3. Typography** — named sizes (`text-[14px]` → `text-sm`). Typical scale: page title
  `text-2xl font-semibold`, section heading `text-lg font-medium`, description
  `text-sm text-muted-foreground`, table header `text-xs font-medium uppercase`. ⚠️ **Only loaded
  weights:** check which weights `next/font` loads in `src/app/layout.tsx`. **Default — change if your
  project differs:** 400 / 500 / 600, so `font-semibold` is the ceiling and
  `font-bold`/`font-extrabold`/`font-black` render as a faux-bold smear — flag every class above the
  loaded ceiling (comments mentioning it are fine). `Instrument Sans` / `none (no mono face loaded)` are applied
  globally via `--font-sans` / `--font-mono`.
- [ ] **4. Borders & radius** — match the primitives (shadcn inputs/buttons are `rounded-md`); avoid
  `rounded-3xl` in app UI (marketing style); `rounded-[8px]` → `rounded-md`, `rounded-[10px]` →
  `rounded-lg`, `border-[1px]` → `border` (radius scale derives from `--radius`).
- [ ] **5. Responsive** — page markup mobile-first (base → `md:` → `lg:`), grids have a mobile column
  count; components that merge `className` via `cn()` write mobile values as `max-md:` / `max-sm:`,
  never a base + `md:` pair (tailwind-merge drops the base half on override and the `md:` half leaks
  to desktop — `responsive-patterns`); component layout in variable-width slots uses `@container` +
  `@xl:`, not viewport breakpoints; physical `left-*`/`right-*`/`pl-*`/`pr-*` on UI that should mirror
  in RTL → `inset-s-*`/`inset-e-*`/`ps-*`/`pe-*`.
- [ ] **5b. Focus and ending actions** — **no double outlines:** a control that draws a border shows
  focus by recolouring it (`focus-visible:border-ring focus-visible:ring-0`); flag
  `focus-visible:ring-*` on top of a border (guard `src/styles/no-double-outlines.test.ts`).
  **`end-action`, not error red,** for leave/remove/delete/revoke: flag `text-destructive` /
  `hover:bg-destructive/…` on such actions → `text-end-action hover:bg-end-action-tint` (guard
  `src/styles/destructive-actions.test.ts`; Default — change if your project differs).
- [ ] **6. v3 and deprecated v4 leftovers** — `!` prefix, `bg-opacity-*`, `bg-gradient-to-*`,
  `flex-shrink-0`, `start-*`/`end-*`, `safelist`, hand-written scrollbar / `tab-*` / `zoom-*`
  utilities, exit animations without `fill-mode-forwards` → `references/scale-and-syntax.md`.
- [ ] **7. Anti-patterns** — conflicting classes (`p-4 p-6`); redundant (`flex flex-row`);
  unnecessary `!important`; inline styles where Tailwind works; an arbitrary value when a scale class
  exists; `[var(--token)]` when a `@theme inline` alias exists.

## Output Format

```markdown
## Tailwind Audit Report

### Issues

**Critical — Token Violations**
1. `file.tsx:23` — `bg-[#3F303F]` → use `bg-primary`
2. `file.tsx:45` — `text-[var(--brand-text)]` → use `text-brand-text`

**Medium — Off-scale Arbitrary Values**
3. `file.tsx:67` — `min-h-[140px]` → use `min-h-35`
4. `file.tsx:88` — `p-[16px]` → use `p-4`
5. `file.tsx:91` — `rounded-[14px]` → use `rounded-xl`

**Low — Optimization**
6. `file.tsx:102` — Missing responsive breakpoint on grid
```
