---
name: component-design
description: Decide where a new component lives (ui / shared / common / icons / route-private), check what already exists before building, and write it with the project's semantic tokens, allowed font weights and React 19.3 idioms (ref as a prop, `<Activity>`, `useEffectEvent`). Use when creating, moving or promoting a component in a Next.js 16 App Router + shadcn/ui (CLI 4, Radix) project.
argument-hint: "[component-name]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Component Design

`CLAUDE.md` (Architecture → directory tree, Dependency flow) is authoritative; the tier table lives here. Primitive rules —
sanctioned `components/ui/` edits, dialogs, end-action colour, `max-md:` — are in `shadcn-ui`.
Compound-component / prop-API design: `composition-patterns`.

Baseline (Nov 2026) — verify against package.json: next 16.4, react 19.3, tailwindcss 4.3,
`cn` (shadcn's class merger), shadcn CLI 4.2x on radix-ui 1.8, lucide-react 1.66, Node ≥ 22.22.

## Tier decision

| Tier | Location | When | Import |
|---|---|---|---|
| `ui/` | `components/ui/` | shadcn primitive — untouched except the sanctioned ⚠️ edits | Direct path |
| `shared/` | `components/shared/` | Reusable, **no domain knowledge** — imports no `@/features/*` (`ConfirmDialog`, `EmptyState`, `FormField`, `DatePicker`) | Barrel `@/components/shared` |
| `common/` | `components/common/` | Shell pieces and app-level composites used by several routes that need feature hooks (`PageHeader`, `AppShell`, `ReauthPrompt`, `InviteMemberDialog`) | Direct path |
| `common/<flow>/` | e.g. `common/two-factor/`, `common/checkout/` | A multi-file flow the shell or several routes mount — can't be route-private because `components/` may not import `app/` | Direct path, file by file |
| `icons/` | `components/icons/` | Authored SVG icon, only when no lucide glyph fits. Leaf: imports only React and lucide types | Direct path (`config/` may import it) |
| Route-private | `app/<route>/_components/` | Used by one route (`app/(dashboard)/orders/_components/OrderRow.tsx`) | Local |

Rules (enforced by `src/architecture.test.ts` — fix a failure by moving code, not widening the table):

- `shared/` → ui, icons, lib, config, hooks, types. **Needs a feature hook? It belongs in `common/`.**
- `common/` → may also import features and shared.
- Start route-private; promote when a second route needs it. Don't pre-promote.
- Authored icons follow lucide's idiom: 24px box, `fill="none"`, `stroke="currentColor"`, 2px round
  strokes, honour `size`, `aria-hidden` unless labelled (`icon-audit`). Lucide 1.x ships no brand
  icons — brand marks come from `simple-icons` or an authored SVG. Migration note: lucide's own
  `LucideIcon` type is still declared with `forwardRef`, so an authored icon that must satisfy that
  type (e.g. a nav config typed `LucideIcon`) may keep `forwardRef<SVGSVGElement, LucideProps>` —
  the **one** exception. Everything else takes `ref` as a prop.

## Check before building

1. `src/components/shared/index.ts` — the barrel lists every shared building block.
2. `ls src/components/common` — shell and composites.
3. `ls src/components/ui` — installed primitives; compose before installing (`shadcn-ui`). The
   CLI 4 primitives cover a lot of former custom work: **`field`** (label + control + description +
   error — the base for `FormField`, see `forms`), **`input-group`** (input with prefix/suffix),
   **`empty`** (empty states — the base for `EmptyState`), **`spinner`** (busy indicator). Browse with
   `npx shadcn@latest view <name>`; add with `add`, then `yarn format` and review with `git diff` (`shadcn-ui` Rule 1).
4. Sibling routes' `_components/` — something close may be waiting for promotion.

Most screens are composition. A component that pulls a heavy client graph (maps, editors, charts)
stays out of the barrel and is imported by path, usually through `next/dynamic` (`perf`).

## Design system

- **Colour**: semantic tokens only — `text-foreground`, `text-muted-foreground`, `bg-background`,
  `bg-card`, `bg-muted`, `border-border`, `bg-primary text-primary-foreground`, and the `brand-*`
  family (`text-brand-text`, `border-brand-border`, `bg-brand-accent`). Values live in
  `src/styles/theme.css`. No palette classes, no arbitrary hex, no `bg-[var(--token)]` when a
  `@theme inline` alias exists (`tailwind-audit`).
- **Actions that end something** (delete/remove/revoke/leave): `variant="destructive"` (painted
  `end-action`) or `text-end-action hover:bg-end-action-tint`. `destructive` red = errors only.
  **Default — change if your project differs.**
- **Type**: `Instrument Sans`, and only the weights the font files ship — **Default: 400/500/600**,
  `font-semibold` ceiling, never `font-bold` (renders faux). Page title from `PageHeader`; section
  heading `text-lg font-semibold`; description `text-sm text-muted-foreground`.
- **Surfaces**: prefer `<Card>`; it owns responsive padding via a CSS variable — re-tune with
  `[--card-padding-x:…]`, not `md:px-*`.
- **Responsive**: page padding comes from `PageContent`; mobile overrides on anything taking
  `className` are `max-md:` (`shadcn-ui` rule 3); `@container` for component-level layout.
- **Scale classes over arbitrary values**: `min-h-[140px]` → `min-h-35`, `h-[40px]` → `h-10`,
  `text-[14px]` → `text-sm`, `rounded-[12px]` → `rounded-xl`. Arbitrary only for genuinely
  off-scale numbers (`tailwind-css-patterns`).
- **Icons**: `lucide-react` `…Icon` named imports sized with `size-*`; decorative by default
  (lucide 1.x sets `aria-hidden`), labelled when standalone (`icon-audit`).
- **Styling a primitive's part** from outside: target its `data-slot`
  (`[&_[data-slot=card-title]]:text-base`), never edit the primitive.
- **Fonts**: `Instrument Sans` via `next/font/google` (any Google font, including Google Sans on
  Next 16) or `next/font/local`.

## Template

```tsx
"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SummaryRowProps extends ComponentProps<"section"> {
  title: string;
  onAction?: () => void;
}

// React 19: `ref` arrives in props like any other (ComponentProps<"section"> includes it) — no wrapper HOC.
export function SummaryRow({ title, onAction, className, ref, ...props }: SummaryRowProps) {
  return (
    <section
      ref={ref}
      className={cn("flex items-center justify-between gap-4", className)}
      {...props}
    >
      <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
      {onAction ? (
        <Button size="sm" onClick={onAction}>
          Open
        </Button>
      ) : null}
    </section>
  );
}
```

Add `"use client"` only when the component itself uses state, effects, handlers or browser APIs;
otherwise leave it a Server Component.

## State and React 19.3 idioms

- Local UI → `useState`; forms → react-hook-form + `zodResolver` (`forms`)
- Server data → TanStack Query hooks from a feature barrel (`tanstack`)
- No global store unless CLAUDE.md says otherwise
- **Keep-mounted panels** (tabs, wizard steps, a collapsible side panel whose input must survive):
  `<Activity mode={open ? "visible" : "hidden"}>` instead of `open && <Panel/>`. Hidden content stays
  in the DOM (`display:none`), its effects are torn down and re-run on show. Don't use it for modals
  (it would drop their focus trap) — `shadcn-ui` → one pop-up at a time.
- **Event-like logic inside an effect** (log on open, call the latest `onChange` from a subscription):
  `useEffectEvent`, not a "latest value" ref. Never list it in deps, call it during render, or pass
  it to another component or hook.
- **Routes stay mounted.** Next.js 16 keeps a few visited routes alive in a hidden `<Activity>`:
  state and inputs survive Back, effects re-run. Don't assume unmount resets a component.
- **Memoisation**: no new `useMemo`/`useCallback`/`React.memo` without a profile showing the need —
  and none at all if the React Compiler is enabled (opt-in, `reactCompiler: true`).
- **Other React 19.2/19.3 APIs:** `<ViewTransition>` + `addTransitionType` (stable; animates only
  transitions, Suspense reveals and deferred values — `motion`), `cacheSignal()` (RSC only), and `ref`
  as a prop (no `forwardRef` in new code — see the one icon exception above).
- **Browser-only rendering**: `use(browser())` from `react-dom` (19.3) opts a component out of SSR —
  instead of a `mounted` state flag or a `typeof window` check. Heavy client graphs still load via
  `next/dynamic` (`perf`).

## After creating

1. Shared component → export it from `src/components/shared/index.ts` (unless it pulls a heavy
   client graph — then direct path)
2. Add a co-located `*.test.tsx` (`// @vitest-environment jsdom`, Testing Library + an axe assertion)
3. `yarn format`, then `yarn typecheck && yarn lint && yarn test` (includes the architecture and
   style guards) — check exit codes
4. `yarn build` (Next 16 dev writes `.next/dev`, so a build no longer clobbers a running dev server;
   use a separate `distDir` only if you still see that)
