# Scale tables, v4 migrations, when arbitrary is right

Reference for the `tailwind-audit` skill (and for writing new classes). Conventions:
`tailwind-css-patterns`.

**Before writing an arbitrary value `class-[N]`, check if a builtin utility already covers it.** Tailwind v4 accepts **any positive number** (including fractionals) on its spacing-style scales — almost every px value has a builtin form. Arbitrary values `class-[N]` are an escape hatch for cases the scale system can't express, **not** for any value the author didn't memorize.

## Spacing / sizing / position — `p`, `m`, `gap`, `space-*`, `inset`, `top`/`right`/`bottom`/`left`, `h`, `w`, `min-h`, `min-w`, `max-h`, `max-w`

The scale step is **`0.25rem` (4px)** per unit, **and the unit accepts decimals**. So **any whole-px value is on-scale.**

**Conversion: `Npx ÷ 4 = scale-N` (decimals OK).**

| Wrong (arbitrary) | Right (scale) |
|---|---|
| `min-h-[140px]` | `min-h-35` (140 ÷ 4 = 35) |
| `h-[40px]` | `h-10` (40 ÷ 4 = 10) |
| `w-[200px]` | `w-50` |
| `p-[16px]` `gap-[8px]` `mt-[24px]` | `p-4` `gap-2` `mt-6` |
| `py-[7px]` | `py-1.75` (7 ÷ 4 = 1.75) |
| `py-[13px]` | `py-3.25` (13 ÷ 4 = 3.25) |
| `px-[14px]` | `px-3.5` (14 ÷ 4 = 3.5) |
| `min-h-[44px]` | `min-h-11` |
| `max-w-[1200px]` | `max-w-300` |
| `mt-[2px]` | `mt-0.5` |

## Border width — `border`

Whole pixels have integer scale; off-integer doesn't.

| Wrong | Right |
|---|---|
| `border-[1px]` | `border` |
| `border-[2px]` | `border-2` |
| `border-[4px]` | `border-4` |
| `border-[1.5px]` | *off-scale — keep arbitrary* |

## Border radius — `rounded`

**No numeric scale.** Use named tokens; arbitrary is fine for in-between values. **Default — change if your project differs:** shadcn's `theme.css` derives `--radius-sm…xl` from `--radius: 0.625rem` (10px) in `@theme inline`; the rest are Tailwind's stock values. Re-derive this table if your `--radius` differs:

| Token | Resolves to |
|---|---|
| `rounded-xs` | 2px (stock) |
| `rounded-sm` | 6px (`--radius − 4px`) |
| `rounded-md` | 8px (`--radius − 2px`) |
| `rounded-lg` | 10px (`--radius`) |
| `rounded-xl` | 14px (`--radius + 4px`) |
| `rounded-2xl` | 16px (stock) |
| `rounded-3xl` | 24px (stock) |

| Wrong | Right |
|---|---|
| `rounded-[6px]` | `rounded-sm` |
| `rounded-[8px]` | `rounded-md` |
| `rounded-[10px]` | `rounded-lg` |
| `rounded-[14px]` | `rounded-xl` |
| `rounded-[16px]` | `rounded-2xl` |
| `rounded-[24px]` | `rounded-3xl` |
| `rounded-[12px]`, `rounded-[20px]` | *off-scale — keep arbitrary* |

## Font size — `text`

**No numeric scale.** Use named tokens.

| Wrong | Right |
|---|---|
| `text-[12px]` | `text-xs` |
| `text-[14px]` | `text-sm` |
| `text-[16px]` | `text-base` |
| `text-[18px]` | `text-lg` |
| `text-[20px]` | `text-xl` |
| `text-[15px]`, `text-[0.65rem]` | *off-scale — keep arbitrary* |

## Transitions — `duration`, `delay`, `transition`

`duration-N` and `delay-N` accept **any positive integer (ms)** directly.

| Wrong | Right |
|---|---|
| `duration-[250ms]` | `duration-250` |
| `duration-[1000ms]` | `duration-1000` |
| `delay-[150ms]` | `delay-150` |
| `transition-[background,box-shadow]` | *no builtin shortcut for property lists — keep arbitrary, or use `transition-colors`/`transition-shadow` if it covers your use* |

## Line height & letter spacing

| Class | Numeric scale? | Notes |
|---|---|---|
| `leading-N` | **Yes** — `leading-N` = `0.25rem × N` (absolute: `leading-6` = 24px); also named (`leading-snug`, `leading-relaxed` — check `@theme` for project overrides) | Unitless ratios like `leading-[1.4]` have no scale form; keep arbitrary or use a named one |
| `tracking-N` | **No**, only named tokens (`tracking-tight`, `tracking-wide` — possibly project-tuned in `theme.css`) | Use named or arbitrary |

## Opacity — `opacity`, `bg-*/N`, `text-*/N`

Numeric scale **0–100** in steps of 1 (so `opacity-45` works, not just `opacity-50`).

## Tailwind v4 syntax migrations (legacy v3 patterns to fix)

The kit assumes Tailwind v4. Several syntactic patterns from v3 are still parsed but deprecated, broken, or have changed semantics:

### `!important` modifier — moved from prefix to suffix

| Wrong (v3 prefix) | Right (v4 suffix) |
|---|---|
| `!min-h-0` | `min-h-0!` |
| `!shadow-none` | `shadow-none!` |
| `hover:!bg-red-500` | `hover:bg-red-500!` |
| `hover:!shadow-none` | `hover:shadow-none!` |
| `md:!flex` | `md:flex!` |

The `!` goes at the **end** of the entire utility (after the value, before the closing brace if arbitrary). With variants like `hover:` / `md:` / `dark:`, the variant prefix stays where it is — only the `!` moves.

**Scan:**
```bash
# Tailwind classes with leading-! (variant or bare) — v3 syntax
grep -rEn '"\s*[^"]*(\b|:)![a-z]' src/ --include='*.tsx' | grep -vE '!=|! |!$'
```

(Filter out JS negation operators `!variable`, `!==`, etc.)

### `outline-none` — semantic change

In v3, `outline-none` set a *transparent* 2px outline (preserved focus visibility for high-contrast mode). In v4, it's literal `outline: none`.

- **Keep `outline-none`** when paired with a custom focus indicator (`focus-visible:ring-*`, `focus-visible:border-*`, etc.). This is the most common case.
- **Use `outline-hidden`** when the v3 behavior was load-bearing — i.e. you wanted the *invisible* outline for accessibility on systems that override `box-shadow`/`border` (forced-colors mode).
- If neither is true, `outline-none` is wrong even in v3 (it's an unannounced focus-removal).

### Other v4 housekeeping

- `flex-shrink-0` and `flex-grow-0` → `shrink-0` and `grow-0` (the long forms still work as aliases but the short form has been canonical since v3.4).
- `bg-opacity-N` / `text-opacity-N` / `border-opacity-N` → `bg-color/N` / `text-color/N` / `border-color/N` modifier syntax (`bg-black/50`).
- Renamed scale steps in v4: `shadow-sm` → `shadow-xs`, `shadow` → `shadow-sm`; same shift for `drop-shadow-*`, `blur-*`, `backdrop-blur-*` and `rounded-sm` → `rounded-xs`. If the project defines brand-tinted `shadow-brand-*` utilities, prefer them over stock grey shadows.
- `ring` is **1px** in v4 (was 3px) and defaults to `currentColor` — write `ring-2 ring-ring` explicitly.
- `bg-gradient-to-*` → `bg-linear-to-*`.
- `theme(…)` → `var(--token)`; avoid `@apply` (Default — change if your project differs).
- `w-[var(--x)]` may be written `w-(--x)`; tailwind-merge 3 groups both. Don't flag either.

### Deprecated or superseded within v4 (4.1–4.3)

- `start-*` / `end-*` → `inset-s-*` / `inset-e-*` (deprecated in 4.2, still work).
- `safelist` / hand-kept "keep these classes" files → `@source inline("…")` (4.1).
- Hand-written `::-webkit-scrollbar` / `scrollbar-width` utilities → `scrollbar-none` / `scrollbar-thin` /
  `scrollbar-thumb-*` (4.3). A hand-written utility that duplicates a generated one is a bug, not style.
- Custom `@utility tab-*` / `zoom-*` → built-ins (4.3).
- `cqb` / `cqh` read under a plain `@container` (inline-size) → the parent needs `@container-size` (4.3).
- tw-animate-css exit animations on elements that stay mounted, without `fill-mode-forwards` (1.3+
  defaults fill-mode to `none`, so they snap back). See `motion`.

## When arbitrary IS the right answer

- Off-scale design values copied verbatim from a prototype (`text-[0.65rem]`, `text-[13px]`, `tracking-[0.06em]`, `rounded-[12px]`).
- **Never** for colour: a colour with no token gets a token in `theme.css` (see `colour-deep-pass.md`), not `bg-[#…]`.
- CSS variables (`bg-[var(--brand-accent)]`) only when no `bg-brand-accent` alias exists in `@theme inline`.
- Computed gradients / shadows / multi-property transitions that don't have a utility shortcut.
- Custom `transition-property` lists: `transition-[border-color,box-shadow]` is fine — there's no `transition-borderwidth-and-shadow` shortcut.

**Rule of thumb test:** before you reach for `class-[N]`, divide by 4. If the result is any number (including `1.75`, `3.25`, `3.5`), the scale form exists. Only when the value can't be expressed as `0.25rem × N` is the arbitrary form correct.

When in doubt: try the scale class. Tailwind doesn't error on an unknown class — it just emits nothing — so confirm in the browser (or grep the built CSS) that the rule exists.
