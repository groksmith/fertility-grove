---
name: a11y
description: Accessibility for a React 19.3 + Next.js 16 App Router app at WCAG 2.2 AA — semantic HTML, ARIA, keyboard navigation, focus management (skip link, route changes, dialogs, form errors, Fragment refs), Radix tri-state checkboxes, lucide's aria-hidden default, screen reader UX, contrast enforced by a token test, Biome 2 a11y lint, axe-core 4.14 in Vitest, @axe-core/playwright AxeBuilder and Playwright 1.64 aria snapshots in E2E, and reduced motion. Use when something can't be reached by keyboard or isn't announced, focus is lost, or for an a11y audit; the visual focus ring and colour of a control are `tailwind-css-patterns`.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Accessibility Skill

WCAG 2.2 AA is the floor. Start every feature with: *how does this work keyboard-only, and what does a
screen reader say?* The project's `CLAUDE.md` wins on any conflict. Broad UI review:
`web-design-guidelines`; worst-case content (long names, RTL, emoji): `break-ui`.

Baseline (Nov 2026) — verify against package.json: next 16.4, react 19.3, radix-ui 1.8, lucide-react
1.66, sonner 2.0, axe-core / `@axe-core/playwright` 4.14, `@playwright/test` 1.64, vitest 5,
`@biomejs/biome` 2.6.

## Infrastructure to provide once — then reuse, don't rebuild

| Concern | Provide | Notes |
|---|---|---|
| Skip link + landmark | the app shell (e.g. `src/components/common/AppShell.tsx`) | First focusable element: `<a href="#main-content" className="sr-only focus:not-sr-only …">Skip to main content</a>`. Target: `<main id="main-content" tabIndex={-1} className="outline-none">`. Exactly one `<main>` per page — page wrappers and pages must not add another. |
| Field ↔ label ↔ error wiring | `src/components/shared/FormField.tsx` | Never hand-roll a labelled input. Wires `htmlFor`, `aria-describedby` (hint + error), `aria-invalid`. |
| Server 422 → fields + focus | e.g. `src/lib/field-errors.ts` → `applyFieldErrors(form, error, fields)` | `setError(name, …, { shouldFocus })` on the first mapped field. Client-side Zod failures are focused by RHF's default `shouldFocusError`. See `forms`. |
| Dialog/sheet focus trap, Escape, focus return | `components/ui/dialog.tsx`, `sheet.tsx` (Radix) | Plus the one-pop-up-at-a-time rule (`src/styles/one-popup-at-a-time.test.ts`): a covered dialog must be hidden and inert so focus can't land in it. Cancel = `DialogClose asChild`. Every dialog keeps the corner ✕ (`src/styles/dialog-close.test.ts`). See `shadcn-ui`. |
| Menus, tabs, radio, select, tooltip, popover | `components/ui/*` (Radix) | Roving tabindex + ARIA built in. Never re-implement a composite widget. |
| Toasts | sonner `<Toaster>` | Announces via its own live region; don't add another. sonner 2.0.8 accepts custom aria labels and stays in the top layer over modals. |
| Reduced motion | global block in `src/app/globals.css` | See below and `motion`. |
| Contrast regression test | `src/styles/theme.test.ts` | Computes WCAG ratios from the `:root` token values. See `tailwind-css-patterns` §2. |
| Component axe check | a reference test, e.g. `FormField.test.tsx` | `axe-core` in jsdom. |
| Page axe check | `@axe-core/playwright` (`AxeBuilder`) in E2E | Real browser, real CSS — catches contrast and target size that jsdom can't. Recipe below. |
| Lint | Biome 2.6 `a11y` group (or ESLint `jsx-a11y`) | Know which a11y rules are off — e.g. if `useKeyWithClickEvents` is disabled, click-only handlers on non-buttons are **not** caught; review by hand. Biome 2.5 promoted `noAmbiguousAnchorText` ("click here", "read more") to recommended; 2.4 added 15 HTML a11y rules; `noBlankTarget` now lives in `security`, not `a11y` (update `biome-ignore` comments that name it — suppressions use `lint/<group>/<rule>`). |

## Rules

### Semantics first
`<button>` acts, `<a>`/`<Link>` navigates. No `<div onClick>`; no `<a onClick>` without `href`. ARIA
patches what HTML can't say — a wrong role is worse than none. Never `aria-hidden` on something
focusable. `aria-label` on an element with visible text only as a deliberate override, and it must
contain the visible text (2.5.3 label in name). One `<h1>` per page; headings in order.

### Every interactive element has
- **A name** — text, or `aria-label` on icon-only buttons (`<span className="sr-only">` also works).
  A tooltip is not a name. **axe 4.14 enables `label-content-name-mismatch` by default:** a control
  whose `aria-label` doesn't contain its visible text now fails (WCAG 2.5.3). Treat those findings as
  real — fix the label, don't disable the rule.
- **Icons (lucide-react 1.x):** icons render `aria-hidden="true"` **by default**, so a decorative icon
  needs no prop — delete redundant `aria-hidden`. The default is dropped when the icon gets children,
  any `aria-*` prop, `role` or `title`: a standalone meaningful icon takes `aria-label` (or
  `role="img"` + `title`) and is then exposed. An icon *inside* a named button stays hidden; name the
  button, not the icon. lucide 1.x ships no brand icons — authored SVGs need their own `aria-hidden` or
  label.
- **Visible focus, no double outlines.** A bordered control (input, select, checkbox, outlined button)
  shows focus by recolouring its own border (`focus-visible:border-ring focus-visible:ring-0`);
  borderless things (skip link, nav items, dialog ✕, calendar day) keep
  `focus-visible:ring-2 focus-visible:ring-ring`. Guarded by `src/styles/no-double-outlines.test.ts`.
  Never `outline-none` with no replacement.
  - ⚠️ **`sr-only` inputs** (a styled `<label>` wrapping a visually hidden `<input>` / `RadioGroupItem`):
    a ring would paint inside the 1×1px clip. Put it on the wrapper —
    `has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring`
    (`-outline-offset-2` inside an `overflow-hidden` list). Use `outline`, not `ring`, so it doesn't
    collide with a selected row's ring.
- **Target size ≥ 24×24 CSS px** (2.5.8); aim for 44px on touch (`size-11`, `max-md:min-h-11`).
- **A disabled state that explains itself** — prefer enabled + inline validation, or a visible reason.

### Tri-state checkbox (Radix)
Pass `checked="indeterminate"` to the Radix checkbox — it sets `aria-checked="mixed"` and
`data-state="indeterminate"`; style that state to show a **minus**, not the tick (a sanctioned edit to
`ui/checkbox.tsx` if the upstream primitive doesn't). A *native* `<input type="checkbox">` needs the
`indeterminate` DOM property set via `ref`; there is no attribute for it. A parent "select all" is
`true` when all children are, `false` when none, `"indeterminate"` otherwise.

### Contrast
Text 4.5:1, large text (24px, or 18.66px at 600+) 3:1, UI boundaries and focus indicators 3:1 (1.4.11).
Contrast is enforced on the **tokens**, not per component: `src/styles/theme.test.ts` asserts every
text/surface pair the app uses, and the `:root` block records measured ratios in comments. A failing
pair → change the token (or add a `-text` variant), add the case, never patch one component with a
literal. Error red (`destructive`) and the `end-action` colour must both meet 4.5:1 as text. Never
colour as the only signal: errors carry text (+ icon).

### Focus management
- **Dialogs:** Radix traps and restores focus to the trigger. When the stack closes, focus returns to
  the original trigger. (`radix-ui` 1.8 fixes stale `onEscapeKeyDown`/`onDismiss` handlers on React
  19.2+ — upgrade rather than work around them.)
- **Focus first/last without a wrapper:** React 19.3 Fragment refs — `<Fragment ref={r}>` gives a
  `FragmentInstance` with `focus()`, `focusLast()`, `blur()`, `scrollIntoView()` — so a custom
  composite doesn't need an extra `<div>` just to move focus into it.
- **Preserved routes:** with Cache Components on, Next 16 keeps a few visited routes mounted under
  React `<Activity mode="hidden">`. Hidden content is `display:none` (out of the a11y tree) and its
  effects are cleaned up and re-run on return, but **state persists** — a dialog or menu that was open
  can be open again on Back. Make sure that re-entry restores focus sensibly (or close transient UI on
  navigation).
- **Form errors:** RHF default + `applyFieldErrors`. Errors show inline, never toast-only.
- **Route changes:** Next.js does not move focus on client navigation. Provide one shared hook (e.g.
  `src/hooks/useRouteFocus.ts`) that, on pathname change (not first load), focuses `#main-content` or
  the page `<h1>` — never per-page fixes.
- **Focus not obscured (2.4.11):** sticky headers, bottom tab bars and floating buttons can cover a
  focused field — pad the scroll area (`scroll-padding-top/bottom`) for fixed chrome.

### Live regions
For in-page async status (saving, generating…) use `role="status"` / `aria-live="polite"` on a
container that exists *before* the text changes. Loading regions: `aria-busy="true"` while the
`<Skeleton>` shows.

### Forms checklist
- [ ] Built with `<FormField>`; hints in `description`, never placeholder-only
- [ ] `autoComplete` set (`email`, `current-password`, `new-password`, `name`, `tel`, `one-time-code` …)
- [ ] Required shown visually and programmatically
- [ ] Native-validity styling uses `user-invalid:` (Tailwind 4.1), so untouched fields don't render as
      errors on first paint
- [ ] Server 422s mapped onto fields; non-field errors fall back to a toast
- [ ] Submit is a real `<button type="submit">`
- [ ] No re-asking for data given earlier in the same flow (3.3.7); no cognitive test to sign in —
      paste allowed in password and OTP fields (3.3.8)

### Reduced motion
The global `prefers-reduced-motion: reduce` block in `globals.css` handles CSS animation/transition —
don't add another. It does **not** reach the `::view-transition-*` pseudo-elements that React
`<ViewTransition>` animates; those need their own reduce rule. CSS can't reach JS-timed motion
(timers, typing effects, `scrollIntoView({ behavior: "smooth" })`): each must check
`window.matchMedia("(prefers-reduced-motion: reduce)").matches` itself. Details: `motion`.

## Testing

| Layer | How |
|---|---|
| Component (Vitest 5 + jsdom) | `// @vitest-environment jsdom`, render, then `const results = await axe.run(container, { rules: { region: { enabled: false }, "color-contrast": { enabled: false } } }); expect(results.violations).toEqual([]);` jsdom can't compute contrast — that's the token test's job. Query by role/label (`screen.getByRole("button", { name: /save/i })`) — a test that can't find it by role has found an a11y bug. Never hard-code generated ids in assertions: React 19.2 changed the `useId` prefix to `_r_`; assert the *relationship* instead — follow `aria-describedby` and read the text (`input.getAttribute("aria-describedby")?.split(" ").map((id) => document.getElementById(id)?.textContent)`), as kit `templates/src/components/shared/FormField.test.tsx` does. (`toHaveAccessibleDescription` needs `@testing-library/jest-dom` plus a setup file, which the baseline doesn't include.) |
| E2E (Playwright 1.64) | Role/label locators (`getByRole(name, { description })` since 1.60); structure via `toMatchAriaSnapshot` (on a locator, or on the whole `page` since 1.60); keyboard via `page.keyboard.press("Tab")` + `expect(locator).toBeFocused()`; page-level axe via `AxeBuilder` (below). See `playwright-testing`. |
| Manual | Keyboard-only walk (Tab/Shift+Tab, Enter, Space, Escape, arrows in composites); VoiceOver (Cmd+F5) or NVDA on the primary flow — headings in order, buttons say what they do, errors and dialogs announced; 200% zoom and 320px width with no horizontal scroll (1.4.10). |

### E2E recipes

```ts
import AxeBuilder from "@axe-core/playwright";   // devDependency, version tracks axe-core (4.14)
import { expect, test } from "@playwright/test";

test("settings page has no axe violations", async ({ page }) => {
  await page.goto("/settings");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]) // confirm tag names in axe's rule docs
    .exclude("[data-third-party-widget]")       // only what you don't own
    .analyze();
  expect(results.violations).toEqual([]);
});

test("settings structure", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("main")).toMatchAriaSnapshot(`
    - heading "Settings" [level=1]
    - button "Save"
  `);
});
```

- AxeBuilder injects into every frame (cross-origin included) by default; `setLegacyMode()` turns that
  off. Scope with `.include()` / `.exclude()`, never by disabling rules wholesale; a justified
  `.disableRules([...])` gets a comment.
- axe 4.12 deprecated `landmark-complementary-is-top-level` — drop it from any rule lists. 4.13 flags
  deprecated ARIA attributes as *needs review* and supports ElementInternals by default.
- Playwright 1.63 test options `reducedMotion`, `forcedColors` and `contrast` are standalone:
  `test.use({ forcedColors: "active" })` runs a spec in forced-colours mode — the place to prove focus
  indicators survive (`outline`, not just `box-shadow`).
- Playwright 1.64: elements inside a **hidden iframe now count as hidden**; prefer
  `locator.visible()` (1.63) over the `:visible` pseudo-class. `--update-snapshots=missing` now passes
  the run — review new aria snapshots before committing them.

## Static audit recipes

```bash
# Click handlers on things that aren't buttons/links
grep -rnE '<(div|span|li|tr|td)[^>]*onClick' src --include='*.tsx' | grep -v '\.test\.'
# next/image without alt (inspect each file listed)
grep -rln '<Image' src --include='*.tsx' | xargs grep -L 'alt='
# Icon-only buttons — inspect each for aria-label / sr-only text
grep -rn 'size="icon' src --include='*.tsx' | grep -v '\.test\.'
# Outline removed — check each has a focus-visible replacement
grep -rn 'outline-none' src --include='*.tsx' | grep -v 'focus-visible\|components/ui' | grep -v '\.test\.'
# More than one <main>
grep -rn '<main' src --include='*.tsx' | grep -v '\.test\.'
# Positive tabIndex
grep -rnE 'tabIndex=\{[1-9]' src --include='*.tsx'
# aria-hidden on icons — redundant for lucide 1.x (default); keep it only on authored SVGs
grep -rnE '<[A-Z][A-Za-z]*(Icon)?\b[^>]*aria-hidden' src --include='*.tsx' | grep -v '\.test\.'
# aria-label on a control with visible text — must contain that text (axe label-content-name-mismatch)
grep -rnE '<(Button|button|a|Link)\b[^>]*aria-label=' src --include='*.tsx' | grep -v 'size="icon' | grep -v '\.test\.'
```

Report findings as Critical / Serious / Moderate / Minor, with file:line and the WCAG criterion.

## WCAG 2.2 AA checklist

| Criterion | Check |
|---|---|
| 1.1.1 Non-text content | `alt` on every image (`alt=""` if decorative); icon buttons named |
| 1.3.1 Info and relationships | Landmarks, headings, labels, table headers, lists are real elements |
| 1.4.3 / 1.4.11 Contrast | Token test covers every pair; focus rings ≥ 3:1 |
| 1.4.4 / 1.4.10 Resize & reflow | 200% zoom, 320px width, no horizontal scroll; `rem` in fluid type |
| 1.4.12 Text spacing | No fixed heights that clip text |
| 2.1.1 / 2.1.2 Keyboard, no trap | Everything operable; only modals trap, and Escape leaves |
| 2.4.1 Bypass blocks | Skip link to `#main-content` |
| 2.4.3 Focus order | DOM order = visual order; no positive `tabIndex` |
| 2.4.7 Focus visible | Every focusable has a visible state (no double outlines) |
| **2.4.11 Focus not obscured** | Fixed chrome doesn't cover the focused element |
| **2.5.7 Dragging movements** | Every drag (sortable list, map pin, slider) has a click/keyboard alternative |
| **2.5.8 Target size** | ≥ 24×24px or adequate spacing |
| 3.2.2 On input | Changing a control doesn't navigate or submit unexpectedly |
| **3.2.6 Consistent help** | Help/contact entry points stay in the same place across pages |
| 3.3.1 / 3.3.3 Error identification & suggestion | Inline text errors, tied to the field |
| **3.3.7 Redundant entry** | Don't re-ask within a flow |
| **3.3.8 Accessible authentication** | Paste allowed; no puzzles; password managers work |
| 4.1.2 Name, role, value | Radix primitives; custom widgets expose state (`aria-expanded`, `aria-checked`, `aria-selected`) |
| 4.1.3 Status messages | Live regions for async status; toasts announced |
