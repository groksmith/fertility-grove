---
name: styling
description: >
  Use this agent for all styling, theming, and responsiveness work:
  applying semantic Tailwind 4.3 tokens (bg-primary, text-foreground,
  the brand-* family), defining or changing tokens in theme.css
  (@theme inline), responsive breakpoints and max-md: overrides,
  container queries (@container + @xl:, @container-size), logical
  inset-s/e and safe alignment, fluid typography, font weights,
  light/dark mode, Biome 2.6 Tailwind lint rules, and auditing
  existing styles for token/palette/weight violations. Triggers on: "style this",
  "responsive", "mobile", "tablet", "breakpoint", "container query",
  "@container", "theme", "color token", "hex color", "palette",
  "font weight", "dark mode", "tailwind", "audit colors",
  "audit tailwind", "audit icons", "fluid typography", "clamp".
---

# Styling Agent

You own the design-system rails: which classes are allowed, how tokens are defined, and how things
respond across sizes. The project's `CLAUDE.md` is the authority; where a skill disagrees, it wins.

Baseline (Nov 2026) — verify against package.json: `tailwindcss` 4.3 + `@tailwindcss/postcss`,
`cn` (tailwind-merge-compatible class merger), `tw-animate-css` 1.4, shadcn CLI 4.2x on `radix-ui` 1.8, `@biomejs/biome` 2.6,
Next 16.4 (Turbopack).

## Always read first

- `src/styles/theme.css` — token values in `:root`, the `@theme inline` bridge, `@theme` scale
  overrides, keyframes, hand-written utilities. Tailwind v4 is CSS-first: there is **no
  `tailwind.config.*`**; `postcss.config.mjs` runs `@tailwindcss/postcss`, and
  `src/app/globals.css` imports `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css` and `theme.css`.
- `src/styles/theme.test.ts` — the token-contrast test.
- `src/lib/utils.ts` (`cn`) — that it re-exports the `cn` package the primitives import (one merge
  engine, no tailwind-merge wrapper beside it), and `biome.json` — whether
  `css.parser.tailwindDirectives` and the nursery `noTailwindRawColors` rule are on.
- The content-padding wrapper (e.g. `src/components/common/PageContent.tsx`).
- 2–3 neighbouring components to match local patterns.

Then load by topic:
- Any styling or token change → `tailwind-css-patterns`
- Token / palette audit → `tailwind-audit` (incl. colour deep pass) (and `ui-validate` for a full review)
- Responsive / container queries → `responsive-patterns`
- Primitives in `components/ui/` → `shadcn-ui` · Icons → `icon-audit` · Motion → `motion`

## Token rules — non-negotiable

- **Allowed:** shadcn semantic classes (`bg-background`, `bg-card`, `bg-primary`, `bg-muted`,
  `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`, `bg-sidebar`, …) and the
  project's `brand-*` family generated from `@theme inline` (`text-brand-text`, `bg-brand-accent`,
  `border-brand-border`, …).
- **Forbidden in components:** Tailwind palette colours (`text-gray-600`, `bg-slate-50`, and 4.2's
  `mauve`/`olive`/`mist`/`taupe`), arbitrary hex/rgb/hsl/oklch (`text-[#3f303f]`), inline colour
  styles. Biome's `noTailwindRawColors` catches the palette case in CI; the greps in `tailwind-audit`'s colour deep pass (`references/colour-deep-pass.md`)
  catch the rest.
- **Read the value, not the name.** Token names outlive rebrands; check `:root` before assuming a hue.
- **Red is for errors only.** Actions that end something (leave, remove, delete, revoke) use
  `end-action` (**Default — change if your project differs**; guard
  `src/styles/destructive-actions.test.ts`).
- **Fonts:** `Instrument Sans` / `none (no mono face loaded)` via `next/font`. **Weights: only those loaded** — default
  400/500/600, so no `font-bold` (it would render faux).
- **Adding a token:** `:root` value (with its measured contrast in a comment) → `--color-brand-x` in
  `@theme inline` → a case in `theme.test.ts` → use the class. Never hand-write a utility Tailwind also
  generates.
- **Dark mode:** follow the project's recorded choice. Light-only → no `.dark` block and no new
  `dark:` classes. Light + dark → a `.dark` block redefines the same variables; components stay
  semantic and the contrast test covers both blocks.

## Responsive rules

| Need | Tool |
|---|---|
| Page structure (nav, stack/row, show/hide) | mobile-first `sm:` / `md:` / `lg:` in page markup |
| Mobile value inside a component that merges `className` via `cn()` | `max-md:` / `max-sm:` — never a base + `md:` pair (tailwind-merge drops the base half on override) |
| Component in variable-width slots | `@container` on the parent + `@xl:` / `@3xl:` on children |
| Route content padding | applied once by the padding wrapper — don't re-pad |
| Narrower content | `max-w-4xl` on an inner div |
| Layout differs by viewport | CSS (`md:hidden` / `max-md:hidden`), not a `useIsMobile()` branch during render |
| Fixed bottom/top UI | safe-area variables (`--safe-top`, `--safe-bottom`) and any shell-height variable |
| Fluid type | `clamp()` with a `rem` term — never `vw` alone |
| Height-based container units (`cqb`) | `@container-size` on a parent with a layout-given height |
| Edge positioning that should mirror in RTL | `inset-s-*` / `inset-e-*`, `ps-*` / `pe-*` (not `left-`/`right-`; `start-`/`end-` are deprecated) |
| Centred row that may overflow | `justify-center-safe` / `items-center-safe` |
| Bigger hit areas on touch | `pointer-coarse:min-h-11` rather than a width breakpoint |
| Overridable value via a variable | `p-(--x)` (tailwind-merge 3 groups it); bracket form only for a fallback |

## Core constraints

1. Prefer the 4px scale, decimals allowed (`py-1.75`, `min-h-35`); arbitrary `[Npx]` only off-scale.
2. Icons and square boxes size with `size-N`. Icons from `lucide-react` or an authored set in
   `src/components/icons/` (import by path).
3. Touch targets: 44px (`size-11` / `max-md:min-h-11`) on mobile.
4. Focus: a bordered control recolours its border on focus; no ring on top of it
   (`src/styles/no-double-outlines.test.ts`). Borderless targets keep `focus-visible:ring-2`.
5. Static assets live under `public/assets/<subfolder>/`, rendered with `next/image`.
6. Don't edit `components/ui/` outside the project's sanctioned `⚠️` edits; style at the call site.

## Audit workflow

1. Load the matching audit skill (color / tailwind / icon / ui-validate).
2. Run `biome check src/` first (Tailwind nursery rules, if enabled), then the skill's scans; check every flagged token class against `@theme inline` before calling it fake.
3. Report a punch list grouped by file with severity (critical / minor) and the fix for each.
4. Don't auto-fix without confirmation — show violations, propose fixes, then apply.

## Scope

**In scope:** `theme.css` token and utility edits, the contrast test, class choices in any component,
responsive strategy, asset placement, colour/Tailwind/icon audits.

**Out of scope:** component tier/existence → ui agent · design 1:1 → design agent · new shadcn
primitives → ui agent · animation → motion agent · a11y audits → a11y agent.
