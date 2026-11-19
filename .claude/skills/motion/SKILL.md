---
name: motion
description: Motion for a React 19.3 + Next.js 16 App Router app — React's stable <ViewTransition> + addTransitionType (and Next <Link transitionTypes>) for route, shared-element and list transitions; CSS transitions and Tailwind 4.3 + tw-animate-css 1.4 enter/exit on Radix state; theme keyframes; scroll-driven animations; micro-interactions; and prefers-reduced-motion (global CSS block, a ::view-transition-* rule, matchMedia for JS-timed motion). Choose the lightest tool; no motion library by default. Load this first for any motion in the project (its rules win); then `animate` to design one new animation step by step, `animation-performance` for jank, and suggest the /review-animations command for a strict review of motion code.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Motion Skill

This file owns the *facts and house rules*; the vendored craft skills own the judgement:

| Need | Skill |
|---|---|
| Build an animation (should it animate, curve, duration, interruption, exit) | `animate` |
| Review a diff's motion | `review-animations` |
| Jank, which property, `will-change`, CSS vs JS | `animation-performance` |
| Audit / find opportunities across the app | `improve-animations` (incl. missed opportunities) |

Where they prescribe colours, fonts or libraries, the project's `CLAUDE.md` wins. Their Framer Motion
/ `useReducedMotion` examples apply only if the project has chosen to install a motion library.

## Baseline (Nov 2026) — verify against package.json

next 16.4, react / react-dom 19.3, tailwindcss 4.3, tw-animate-css 1.4, radix-ui 1.8,
@playwright/test 1.64.

| Asset | Default |
|---|---|
| React `<ViewTransition>` + `addTransitionType` | **Stable in React 19.3** (experimental/canary through 19.2). In the Next 16 App Router they work with **no config** — the old `experimental.viewTransition` flag is gone. First choice for route changes, shared elements and list reorders. |
| Next `<Link transitionTypes={[…]}>` | Next 16.2+. Tags a navigation with transition types (e.g. `"forward"` / `"back"`) so CSS can pick a direction; `router.push` / `router.replace` accept them too. |
| `tailwindcss` 4.3 + `tw-animate-css` 1.4 | Imported in `src/app/globals.css`. `animate-in`/`animate-out`, `fade-*`, `zoom-*`, `slide-in-from-*` / `slide-out-to-*` (logical `start`/`end` too), `blur-in`/`blur-out`, `accordion-*`, `collapsible-*`, driven by `data-[state=open|closed]` on Radix primitives. |
| `framer-motion` / `motion` | **Not installed by default.** Adding one is a dependency decision — ask first and justify it (drag physics, spring-driven gestures) with a number from `next analyze`. `<ViewTransition>` now covers most layout/shared-element cases that used to justify it. |
| Theme keyframes | In `src/styles/theme.css`, exposed as `--animate-*` in `@theme` or an `@utility`. |
| Global reduced-motion block | In `src/app/globals.css` — see below. |

### tw-animate-css 1.4 — what changed since 1.0

- **Default `animation-fill-mode` is `none`** (since 1.3.4; was `forwards`). Radix unmounts on
  `animationend`, so dialog/menu exits are fine; an element that **stays mounted** after an exit
  animation snaps back unless you add `fill-mode-forwards`.
- **Fractional zoom ratios are `zoom-in-1/2`**, not a bracket value (1.3.0). Percent steps such as
  `zoom-in-95` are unchanged.
- `animation-duration-*` exists (1.3.0) alongside `duration-*`.
- Tailwind `prefix()` users import `tw-animate-css/prefix` (1.4.0).
- Skip 1.3.3 and 1.3.8 (bad releases). A 2.0 with breaking changes and a migration script is announced
  — read its notes before bumping.

## House rules

1. **Lightest tool:** Tailwind `transition-{colors,opacity,transform}` → `tw-animate-css` enter/exit →
   a keyframe in `theme.css` → React `<ViewTransition>` for anything that crosses a render (route
   change, shared element, reorder) → CSS scroll-driven animation as progressive enhancement. No
   library. Hand-rolled `document.startViewTransition` only for DOM changes React doesn't own.
2. **Name the property.** No `transition-all`. Animate `transform` / `opacity`; colour transitions are fine.
3. **Easing:** `ease-out` (or one custom curve such as `cubic-bezier(0.16, 1, 0.3, 1)`, defined once in
   the theme) for enter **and** exit; `ease-in-out` for on-screen movement; never `ease-in` on UI.
4. **Duration:** press 100–160ms, hover/state ~200ms, dialogs/sheets 200–300ms, route transitions
   ≤250ms. Over 300ms only for a one-off moment (a first-load entrance).
5. **Frequency:** keyboard-driven and many-times-a-day actions get little or no motion.
6. **No decorative infinite loops.** Spinners only during real waits; any sanctioned exception is
   documented in `CLAUDE.md`.
7. **Hover:** Tailwind v4's `hover:` only applies under `(hover: hover)`; no extra media query. Pair
   hover lift/scale with `motion-reduce:`.
8. **Tokens only.** Glows/shadows use `color-mix(in srgb, var(--token) N%, transparent)`; never raw colours.
9. **Interruptible overlays:** if a dialog can be covered and uncovered (one pop-up at a time), animate
   the hand-over with **transitions** (`transition-[opacity,scale,visibility]`), not keyframes, so a
   reversal mid-way turns smoothly.

## React `<ViewTransition>` (React 19.3, Next 16)

```tsx
import { ViewTransition } from "react";
```

- **What animates:** only updates inside a Transition — `startTransition`, Next navigations (which are
  transitions), `useDeferredValue`, and Suspense reveals. A plain `setState` does **not** animate.
- **Props:** `name` (shared-element pairing; unique per page), and `enter`, `exit`, `update`, `share`,
  `default` — each `"none"`, `"auto"`, a class name, or a map keyed by transition type
  (`{ forward: "slide-left", back: "slide-right", default: "none" }`).
- **Where:** put the route's enter/exit wrapper in `page.tsx`, not the layout (a layout persists across
  navigations, so it never enters or exits).
- **Direction:** tag navigations with `<Link href="/next" transitionTypes={["forward"]}>`, or call
  `addTransitionType("forward")` inside your own `startTransition`. CSS can also branch on
  `:active-view-transition-type(forward)`.
- DOM only; Transitions in React 19.3 render independently (one no longer waits on another).

```tsx
// app/(dashboard)/orders/[id]/page.tsx
export default async function Page({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return (
    <ViewTransition enter={{ forward: "slide-in", back: "slide-back", default: "none" }} exit="none">
      <OrderDetail id={id} />
    </ViewTransition>
  );
}
```

```css
/* theme.css — names map to view-transition classes */
::view-transition-new(.slide-in) { animation: fade-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1); }
::view-transition-new(.slide-back) { animation: fade-slide-back 220ms cubic-bezier(0.16, 1, 0.3, 1); }
```

Shared element: wrap the thumbnail on the list page and the hero on the detail page in
`<ViewTransition name={`order-${id}`}>`; React morphs one into the other on navigation.

## Reduced motion

**Default — change if your project differs:** one global block in `globals.css` turns motion *off*:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  /* `*` does not match view-transition pseudo-elements — stop them explicitly */
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

Biome's recommended `complexity/noImportantStyles` rejects these `!important`s; the kit's
`biome.json` turns it off for `src/app/globals.css` only (an override), so the block lives there and
nowhere else. Kit `templates/src/app/globals.css` has it.

This is stricter than the vendored "gentler, not zero" advice; a project may instead swap motion for
opacity fades. Whichever it picks, write it in `CLAUDE.md` and:

- **CSS:** don't add a second global rule or fight it with `!important`. Still write `motion-safe:` on
  entrances (so nothing flashes from its `from` keyframe) and `motion-reduce:transition-none` where a
  transition carries state.
- **Essential feedback** (a spinner, a progress bar) stays, but drops movement where it can.
- **View transitions:** the block above covers `<ViewTransition>` and hand-rolled
  `startViewTransition`; the DOM still swaps instantly, which is the point.
- **JS:** CSS can't stop timers, typing effects or `scrollIntoView({ behavior: "smooth" })`. Check
  `window.matchMedia?.("(prefers-reduced-motion: reduce)").matches` and take the instant path.
- **Smooth scrolling:** Next 16 no longer suppresses a global `scroll-behavior: smooth` during route
  navigation. If you set it globally, add `data-scroll-behavior="smooth"` on `<html>` to get the old
  "instant on navigation" behaviour.
- **E2E:** Playwright 1.63+ has a standalone `reducedMotion` test option —
  `test.use({ reducedMotion: "reduce" })` — for specs that fight animations.

## Recipes

**Enter/exit on a Radix part** — follow the shadcn primitives. CLI 4 presets (e.g. `radix-nova`) use
the short custom variants `shadcn/tailwind.css` defines:
```tsx
"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 duration-200"
```
Older primitives (and code without that import) write the same with `data-[state=open]:` /
`data-[state=closed]:`. Match whichever the file's primitive already uses.

**New keyframe** — in `theme.css`, named for what it does (`fade-slide-in`, not `cool-anim`):
```css
@keyframes fade-slide-in { from { opacity: 0; translate: 0 8px; } to { opacity: 1; translate: 0 0; } }
@theme { --animate-fade-slide-in: fade-slide-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both; }
```
Use as `motion-safe:animate-fade-slide-in`.

**In-page state change as a view transition** (e.g. a list re-sort):
```tsx
import { addTransitionType, startTransition } from "react";

startTransition(() => {
  addTransitionType("reorder");
  setSort(next);
});
```
Wrap each row in `<ViewTransition name={`row-${row.id}`}>`. Cross-document
`@view-transition { navigation: auto }` does nothing for Next.js client-side navigation.

**Scroll-reveal:** `animation-timeline: view()` inside `@supports (animation-timeline: view())`, so
unsupported browsers show the final state. Use sparingly — per-section fade-ups are a generic default.

## Audit

```bash
grep -rn "transition-all" src --include='*.tsx' | grep -v '\.test\.'
grep -rn "@keyframes\|--animate-\|animation:\|::view-transition" src/styles src/app/globals.css
grep -rn "prefers-reduced-motion\|motion-safe\|motion-reduce" src --include='*.tsx' --include='*.css' | grep -v '\.test\.'
grep -rn "ViewTransition\|addTransitionType\|transitionTypes\|startViewTransition" src --include='*.tsx' --include='*.ts' | grep -v '\.test\.'   # check page.tsx placement + reduce rule
grep -rn "setInterval\|requestAnimationFrame\|behavior: \"smooth\"" src --include='*.tsx' --include='*.ts' | grep -v '\.test\.'   # JS motion: needs a matchMedia check
grep -rnE "zoom-(in|out)-\[|animate-out" src --include='*.tsx' | grep -v '\.test\.'   # bracket zooms → zoom-in-1/2; exits on mounted elements need fill-mode-forwards
grep -rn "ease-in\b\|ease-in " src --include='*.tsx'   # ease-in on UI
```
