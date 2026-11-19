---
name: tailwind-css-patterns
description: How to write Tailwind CSS 4.3 in a Next.js 16 App Router app — the CSS-first theme in src/styles/theme.css (token values bridged through @theme inline), semantic + brand-* colour tokens, the end-action vs error-red rule, fonts via next/font at an explicit weight scale, spacing/radius/shadow scales, mobile-first vs max-md overrides under tailwind-merge 3, container queries (incl. @container-size), state and focus variants, logical inset-s/e and safe alignment, light-only vs dark mode, and v3→v4 syntax. It owns the colour and focus rules for any control (end-action not red for ending actions, no double outlines, visible focus). Use when styling or restyling a component, button or page, when a control has the wrong colour or focus ring, or when adding/changing a design token; for a sweep across many files use `tailwind-audit`.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Tailwind CSS Patterns

The project's `CLAUDE.md` wins over anything here; `src/styles/theme.css` is the source of truth for
every token. Audits: `tailwind-audit` (incl. colour), `ui-validate`. Responsive depth:
`responsive-patterns`. Motion depth: `motion`. Accessibility/contrast: `a11y`.

Baseline (Nov 2026) — verify against package.json: `tailwindcss` 4.3 + `@tailwindcss/postcss`,
`cn` (shadcn's class merger, tailwind-merge-compatible), `tw-animate-css` 1.4, shadcn CLI 4 on `radix-ui` 1.8, `class-variance-authority`,
`@biomejs/biome` 2.6, Next 16.4 (Turbopack). Tailwind 4.1–4.3 announced no breaking changes; the only
deprecation is `start-*`/`end-*` → `inset-s-*`/`inset-e-*` (§9).

## 1. Setup — CSS-first, no config file

- **There is no `tailwind.config.*`.** PostCSS runs `@tailwindcss/postcss` (`postcss.config.mjs`) —
  this works under Turbopack, Next 16's default bundler. `create-next-app --tailwind` 16.4 instead
  scaffolds `@tailwindcss/turbopack` (a `turbopack.rules["*.css"]` loader in `next.config.ts`, no
  postcss config). Pick one: keep that rule when you merge the kit's `next.config.ts`, or (kit
  default) switch to `@tailwindcss/postcss` + `postcss.config.mjs` and remove the loader and the
  package — never neither, or Tailwind goes unprocessed. v4 detects sources itself, so there is no
  `content` / purge / `jit`. Classes built at runtime (never visible as whole strings in source) are
  listed with **`@source inline("…")`** (4.1, supports brace expansion — the v3 `safelist`
  replacement); exclude a path with `@source not "<path>"`.
- `src/app/globals.css`:
  ```css
  @import "tailwindcss";
  @import "tw-animate-css";
  @import "shadcn/tailwind.css"; /* data-open/-closed/-checked variants the preset primitives use */
  @import "../styles/theme.css";
  ```
  plus the global `prefers-reduced-motion` block (see `motion`); base rules live in `theme.css`.
  Kit `templates/src/app/globals.css`. `shadcn/tailwind.css` comes from the `shadcn` package — keep
  it in `dependencies`.
- `src/styles/theme.css`, in this order:
  1. `@custom-variant dark (&:is(.dark *));` (only if you support dark mode — §8)
  2. `:root { … }` — the raw token **values** (hex is the default; `oklch()`/`hsl()` work the same way)
  3. `@theme inline { … }` — bridges each `--x` to a `--color-x` so Tailwind generates `bg-x`, `text-x`, …
  4. a plain `@theme { … }` — scale overrides (tracking, leading, breakpoints if any)
  5. `@keyframes` and `@utility` / `@layer utilities` for hand-written utilities
  6. `@layer base` (heading font, body line-height)
- shadcn: `components.json`; variants via `cva`. **`cn`**: CLI 4.2x installs the `cn` package and
  every primitive imports `cn` from "cn"; `src/lib/utils.ts` just re-exports it so app code uses
  the same engine (kit `templates/src/lib/utils.ts`). Don't put a tailwind-merge
  `extendTailwindMerge` wrapper beside it — two engines would ship.
- **Registering tokens is rarely needed.** Plain colour names already merge as colours:
  `cn("text-foreground", "text-brand-text")` → `text-brand-text`, and `text-sm` + `text-brand-text`
  keep both. Register only a token whose name could be misread as another group (a colour named
  `brand-lg`, a size-like suffix) — with `createCn` from `cn/config` (same `{ extend, override }`
  shape as tailwind-merge: v4 keys `color`, `text`, `radius`, …), and then point the primitives at it.
- **Biome 2.6** lints `theme.css` only with `css.parser.tailwindDirectives: true` (otherwise `@theme`,
  `@utility`, `@custom-variant` are parse errors). Its nursery `noTailwindRawColors` backs §2 — see
  `tailwind-audit` (`references/colour-deep-pass.md`).
- **Default — change if your project differs:** no `@apply` and no `theme()` in `src/`. In CSS, read a
  token as `var(--brand-…)`; in markup, use the generated utility. `shadcn init` writes an
  `@layer base { * { @apply border-border outline-ring/50 } body { @apply bg-background … } }`:
  when you move tokens into `theme.css`, rewrite it with `var()` (`border-color: var(--border)`,
  `outline-color: color-mix(in srgb, var(--ring) 50%, transparent)`, …).

```css
/* theme.css — shape (full starter: kit templates/src/styles/theme.css). The brand-* and end-action
   names are the ones theme.test.ts and the sanctioned primitive edits expect. */
:root {
  --background: #ffffff;
  --foreground: #14202e;
  --primary: #0b6e69;            /* white text on it clears 4.5:1 */
  --primary-foreground: #ffffff;
  --muted: #f1f4f7;
  --muted-foreground: #4f5f71;
  --destructive: #b42318;        /* errors only */
  --end-action: #6b1d4a;         /* delete / remove / revoke / leave */
  --end-action-hover: #561539;
  --end-action-tint: #f6ecf1;
  --brand-text: #14202e;
  --brand-accent: #0b6e69;       /* a fill */
  --brand-accent-text: #0a5f5a;  /* the same hue as small text (4.5:1) */
  --brand-border: #d6dde4;
  --radius: 0.625rem;
  /* …the rest of the shadcn set: card, popover, secondary, accent, border, input, ring */
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* one --color-x: var(--x) per token above */
  --color-end-action: var(--end-action);
  --color-end-action-hover: var(--end-action-hover);
  --color-end-action-tint: var(--end-action-tint);
  --color-brand-accent-text: var(--brand-accent-text);
  --font-sans: var(--font-app-sans);
  --font-mono: var(--font-app-mono);
  --radius-lg: var(--radius);
}
```

Why `inline`: the utility then references the variable itself, so a value changed under a selector
(`.dark`, `[data-theme]`) flows through without regenerating CSS.

## 2. Colour

Semantic classes only. **Forbidden in components:** Tailwind palette colours (`text-gray-600`,
`bg-blue-500`), arbitrary hex (`text-[#3f303f]`), raw `rgb()`/`hsl()`/`oklch()`, inline colour styles.
A colour without a token gets a token — never a literal.

Two families, both legitimate:

- **shadcn semantic:** `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`,
  `accent`, `destructive` (each with `-foreground`), `border`, `input`, `ring`, `chart-1…5`, `sidebar-*`.
- **`brand-*`:** the project's own names for what shadcn doesn't cover (`text-brand-text`,
  `text-brand-text-muted`, `bg-brand-accent`, `border-brand-border`, status/notice/warning sets).

| Job | Class |
|---|---|
| Page / card / popover surface | `bg-background` · `bg-card` · `bg-popover` |
| Body / muted text | `text-foreground` · `text-muted-foreground` (or the `brand-*` equivalents) |
| Borders | `border-border` · `border-brand-border` |
| Primary CTA | `bg-primary text-primary-foreground` |
| **Action that ends something** (delete, remove, revoke, leave) | `text-end-action hover:bg-end-action-tint` or `<Button variant="destructive">` styled with `end-action` |
| **Errors only** | `text-destructive`, `border-destructive`, `aria-invalid:border-destructive` |
| Warning / notice | `brand-warning-*`, `brand-notice-*` (fill vs small-text variants) |

**Default — change if your project differs:** red (`destructive`) means *something went wrong*;
an action the user chooses that ends something uses a separate `end-action` hue, so error copy and a
"Remove" button never look alike. Guarded by `src/styles/destructive-actions.test.ts`. If your project
prefers red for both, delete the `end-action` token and the guard together.

- **Opacity:** slash modifier (`bg-primary/10`). `bg-opacity-*` is v3. Hand-written tints in CSS:
  `color-mix(in srgb, var(--token) N%, transparent)`.
- `white`/`black`: only as washes on dark surfaces (`hover:bg-white/10`) — prefer a `*-foreground` token.
- **A colour that's a fill is not automatically a text colour.** A brand accent that passes 3:1 as a
  button fill may fail 4.5:1 as small text; give it a separate `-text` token (e.g. `brand-accent-text`).
- **Adding a token:** value in `:root` (with its measured contrast in a comment) → bridge
  `--color-brand-x: var(--brand-x)` in `@theme inline` → use `bg-brand-x`. Never hand-write a utility
  Tailwind also generates (a duplicate in `@layer utilities` sits later and silently beats `md:` overrides).

### Token-contrast test

Keep a Vitest test, `src/styles/theme.test.ts`, that parses `theme.css`, reads the `:root` values and
asserts WCAG ratios for every text/background pair you rely on (4.5:1 body text, 3:1 large text and UI
boundaries/focus). It also asserts no hand-written utility duplicates a generated one. jsdom can't
compute contrast, so this test is how contrast is enforced. When you add or change a text/surface
pair, add a case.

```ts
// CONTRAST_PAIRS in theme.test.ts — token names WITHOUT the leading `--`; a literal "#ffffff" works too
const CONTRAST_PAIRS: [fg: string, bg: string, min: number][] = [
  ["foreground", "background", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["end-action", "end-action-tint", 4.5],
  ["ring", "background", 3],
];
```

## 3. Typography

- Fonts via `next/font` in the root layout (`next/font/google` or `next/font/local` for self-hosted
  files under `src/app/fonts/`), exposed as CSS variables and bridged: `--font-sans` → `Instrument Sans`,
  `--font-mono` → `none (no mono face loaded)`. A separate `--font-heading` is optional.
- **Load only the weights you use, and declare the scale.** **Default — change if your project differs:
  400 / 500 / 600** → `font-normal` / `font-medium` / `font-semibold`. A weight with no loaded face is
  synthesised by the browser (faux bold, smeared). So `font-bold`/`font-extrabold`/`font-black` are
  forbidden unless a 700+ face is loaded; hierarchy above the ceiling comes from size and colour.
  Don't pick a display font that ships one weight for UI headings that need `font-semibold`.
- Named sizes (`text-xs`…`text-2xl`) when exact; arbitrary (`text-[13px]`) only off-scale.
- Optional project-tuned `tracking-*` / `leading-*` in `@theme`; document them in the theme file.
- Never pair `leading-none` with clipped overflow (`truncate`, `line-clamp-*`) — descenders get cut.

## 4. Spacing, sizing, radius, shadow

- Spacing is `0.25rem × N` and accepts decimals: `py-1.75` (7px), `min-h-35` (140px), `max-w-300`.
  `Npx ÷ 4` — if that's a number, the scale class exists. Tables in `tailwind-audit/references/scale-and-syntax.md`.
- Square boxes and icons: `size-N` (`size-4`; `size-11` for 44px touch targets).
- Radius derives from `--radius` in `@theme inline` (`rounded-sm/md/lg/xl`); `2xl`/`3xl` are stock.
- Elevation: optional brand-tinted `shadow-brand-*` utilities if stock grey shadows clash with the palette.

## 5. Responsive

- **Page markup:** mobile-first — base, then `sm:` / `md:` / `lg:`.
- **Inside a component that merges `className` with `cn()`:** write the mobile value as `max-md:`
  (or `max-sm:`), never a base + `md:` pair — tailwind-merge drops the base half when a caller
  overrides it and the `md:` half leaks onto desktop. See `responsive-patterns` and `shadcn-ui`.
- **Container queries** for components dropped into slots of varying width: `@container` on the parent,
  `@xl:` / `@3xl:` on children (`grid-cols-1 @xl:grid-cols-2 @3xl:grid-cols-3`). Named:
  `@container/card` + `@md/card:`.
- **Content padding** comes from one wrapper (e.g. `src/components/common/PageContent.tsx`); pages
  don't re-pad. It merges `className`, so its padding follows the variable pattern below, not a
  base + `md:` pair: `px-(--page-px) py-(--page-py) [--page-px:1rem] [--page-py:1.25rem]
  md:[--page-px:2rem] md:[--page-py:1.75rem]` — a call site re-tunes `[--page-px:0]` (a `p-0` would
  keep `md:px-8` with the pair). Narrower pages add `max-w-4xl` on an inner div.
- Overridable responsive padding goes through a CSS variable:
  `[--card-px:1rem] md:[--card-px:1.5rem]` read by `px-(--card-px)` (tailwind-merge 3 groups the
  `(--x)` shorthand; use `px-[var(--card-px,1.5rem)]` when you need a fallback).
- **Logical properties** for anything that should mirror in RTL: `ps-*`/`pe-*`, `ms-*`/`me-*`,
  `inset-s-*`/`inset-e-*` (4.2; `start-*`/`end-*` are deprecated), plus block/inline sizing
  (`block-*`, `inline-*`, `min-/max-inline-*`), `pbs-/pbe-`, `mbs-/mbe-`, `border-bs/be`.
- **Safe alignment** (4.1): `justify-center-safe`, `items-center-safe`, … fall back to `start` when
  centred content would overflow its box and become unreachable — use it on rows that can shrink.
- **Input-type variants** (4.1): `pointer-coarse:` / `pointer-fine:` (and `any-pointer-*`) target
  touch vs mouse directly — a better hook for bigger touch targets than a width breakpoint.
- Fixed-to-edge UI reads safe-area variables (`--safe-top: env(safe-area-inset-top)` etc.).

## 6. States and variants

- Radix state: `data-[state=open]:…`, `group-data-[…]:`; validation: `aria-invalid:border-destructive`;
  parent-aware: `group/name` + `group-hover/name:`, `has-[…]:`.
- **Focus — no double outlines.** A control with its own border shows focus by recolouring it
  (`focus-visible:border-ring focus-visible:ring-0`). Borderless targets keep a ring:
  `outline-none focus-visible:ring-2 focus-visible:ring-ring`. Guarded by
  `src/styles/no-double-outlines.test.ts`.
- Disabled: `disabled:opacity-50 disabled:pointer-events-none` (shadcn default).
- Form validity after interaction (4.1): `user-invalid:border-destructive` / `user-valid:` only fire
  once the user has touched the field — native `:invalid` styling shows errors on first paint.
- Other 4.1–4.3 additions worth knowing: `scrollbar-thin|none|auto`, `scrollbar-thumb-*`,
  `scrollbar-track-*`, `scrollbar-gutter-stable` (replace hand-written scrollbar CSS); `text-shadow-*`;
  `mask-*`; `wrap-break-word` / `wrap-anywhere` (long emails/URLs); `noscript:`; `details-content:`;
  `tab-*`; `zoom-*`. Colours on these (`text-shadow-<color>`, `scrollbar-thumb-<color>`) follow §2 —
  tokens only.

## 7. Motion

Enter/exit via tw-animate-css 1.4 (`animate-in fade-in-0 zoom-in-95`,
`data-closed:animate-out` — the CLI 4 preset form from `shadcn/tailwind.css`; older primitives write
`data-[state=closed]:`); `duration-250` takes any integer. Since 1.3 the default
`animation-fill-mode` is `none` (add `fill-mode-forwards` to an exit on an element that stays mounted)
and fractional zooms are written `zoom-in-1/2`. Everything else → `motion`.

## 8. Dark mode — decide once

- **Light-only** (simplest): no `next-themes`, no `.dark` block, and no new `dark:` classes (the ones
  shipped inside shadcn primitives are harmless). `shadcn add sonner` imports `useTheme` from
  `next-themes`, which without a provider falls back to "system" — dark toasts on a dark-mode OS. Drop
  it and pass `theme="light"` (a sanctioned edit — `shadcn-ui`), then remove `next-themes`.
- **Light + dark:** keep `@custom-variant dark`, add a `.dark { … }` block redefining the same
  variables, and run the contrast test for both blocks. Components still use only semantic classes;
  `dark:` in components is a smell — the token should flip, not the class.

Record the choice in `CLAUDE.md`.

## 9. v3 → v4 renames

| v3 | v4 |
|---|---|
| `tailwind.config.js` `theme.extend` | `@theme` / `@theme inline` in CSS; `@utility` for custom utilities |
| `@tailwind base/components/utilities` | `@import "tailwindcss";` |
| `bg-gradient-to-r` | `bg-linear-to-r` |
| `bg-opacity-50`, `text-opacity-*` | `bg-black/50`, `text-foreground/70` |
| `!p-0` | `p-0!` |
| `shadow-sm` / `shadow` | `shadow-xs` / `shadow-sm` (same shift for `drop-shadow`, `blur`, `backdrop-blur`) |
| `rounded-sm` / `rounded` | `rounded-xs` / `rounded-sm` |
| `ring` (3px, blue) | `ring` is 1px `currentColor` — write `ring-2 ring-ring` |
| `outline-none` (transparent outline) | `outline-hidden`; v4 `outline-none` removes it — pair with a focus style |
| `flex-shrink-0` / `flex-grow-0` | `shrink-0` / `grow-0` |
| `theme(colors.x)` | `var(--color-x)` / `var(--x)` |
| `w-[var(--x)]` | `w-(--x)` (tailwind-merge 3 groups both forms) |
| `safelist: [...]` in config | `@source inline("…")` in CSS |
| `start-0` / `end-0` (v4.0–4.1) | `inset-s-0` / `inset-e-0` (4.2+; old names still work, deprecated) |
| hand-written `::-webkit-scrollbar` utilities | `scrollbar-none` / `scrollbar-thin` (4.3) |

## 10. Assets and primitives

- Images: `next/image`, files under `public/assets/<subfolder>/`. Raw `<img>` only where `next/image`
  can't work, with a comment saying why.
- `components/ui/` is shadcn — don't edit outside the project's commented `⚠️` sanctioned edits; style
  at the call site via `className`. See `shadcn-ui`.

## Reference

`references/reference.md` is a vendored upstream Tailwind v4.1 digest (Vite install, stock palette
examples) with a short 4.1–4.3 additions section at the end. Use it for utility syntax only; colour,
font and config examples in it are overridden here. A Next.js app installs via `@tailwindcss/postcss`,
not the Vite plugin.
