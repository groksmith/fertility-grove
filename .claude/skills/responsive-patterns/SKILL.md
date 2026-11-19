---
name: responsive-patterns
description: Responsive layout for a Next.js 16 + Tailwind 4.3 app — max-md overrides under tailwind-merge 3, CSS (not useIsMobile) layout switching to avoid hydration CLS, safe-area variables for a mobile shell, single-wrapper content padding, container queries (@container, @container-size for cqb/cqh), logical inset-s/e, safe alignment, pointer-coarse touch targets, plus fluid type, subgrid and intrinsic grids. Use when building or fixing layout across phone/tablet/desktop or adding container queries.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Responsive Patterns

House rules first (they win over the generic material further down and in `rules/`), then modern
CSS techniques. Styling basics: `tailwind-css-patterns`. Verify across viewports with the
`*.responsive.spec.ts` Playwright projects (`playwright-testing`) — note Playwright 1.64 device
descriptors now forward `screen`; set `screen: undefined` in a project if a spec relied on the old
behaviour.

Baseline (Nov 2026) — verify against package.json: `tailwindcss` 4.3, `cn` (tailwind-merge 3.7-compatible),
Next 16.4, React 19.3, `@playwright/test` 1.64.

## ⚠️ Mobile overrides: `max-md:`, not a mobile-first `md:` pair

On any component that accepts a `className` and merges it with `cn` (the `cn` package — same merge rules as `twMerge(clsx(…))`), the
familiar mobile-first pair is a **desktop regression waiting to happen**. When a call site sets the
same property, tailwind-merge drops the *unprefixed* half and keeps the `md:` half — which then wins
at ≥768px:

```
twMerge("min-h-11 md:min-h-10 min-h-11")  →  "md:min-h-10 min-h-11"   // 44px silently becomes 40px at ≥md
twMerge("px-4 md:px-6 p-0")               →  "md:px-6 p-0"            // a `p-0` call site gains 24px of padding
```

So:

- **Component that takes `className`** → write the mobile value as `max-md:` (or `max-sm:`). It emits
  nothing above the breakpoint and cannot be overridden there, so desktop is provably untouched.
- **Plain page markup with no `className` pass-through** → ordinary mobile-first `md:` is fine and
  remains the idiom. The hazard is the merge, not the direction.
- **Responsive padding that must stay overridable** → route it through a CSS variable so it stays
  inside one tailwind-merge conflict group and a call-site `p-0`/`p-4` still wins:
  `p-(--card-padding)` + `[--card-padding:1rem] md:[--card-padding:1.5rem]`. tailwind-merge 3
  groups both `p-(--x)` and `p-[var(--x)]`; use the bracket form only when you need a fallback
  (`p-[var(--card-padding,1.5rem)]`).

tailwind-merge 3.7 keeps `p-2 max-md:p-4 md:p-6` intact (different variants don't conflict). Verify
anything unusual with `twMerge(...)` in a scratch test rather than inferring. Tailwind emits every
`max-*` utility after the unprefixed ones and `sm:[--var]` after `[--var]`, so the cascade resolves as
intended.

## ⚠️ Never measure the viewport during render

A `useIsMobile()`-style hook (shadcn ships one in `src/hooks/use-mobile.ts`) starts `undefined` on the
server and first client render, so **its first render always says "not mobile"**. A component that
branches its layout on it hydrates the desktop tree on a phone, paints it, then replaces it — a
full-layout shift (CLS) on every load.

Switch layouts with **CSS** instead — both trees in the markup, `md:hidden` / `hidden md:block` (or
`max-md:`) deciding which is seen. Two rules come with it:

- **Render the heavy subtree once.** Duplicating it and hiding one copy duplicates every form-control
  `id`, every `aria-describedby`, and every registration keyed by name. It also puts two elements with
  the same accessible name in the document — jsdom applies no stylesheet, so component tests see both
  and `getByRole` throws. Where two widths show the same control differently, restyle ONE node.
- **When behaviour — not layout — must differ, read the viewport in the event handler**, e.g.
  `window.matchMedia("(min-width: 48rem)").matches` inside `onClick`. A handler runs at the real
  width, so it cannot hydrate wrong. (Example: below `md`, opening a detail panel pushes a `?panel=`
  search param so Back closes it; above `md` it swaps through local state with no history entry.)

`useIsMobile` stays fine for non-layout choices (e.g. the shadcn sidebar choosing a sheet over a fixed
panel), but prefer CSS whenever CSS can express it. If a subtree genuinely cannot render on the server,
React 19.3's `use(browser())` (from `react-dom`) opts it out of SSR explicitly — still not a licence to
branch *layout* on width.

**Touch vs mouse is not a width.** For bigger hit areas on touch devices use Tailwind 4.1's
`pointer-coarse:` (e.g. `pointer-coarse:min-h-11`) instead of guessing from `max-md:`; a tablet with a
trackpad and a narrow desktop window are both mis-served by a width breakpoint.

## Mobile shell (optional pattern)

If the app has a fixed mobile chrome (bottom tab bar below `md`, top bar above), publish its geometry
as CSS variables in `theme.css` so fixed-to-edge UI can account for it:

- `--mobile-tab-bar-height` — the bar's height including the home-indicator safe area, `0px` above `md`
  (and while the soft keyboard is open, if you track that via e.g. `data-keyboard="open"` on `<html>`).
  The shell spends it as bottom padding; a route that builds its own full-height layout must too.
- `--safe-top` / `--safe-bottom` — `env(safe-area-inset-*)`, live only when the root layout's
  `viewport` export sets `viewportFit: "cover"`.

## Content padding

Give route content its padding from **one** wrapper component (e.g.
`src/components/common/PageContent.tsx`):

```tsx
"flex min-h-0 flex-1 flex-col overflow-x-clip px-4 py-5 pb-10 md:px-8 md:py-7 md:pb-12"
```

Pages don't re-pad; narrower form/detail content adds `max-w-4xl` on an inner wrapper. If you also
define a `@utility container`, document whether it's used — don't let two padding systems coexist.

## Container queries in Tailwind v4

Built in — no plugin. `@container` on the parent, `@<size>:` on descendants; `@max-<size>:` for the
inverse; `@container/name` + `@md/name:` when containers nest.

| Variant | `@xs` | `@sm` | `@md` | `@lg` | `@xl` | `@2xl` | `@3xl` | `@4xl` |
|---|---|---|---|---|---|---|---|---|
| min-width | 20rem | 24rem | 28rem | 32rem | 36rem | 42rem | 48rem | 56rem |

Typical use: a field grid `grid-cols-1 @xl:grid-cols-2 @3xl:grid-cols-3` with full-span rows
`@xl:col-span-2 @3xl:col-span-3`; shadcn's `ui/card.tsx` ships a named `@container/card-header`.

`@container` is an **inline-size** container: `cqi` (and `cqw`) resolve against it, but `cqb`/`cqh`
fall through to an outer size container or the viewport. For height-aware units, Tailwind 4.3 adds
**`@container-size`** (`container-type: size`; named `@container-size/name`). A size container needs
an explicit height — it no longer sizes from its content — so use it only on boxes whose height is set
by the layout (a fixed panel, a grid track, a full-height pane).

Use them for a component that lands in slots of different widths (a field grid inside a card, a
rail, a dialog); use viewport `sm:`/`md:`/`lg:` for page-level structure (nav, shell, column count of
the page itself).

## Logical properties and safe alignment

- **Logical insets** (4.2): `inset-s-*` / `inset-e-*` / `inset-bs-*` / `inset-be-*` replace
  `start-*` / `end-*` (deprecated, still work) and mirror in RTL, unlike `left-*` / `right-*`. Same for
  `ps-`/`pe-`, `ms-`/`me-`, `border-s`/`border-e`, and 4.2's block/inline sizing (`inline-*`,
  `min-/max-inline-*`, `block-*`, `pbs-`/`pbe-`, `mbs-`/`mbe-`).
- **Safe alignment** (4.1): `justify-center-safe`, `items-center-safe`, … centre while there is room and
  fall back to start alignment when content would overflow — so a centred row that shrinks on a phone
  never pushes content off the left edge where it can't be scrolled to.
- **Scrollbars** (4.3): `scrollbar-gutter-stable` on a scroll pane stops layout shifting when its
  scrollbar appears; `scrollbar-none` / `scrollbar-thin` replace hand-written `::-webkit-scrollbar`.
- **Long strings:** `wrap-break-word` / `wrap-anywhere` (4.1) for emails and URLs in narrow columns.

## Modern CSS Layout

> Load `Read("${CLAUDE_SKILL_DIR}/rules/css-subgrid.md")` for CSS Subgrid patterns: nested grid alignment, card layouts with aligned titles/content/actions, two-dimensional subgrid.

> Load `Read("${CLAUDE_SKILL_DIR}/rules/css-intrinsic-responsive.md")` for intrinsically responsive layouts: auto-fit/minmax grids, clamp() for fluid everything, container queries for component logic, zero media query patterns.

> Load `Read("${CLAUDE_SKILL_DIR}/rules/responsive-foldables.md")` for foldable/multi-screen device support: env(safe-area-inset-*), viewport segment queries, dual-screen layouts, progressive enhancement.

**Key patterns covered:** CSS Subgrid alignment, intrinsic responsive grids (auto-fit + minmax), fluid clamp() scales, foldable device layouts, safe area insets, viewport segment queries.

## CSS Patterns

> Load `Read("${CLAUDE_SKILL_DIR}/rules/css-patterns.md")` for complete CSS examples: container queries, cqi/cqb units, fluid typography with clamp(), mobile-first breakpoints, CSS Grid patterns, and scroll-queries.

**Key patterns covered:** Container Query basics, Container Query Units (cqi/cqb), Fluid Typography with clamp(), Container-Based Fluid Typography, Mobile-First Breakpoints, CSS Grid Responsive Patterns, Container Scroll-Queries (Chrome 126+).

## React Patterns

> Load `Read("${CLAUDE_SKILL_DIR}/rules/react-patterns.md")` for container-query components and
> responsive images. Prefer CSS over its `useContainerQuery` hook; its `<img srcset>` examples
> translate to `next/image` with `sizes`.

## Accessibility Considerations

```css
/* IMPORTANT: Always include rem in fluid typography */
/* This ensures user font preferences are respected */

/* ❌ WRONG: Viewport-only ignores user preferences */
font-size: 5vw;

/* ✅ CORRECT: Include rem to respect user settings */
font-size: clamp(1rem, 0.5rem + 2vw, 2rem);

/* User zooming must still work */
@media (min-width: 768px) {
  /* Use em/rem, not px, for breakpoints in ideal world */
  /* (browsers still use px, but consider user zoom) */
}
```

## Anti-Patterns (FORBIDDEN)

```css
/* ❌ NEVER: Use only viewport units for text */
.title {
  font-size: 5vw; /* Ignores user font preferences! */
}

/* ❌ NEVER: Use cqw/cqh (use cqi/cqb instead) */
.card {
  padding: 5cqw; /* cqw = container width, not logical */
}
/* ✅ CORRECT: Use logical units */
.card {
  padding: 5cqi; /* Container inline = logical direction */
}

/* ❌ NEVER: Container queries without container-type */
@container (min-width: 400px) {
  /* Won't work without container-type on parent! */
}

/* ❌ NEVER (in hand-written CSS): desktop-first media queries.
   In Tailwind classes on a component that takes `className`, `max-md:` IS the rule — see above. */
.element {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 768px) {
  .element {
    grid-template-columns: 1fr; /* Overriding = more CSS */
  }
}

/* ❌ NEVER: Fixed pixel breakpoints for text */
@media (min-width: 768px) {
  body { font-size: 18px; } /* Use rem! */
}

/* ❌ NEVER: Over-nesting container queries */
@container a {
  @container b {
    @container c {
      /* Too complex, reconsider architecture */
    }
  }
}
```

## Browser Support

Container size queries, `cqi`/`cqb`, `clamp()` and subgrid are Baseline — use freely. Container
**style** and **scroll-state** queries are not Baseline; don't depend on them for layout.

## Rules

Each category has individual rule files in `rules/` loaded on-demand:

| Category | Rule | Impact | Key Pattern |
|----------|------|--------|-------------|
| Modern CSS Layout | `rules/css-subgrid.md` | HIGH | CSS Subgrid for nested grid alignment, card layouts |
| Modern CSS Layout | `rules/css-intrinsic-responsive.md` | HIGH | Intrinsic responsive layouts, auto-fit/minmax, clamp(), zero breakpoints |
| Modern CSS Layout | `rules/responsive-foldables.md` | MEDIUM | Safe area insets (`--safe-top`/`--safe-bottom`), viewport segments |
| CSS | `rules/css-patterns.md` | HIGH | Container queries, cqi/cqb, fluid typography, grid |
| React | `rules/react-patterns.md` | HIGH | Container query components, responsive images |
| Touch & Mobile | `rules/touch-interaction.md` | HIGH | Touch targets (44px min = `size-11`/`min-h-11`), thumb zones, gestures |

PWA/service-worker and `motion/react` animation rules were removed from this vendored copy; for motion
use the `motion` skill (CSS, tw-animate-css, native View Transitions).

## Key Decisions

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Query type | Media queries | Container queries | **Container** for components, **Media** for layout |
| Container units | cqw/cqh | cqi/cqb | **cqi/cqb** (logical, i18n-ready); `cqb` needs `@container-size` |
| Touch sizing | `max-md:` | `pointer-coarse:` | **`pointer-coarse:`** for hit areas; width breakpoints for layout |
| Edge positioning | `left-*`/`right-*` | `inset-s-*`/`inset-e-*` | **logical** |
| Fluid type base | vw only | rem + vw | **rem + vw** (accessibility) |
| Mobile-first | Yes | Desktop-first | **Mobile-first** in page markup; `max-md:` in `className`-merged components |
| Grid pattern | auto-fit | auto-fill | **auto-fit** for cards, **auto-fill** for icons |

## Related Skills

- `tailwind-css-patterns` - Tokens, scales and Tailwind v4 syntax
- `tailwind-audit` - Auditing responsive/spacing/token compliance
- `perf` - CLS, responsive images, and `next/image` optimization
- `a11y` - Touch targets, focus management, `prefers-reduced-motion`

## References

Load on demand with `Read("${CLAUDE_SKILL_DIR}/references/<file>")`:
| File | Content |
|------|---------|
| `container-queries.md` | Container query patterns |
| `fluid-typography.md` | Accessible fluid type scales |
