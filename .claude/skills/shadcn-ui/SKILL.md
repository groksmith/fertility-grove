---
name: shadcn-ui
description: shadcn/ui primitives in src/components/ui — shadcn CLI 4.2x on a Radix preset (`init -b radix -p nova`, add then format), the ⚠️ sanctioned edits, newer primitives (field, input-group, empty, spinner), `max-md` overrides, the end-action button/menu variants, Dialog/Sheet/DropdownMenu (corner ✕, DialogClose asChild, one pop-up at a time). Use when installing or editing a primitive in src/components/ui or building a dialog/sheet/menu; the colour and focus styling of a control used in a page is `tailwind-css-patterns`.
allowed-tools: Read, Write, Bash, Edit, Glob, Grep
---

# shadcn/ui primitives

`CLAUDE.md` is authoritative; this skill expands its **sanctioned edits** and **UI rules** lines. Where upstream
shadcn docs or a vendored skill disagree, this file and CLAUDE.md win. Tier placement for anything
that is not a primitive: `component-design`.

## Baseline (Nov 2026) — verify against package.json

| | |
|---|---|
| CLI | **shadcn CLI 4.2x** (`npx shadcn@latest …`). `diff` is deprecated; `add <name> --diff` previews upstream, but review against git after `yarn format` (Rule 1) |
| Library | **Radix** via the unified **`radix-ui` 1.8** package. The CLI's default base is **Base UI** (since July 2026); this kit assumes Radix — **Default — change if your project differs**, and know that switching base invalidates the Radix-specific guidance below (`asChild`, `onOpenAutoFocus`, `data-state`) |
| Imports | `import { Dialog as DialogPrimitive } from "radix-ui"` — or the per-primitive entry `from "radix-ui/dialog"` (1.8). No `@radix-ui/react-*` packages; nothing outside `components/ui/` imports `radix-ui` |
| Config | `components.json` — style is a **Radix preset**, e.g. `radix-nova` (`init -p nova`; `init` no longer offers `new-york`), `rsc: true`, `iconLibrary: lucide`, `tailwind.config: ""` (Tailwind v4, CSS-first). `style`, `baseColor`, `cssVariables` can't change after init. **Class strings differ per preset** (nova's destructive button is `bg-destructive/10 text-destructive`, new-york's `bg-destructive text-white`), so re-check the guards' `PRIMITIVE_EXPECTATIONS` after init |
| React | **19.3** — primitives take `ref` as a prop (`React.ComponentProps<typeof X.Root>`); every part carries **`data-slot`** |
| `cn` | CLI 4.2x inits with the **`cn` package** (one engine replacing clsx + tailwind-merge): every primitive does `import { cn } from "cn"`, and `src/lib/utils.ts` re-exports it for app code (kit `templates/src/lib/utils.ts`). Keep that — never add a tailwind-merge wrapper beside it, or two merge engines ship. Plain colour tokens (`text-brand-text` vs `text-foreground`) already merge; `p-(--x)` / `bg-(--brand)` merge correctly |
| Theme | `src/styles/theme.css` — tokens bridged with `@theme inline`, imported by `globals.css` after `tailwindcss`, `tw-animate-css` (1.4) and **`shadcn/tailwind.css`** (the `data-open` / `data-closed` / `data-checked` variants and accordion keyframes every preset primitive uses — keep `shadcn` in `dependencies`; dropping the import loses them silently). No `tailwind.config.*` |
| Toasts | Sonner 2: `import { toast } from "sonner"`; `<Toaster>` from `@/components/ui/sonner` mounted once. `add sonner` writes `useTheme` from `next-themes`: a light-only app drops it and passes `theme="light"` (a sanctioned edit), else a dark-mode OS gets dark toasts. Never add shadcn's own toast (Base UI only) — see `ask-sonner` |

## Setting up shadcn in a fresh Next.js 16 + Tailwind v4 project

1. Tailwind v4 first: `yarn add tailwindcss @tailwindcss/postcss`, `postcss.config.mjs` with
   `@tailwindcss/postcss`, and `src/app/globals.css` starting `@import "tailwindcss";` (the kit
   README step 0 swaps create-next-app's `@tailwindcss/turbopack` for this).
2. `npx shadcn@latest init -t next -b radix -p nova -y --no-monorepo` — **`-b radix`** or it
   scaffolds Base UI, and **`-p <preset>`** or it stops at an interactive preset prompt (an agent's
   run hangs). It writes `components.json` (`"style": "radix-nova"`), installs `cn` and `shadcn`,
   writes `src/lib/utils.ts` and the base token block. Move the tokens into `src/styles/theme.css`,
   keep `globals.css` to its imports (kit `templates/src/app/globals.css`), and rewrite init's
   `@layer base { … @apply … }` with `var()` (see `tailwind-css-patterns`).
3. Check `components.json`: `"tailwind": { "config": "", "css": "src/app/globals.css", "cssVariables": true }`,
   aliases `@/components/ui`, `@/lib/utils`, `@/hooks`.
4. Add primitives as you need them: `npx shadcn@latest add button dialog input label …`.
   Look one up first with `npx shadcn@latest view <name>` / `docs <name>`.
5. Optional, for agents: `npx shadcn@latest mcp init --client claude` registers the shadcn MCP
   server (browse/search registries from the session).
6. `yarn add sonner lucide-react` and mount `<Toaster>` once.

### Migrations the CLI ships (`npx shadcn@latest migrate --list`)

- **`migrate radix`** — rewrites `@radix-ui/react-*` imports to the unified `radix-ui` package. Run
  it once on an older project so there is one Radix package.
- **`migrate icons`** — swaps the icon library across primitives.
- **`migrate cn`** — for a project inited before CLI 4.2x: moves `cn` to the `cn` package and drops
  `clsx`/`tailwind-merge`. It rewrites **every** primitive's import, so it touches every sanctioned
  file: a deliberate decision, re-check the ⚠️ hunks afterwards. Either way, end with one engine.

### Newer primitives — check before building your own

`field`, `input-group`, `empty`, `spinner` (plus `kbd`, `button-group`, `item`). They overlap common
shared components:

| Primitive | Overlaps | Default |
|---|---|---|
| `field` | label + control + description + error layout | Build `FormField` on it (`forms`) instead of hand-rolled wrappers |
| `input-group` | input with prefix/suffix icon or button | Use it for search boxes, password reveal, unit suffixes |
| `empty` | `EmptyState` | Build `EmptyState` on it, or keep yours — not both |
| `spinner` | ad-hoc `animate-spin` icons | One busy indicator, labelled (`aria-label` / visually hidden text) |

If one of these already exists in `shared/`, migrate deliberately; never end up with two.

## Rule 1 — `components/ui/` is wrapped, not edited (except a maintained, sanctioned list)

Compose around primitives; project behaviour goes in `components/shared/` or `components/common/`.
The rare edit that **must** live in the primitive (because every call site needs it and a wrapper
can't reach it) is **sanctioned**: it carries a `⚠️` comment at the edit site saying why, and it is
listed in the table below and in CLAUDE.md.

**Default — change if your project differs.** Typical sanctioned groups:

| Group | Files (example) | What changed |
|---|---|---|
| Form-control type scale | `button`, `input`, `label`, `select`, `textarea` | Field/label sizes every form must share |
| Touch targets / viewport overflow | `button`, `checkbox`, `dialog`, `popover`, `select`, `sheet`, `tabs`, … | 44px floor below `md` (`max-md:min-h-11`, `icon` → `max-md:size-11`); `max-h` + `overflow-y-auto` on `DialogContent`/`PopoverContent`/bottom `Sheet` |
| No double outlines | `badge`, `button`, `checkbox`, `field`, `input`, `radio-group`, `select`, `tabs`, `textarea`, … | `focus-visible:border-ring focus-visible:ring-0`; `field`'s choice card drops `has-[:focus-visible]:ring-3` (Rule 2) |
| End-action variant | `button`, `dropdown-menu` | `destructive` variant paints `end-action` (Rule 4) |
| Modal layer | `dialog`, `sheet` | Roots run `useModalLayer` (one pop-up at a time) |
| Indeterminate checkbox | `checkbox` | `MinusIcon` on `data-state=indeterminate` |
| Light only | `sonner` | No `next-themes`; `theme="light"` |

Reference: kit `templates/src/components/ui/` has the radix-nova primitives (shadcn 4.23) with the
no-double-outline, end-action, modal-layer and light-only edits applied, each `⚠️`-commented.

Project list (keep current): `none — this project has no `components/ui` (its primitives live in `components/shared`)`

- **Don't revert them or "tidy" the `⚠️` comments** — they are the record of why.
- **Primitives are formatted like the rest of `src/`** (Biome: semicolons, sorted imports). Stock
  CLI output fails that and a few lint rules, so: `add`, then **`yarn format` immediately**, then
  review against git — `git diff src/components/ui/<file>` — not `add --diff`, which would show every
  line as changed. Three rules stock primitives trip (`useSemanticElements`, `noDoubleEquals`,
  `noArrayIndexKey`) are off for `src/components/ui/**` in `biome.json`; if a new primitive trips
  another, add it to that override — never edit the primitive just to please lint.
- **Before overwriting an existing file**, commit or stash first, `add <name> --overwrite`,
  `yarn format`, then `git diff` and restore every `⚠️` hunk (`git checkout -p` / re-apply by hand).
  Re-run the guard tests.
- **The list doesn't grow casually.** A new edit needs a `⚠️` comment saying why a wrapper couldn't
  do it, plus a line here and in CLAUDE.md.
- **Style through `data-slot`, not by editing.** Every part has `data-slot="…"`; a wrapper or a
  parent can target it (`[&_[data-slot=card-header]]:gap-1`, `has-data-[slot=…]:`) without
  touching the primitive. Keep `data-slot` when you wrap.
- Keep `unstable_*` Radix parts (OTP field, password toggle, Select composition parts) out of
  production code unless the project has decided to accept the churn.

## Rule 2 — focus: no double outlines on a bordered control

A control that already draws a border shows focus by **recolouring that border**
(`focus-visible:border-ring focus-visible:ring-0`), not by adding a halo ring around it. Not a ban
on `ring-*`: things with no border of their own (skip link, nav items, the dialog corner ✕, calendar
day cells) keep an ordinary `focus-visible:ring-2`. Banned: halo rings around a border
(`ring-3` / `ring-[3px]` under a focus variant) and `outline-offset-*`. Freshly added primitives
ship the upstream halo — strip it as part of the sanctioned edit.
Guard: `src/styles/no-double-outlines.test.ts`.

## Rule 3 — mobile overrides are `max-md:`, never a mobile-first `md:` pair

When a call site passes the same property, tailwind-merge drops the **unprefixed** half and keeps the
`md:` half, which then wins on desktop (still true in tailwind-merge 3):

```
twMerge("min-h-11 md:min-h-10 min-h-11")  →  "md:min-h-10 min-h-11"   // 44px becomes 40px at ≥md
twMerge("px-4 md:px-6 p-0")               →  "md:px-6 p-0"            // a `p-0` call site regains padding
```

So in anything that accepts `className`, write the phone value as `max-md:` (emits nothing above the
breakpoint). Responsive **padding** that a call-site `p-0` must still beat goes through one utility
reading a variable: `py-(--card-padding-y)` with `[--card-padding-y:1rem] md:[--card-padding-y:1.5rem]`
on the element; call sites re-tune the variable, not `md:px-*`.

## Rule 4 — actions that end something are not error red

**Default — change if your project differs.** Delete, remove, revoke, leave use the `end-action`
token; red (`destructive`) means something went **wrong** (validation, failed request).

- `<Button variant="destructive">` → `bg-end-action text-white hover:bg-end-action-hover`.
- `<DropdownMenuItem variant="destructive">` → `text-end-action focus:bg-end-action-tint`.
- Ad-hoc ghost/icon action → `text-end-action hover:bg-end-action-tint`.
- A status `Badge` variant `destructive` stays red — it reports, it doesn't act.

Guard: `src/styles/destructive-actions.test.ts` (bans `hover:text-destructive`,
`hover:bg-destructive/…` and a solid red fill with light text on actions; its `lacks` lists must be
your preset's original destructive strings).

## Dialogs and sheets

### Every dialog shows the primitive's corner ✕

- Never `showCloseButton={false}` outright; a dialog sealed while its own request runs passes a
  condition (`showCloseButton={!isPending}`). Never draw a second ✕. Guard:
  `src/styles/dialog-close.test.ts`.
- A dialog whose only answer is one destructive action drops its footer *Close* and lets the ✕ carry
  leaving — never the reverse.
- **Then fix opening focus.** The ✕ renders after `children`, so a destructive button may become the
  first tabbable and Radix focuses it — Enter would fire it. Focus the container instead:

  ```tsx
  <DialogContent
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      (event.currentTarget as HTMLElement | null)?.focus();
    }}
  >
  ```
- Give `DialogTitle` end padding so a long title clears the ✕.
- No `DialogDescription`? Pass `aria-describedby={undefined}` to `DialogContent`.
- A dialog nested in a form renders **outside** the `<form>`.
- **Open state can outlive navigation.** Next.js 16 keeps a few visited routes mounted (React
  `<Activity mode="hidden">`), so a dialog or menu left open can reappear on Back. If that is wrong
  for a flow, close it on success/navigation rather than relying on unmount.

### Cancel is `DialogClose asChild`

```tsx
<DialogFooter>
  <DialogClose asChild>
    <Button variant="outline">Cancel</Button>
  </DialogClose>
  <Button onClick={confirm}>Save</Button>
</DialogFooter>
```

Not `onClick={() => onOpenChange(false)}` — the layer (below) can only tell a user dismissal from an
app close when Cancel goes through Radix.

### One pop-up at a time

Never a pop-up over a pop-up. Provide `useModalLayer` (e.g. `src/hooks/useModalLayer.tsx`) and call
it from the `Dialog` and `Sheet` **roots** (a sanctioned edit), so every modal joins one stack.

Behaviour:

- A pop-up that opens while another is up — nested in it or mounted beside it — **hands over**: the
  covered one is hidden (kept mounted, so nothing typed is lost) and only the bottom one's backdrop
  dims.
- **The user** closing the top one (✕, Escape, outside click, a `DialogClose`) closes the whole
  stack. **The app** closing it (`open` → false after a confirm succeeds) brings the one below back.
- A picker that is a tool of its form passes **`returnOnDismiss`** so dismissing it returns to the
  form instead of closing everything.
- A prompt that opens on its own (timer, refetch) gates on **`useModalTurn(wanted)`** and waits
  until nothing else is open.
- Never build a modal on `radix-ui` directly outside `components/ui/` — it would skip the layer.

Implementation: kit `templates/src/hooks/useModalLayer.tsx` (`useModalLayer`, `useModalTurn`,
`ModalLayerProvider`, `useModalLayerState`) with its behaviour test `useModalLayer.test.tsx`. Ids
come from `useId`; the store snapshot is the ids joined in stack order (a `stack.length` snapshot
can't see a same-length swap). The root wiring — the same in `sheet.tsx` (full files in
`templates/src/components/ui/`):

```tsx
// src/components/ui/dialog.tsx — ⚠️ SANCTIONED EDIT (modal layer)
function Dialog({ open: openProp, defaultOpen, onOpenChange, returnOnDismiss, ...props }:
  React.ComponentProps<typeof DialogPrimitive.Root> & { returnOnDismiss?: boolean }) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const open = openProp ?? uncontrolledOpen;                 // uncontrolled <Dialog> still works
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const layer = useModalLayer(open, setOpen, { returnOnDismiss });
  return (
    <ModalLayerProvider value={layer}>
      <DialogPrimitive.Root data-slot="dialog" open={open} {...props}
        onOpenChange={(next) => (next ? setOpen(true) : layer.dismiss())} />  {/* user close → dismiss */}
    </ModalLayerProvider>
  );
}
// DialogContent: const { covered } = useModalLayerState(); data-covered={covered || undefined}
//   plus `data-covered:hidden` in its classes (stays mounted, hidden).
// DialogOverlay: const { stacked } = useModalLayerState(); stacked → `bg-transparent`, no animation.
```

`useEffectEvent` (React 19.2+) is for event-like logic *inside* an effect (e.g. logging which dialog
opened); it must not be stored and called from elsewhere, which is why the sketch uses a ref.
Don't hide a covered modal with `<Activity mode="hidden">` — that destroys its effects (focus trap,
scroll lock) while it waits; keep it mounted and visually hidden via `data-covered`.

Guard: `src/styles/one-popup-at-a-time.test.ts`; behaviour tests next to the hook.

### Opening a dialog from a dropdown-menu item

A modal menu sets `pointer-events: none` on `<body>` until its exit animation ends; a dialog mounted
in the same tick can strand that lock and the page stops answering clicks. Defer the open until the
menu has closed — provide a tiny helper (e.g. `src/lib/menu.ts`):

```ts
export function afterMenuCloses(fn: () => void) {
  requestAnimationFrame(() => setTimeout(fn, 0));
}
```

```tsx
<DropdownMenuItem onSelect={() => afterMenuCloses(() => setEditOpen(true))}>Edit</DropdownMenuItem>
```

Or make that menu `modal={false}`.

### Confirmations

Provide a shared `ConfirmDialog` (`open`, `onOpenChange`, `title`, `description?`, `confirmLabel?`,
`destructive?`, `onConfirm` (may be async; keep the dialog open on rejection), `isPending?`) and use
it everywhere — kit `templates/src/components/shared/ConfirmDialog.tsx` (container focus on open,
`showCloseButton={!busy}`, Cancel as `DialogClose asChild`). Add a typed-phrase variant for
irreversible actions. You rarely need `alert-dialog`.

## Composing primitives

- **Wrap, don't fork.** `Tip` wraps `tooltip`; `FormField` wraps `field` + `input`/`select`;
  `DatePicker` wraps `popover` + `calendar`. Pass `className` through `cn()`; keep `data-slot`.
- **`ref` is a prop.** Wrappers type props as `React.ComponentProps<typeof Primitive>` and pass `ref`
  through like any other prop — no wrapper HOC.
- **Keep-mounted panels**: tabs or wizard steps whose state must survive switching can render inside
  `<Activity mode={active ? "visible" : "hidden"}>` instead of `active && <Panel/>` (React 19.2+).
  Hidden content stays in the DOM with `display:none` and its effects are torn down — pause media in
  a cleanup. Radix `TabsContent` with `forceMount` is the alternative when you need Radix's own state.
- **Compound APIs / avoiding boolean-prop sprawl**: `composition-patterns`.
- **`asChild`** to put trigger behaviour on `Button` or a `Link` instead of nesting interactive elements.
- **Forms**: `FormField` (on `field`) + react-hook-form + `zodResolver` — see `forms`.
- **Icons**: `lucide-react` named `…Icon` imports sized with `size-*`; decorative by default
  (`icon-audit`).
- **Colours**: semantic / `brand-*` tokens only (`tailwind-audit`). **Weights**: only those the font ships.
- **Memoisation**: no new `useMemo`/`useCallback`/`React.memo` in a wrapper without a profile; the
  React Compiler (if enabled) handles it.

## Checklist before handing back

- [ ] No unsanctioned edit in `src/components/ui/`; any re-add formatted, reviewed with `git diff`, ⚠️ hunks restored
- [ ] Any `init` pinned `-b radix -p <preset>`; no `@radix-ui/react-*` left; no `unstable_*` parts in app code
- [ ] A new/updated primitive formatted (`yarn format`) and reviewed with `git diff`; one `cn` engine
- [ ] Phone overrides as `max-md:`; responsive padding via a variable
- [ ] Cancel is `DialogClose asChild`; corner ✕ untouched; focus not pre-landed on a destructive button
- [ ] Menu item → dialog goes through `afterMenuCloses` (or `modal={false}`)
- [ ] Ending actions use `end-action`, errors `destructive`; bordered controls have no halo ring
- [ ] `yarn typecheck && yarn lint && yarn test` exit 0 (guards included) — check exit codes
