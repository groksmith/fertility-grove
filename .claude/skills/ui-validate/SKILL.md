---
name: ui-validate
description: Review a component or page against the project's design-system, dialog, responsive and accessibility rules (WCAG 2.2 AA, axe 4.14 incl. label-content-name-mismatch) and report file:line issues with fixes. Use first whenever asked to review, check or validate the app's UI against our own rules before handing it back; `web-design-guidelines` adds a generic best-practice pass on top.
argument-hint: "[component-path]"
allowed-tools: Read, Glob, Grep, Bash
---

# UI Validate

Review against `CLAUDE.md` and the `shadcn-ui` / `component-design` skills. Read-only: report,
don't fix unless asked. Deeper passes: `tailwind-audit` (incl. colour), `icon-audit`, `a11y`.

## Checklist

### 1. Design system

- [ ] Colours are semantic / `brand-*` tokens — no palette classes (`text-gray-*`, `bg-white`), no
      arbitrary hex, no `[var(--token)]` where a `@theme inline` alias exists
- [ ] Only the font weights the project ships (default 400/500/600 — no `font-bold`)
- [ ] Ending actions (delete/remove/revoke/leave) use `end-action` (`variant="destructive"` or
      `text-end-action hover:bg-end-action-tint`); `destructive` red only for errors
- [ ] Bordered controls show focus by border recolour — no halo `ring-3`/`ring-[3px]`, no `outline-offset-*`
- [ ] No unsanctioned edit in `src/components/ui/` (only the ⚠️ list in `shadcn-ui`); primitive
      parts restyled via `data-slot` selectors from the wrapper, not by editing the file
- [ ] No `@radix-ui/react-*` imports and no `unstable_*` Radix parts in app code
- [ ] Scale classes over arbitrary px (`h-[40px]` → `h-10`, `text-[14px]` → `text-sm`)
- [ ] Right source: primitives from `@/components/ui/*`, building blocks from `@/components/shared`,
      shell/composites from `@/components/common/<Name>`; no `shared/` file imports `@/features/*`

### 2. App patterns

- [ ] Page uses `PageHeader` (`title`, `subtitle?`, `actions?`); padding comes from `PageContent`
- [ ] Async content has a `<Skeleton>` matching the final shape; empty data uses `EmptyState`
      (or the `empty` primitive it wraps — not both); busy buttons use one labelled spinner
- [ ] Forms use `FormField` (built on the `field` primitive) + react-hook-form + `zodResolver`;
      prefixed/suffixed inputs use `input-group`; mutations toast via sonner in the hook
- [ ] Confirmations use `ConfirmDialog`
- [ ] React 19.3 idioms: `ref` as a prop (no new HOC wrappers); keep-mounted tabs/steps use
      `<Activity>` rather than hand-rolled `hidden` toggles; effect-called handlers use
      `useEffectEvent`, never listed in deps; no new `useMemo`/`useCallback` without a profile

### 3. Dialogs, sheets, menus

- [ ] Cancel is `<DialogClose asChild>`, not `onOpenChange(false)`
- [ ] Corner ✕ present — no `showCloseButton={false}` outright, no hand-drawn ✕
- [ ] If a destructive action is the first tabbable, `onOpenAutoFocus` focuses the container
- [ ] Menu item that opens a dialog uses `afterMenuCloses` (or the menu is `modal={false}`)
- [ ] One pop-up at a time: self-opening prompts use `useModalTurn`; form-tool pickers pass
      `returnOnDismiss`; no modal built on `radix-ui` outside `components/ui/`
- [ ] A dialog/menu that must not reappear on Back is closed explicitly (Next.js 16 keeps visited
      routes mounted, so open state can survive navigation)

### 4. Responsive

- [ ] Works at 375px with no horizontal page scroll; wide tables scroll inside their own wrapper
- [ ] Overrides on `className`-taking components written `max-md:`, not a `md:` pair
- [ ] Tap targets ≥ 44px below `md`
- [ ] Action rows wrap on phones (shrink-0 buttons otherwise overflow and clip)
- [ ] No `leading-none` together with `truncate`/`line-clamp-*` (clips descenders)

### 5. Accessibility

- [ ] Icon-only buttons have `aria-label`; decorative icons stay unlabelled (lucide 1.x sets
      `aria-hidden` by default; an `aria-*`, `role` or `title` prop un-hides it)
- [ ] **Visible label inside the accessible name** (WCAG 2.5.3; axe 4.14 runs
      `label-content-name-mismatch` by default): a button showing "Save" must not carry
      `aria-label="Submit form"`. Prefer no `aria-label` on a button with visible text; if you need
      more context, start the label with the visible words (`aria-label="Save draft"`) or use
      `aria-describedby`
- [ ] Tab lists have an accessible name (`aria-label`/`aria-labelledby` on `TabsList`) — axe flags
      unnamed ARIA tabs; no deprecated ARIA attributes (axe reports them for review)
- [ ] One `h1` (from `PageHeader`), then h2 → h3 in order
- [ ] Images have meaningful `alt` (or `alt=""` when the name sits beside them)
- [ ] Focus visible on every interactive element
- [ ] Contrast meets WCAG 2.2 AA (4.5:1 text, 3:1 large text / UI) against the actual token values
- [ ] Dialogs without a description pass `aria-describedby={undefined}`

## Process

1. Read the target and its siblings in the same folder (consistency)
2. Run the checklist; grep for the mechanical items
3. Run `yarn vitest run src/styles src/architecture.test.ts` — the guards catch several rules above
4. If the screen is reachable in E2E, run an axe pass with `@axe-core/playwright`
   (`await new AxeBuilder({ page }).include("main").analyze()`, tags `wcag2a`, `wcag2aa`, …) and
   treat `label-content-name-mismatch` findings as real issues, not noise
5. Report by priority with exact fixes

## Output

```markdown
## UI Validation: <ComponentName>

### Passing
- …

### Issues
**Critical** (rule/guard violations, a11y blockers)
1. `file:line` — problem → fix

**Minor**
1. `file:line` — problem → fix
```
