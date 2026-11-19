# Colour deep pass

Reference for the `tailwind-audit` skill. The colour-specific part of the audit (merged from the
former `color-audit` skill). Run it whenever the audit is about colour, contrast or tokens.

## First line: Biome `noTailwindRawColors`

Biome 2.6 added the nursery rule **`noTailwindRawColors`**, which flags Tailwind palette colours in
class strings — exactly the "no palette colours in components" rule. Turn it on so CI catches the
common case before anyone audits:

`biome.json` (excerpt — `tailwindDirectives` is what lets `theme.css` parse):

```json
{
  "css": { "parser": { "tailwindDirectives": true } },
  "linter": {
    "rules": { "nursery": { "noTailwindRawColors": "error" } }
  }
}
```

It is a nursery rule: opt-in, and its options and coverage can change between minors — read its rule
page for your Biome version (and whether it needs the 2.6 top-level `tailwind.stylesheet` setting to
see your design system). Confirm it fires with a throwaway `text-gray-600` before relying on it.
What it does **not** replace — keep the greps below for: arbitrary literals (`bg-[#…]`, `[oklch(…)]`),
inline `style` colours, literals in hand-written CSS, `[var(--token)]` where an alias exists, and every
judgement call (error red on ending actions, fill colours as small text, untested contrast pairs).
Biome's `style/noInlineStyles` (promoted in 2.6) flags inline `style` props wholesale; if the project
enables it, inline colour styles surface there too.

## Approved tokens

Two families, both legitimate. Before flagging a class, check it exists as `--color-…` in
`@theme inline` (or as a hand-written utility in `@layer utilities` / `@utility`).

```
shadcn:   background foreground card(-foreground) popover(-foreground) primary(-foreground)
          secondary(-foreground) muted(-foreground) accent(-foreground) destructive(-foreground)
          border input ring chart-1…5
sidebar:  sidebar sidebar-foreground sidebar-primary(-foreground) sidebar-accent(-foreground)
          sidebar-border sidebar-ring
brand-*:  whatever the project bridges — typically text, text-muted, border, border-hover,
          accent, accent-hover, accent-text, warning(-text), notice-{bg,border,text},
          status-*-{bg,text}
end-action: end-action end-action-hover end-action-tint   (Default — change if your project differs)
```

Generate the live list rather than trusting this one:

```bash
grep -oE -- "--color-[a-z0-9-]+" src/styles/theme.css | sort -u
```

Graphic-only values (an SVG gradient stop) may live in `:root` unbridged on purpose — note them in a
comment so they aren't "fixed".

## Forbidden → fix

| Found | Fix |
|---|---|
| `text-[#0f3050]`, `bg-[#f1f6f8]`, `rgb()`, `hsl()`, `oklch()` in a component | the token with that value; no token → add one (`:root` + `@theme inline` + contrast case) |
| `text-gray-600` / `text-slate-500` | `text-muted-foreground` / `text-brand-text-muted` |
| `bg-gray-100` | `bg-muted` |
| `border-gray-200` | `border-border` / `border-brand-border` |
| `text-red-500` on an error | `text-destructive` |
| `bg-white` as a surface | `bg-card` (or `bg-background` if that is the intended surface) |
| `text-[var(--brand-text)]` | `text-brand-text` (an alias exists) |
| a fill colour (`text-primary`, `text-brand-accent`) as small body text or a link, where it fails 4.5:1 | its `-text` variant (`text-brand-accent-text`) |
| a "bright on dark" token on a light surface | dark surfaces only |
| `text-destructive` / `hover:bg-destructive/…` on leave/remove/delete/revoke | `text-end-action hover:bg-end-action-tint` or `<Button variant="destructive">` if that variant paints `end-action` — guard: `src/styles/destructive-actions.test.ts` |
| warning copy in a warning *fill* colour at small size | the warning `-text` token |

Tolerable: `text-white` on a saturated fill and `bg-white/10`-style washes on a dark bar. Prefer
`text-primary-foreground` / `text-sidebar-foreground` in new code. Categorical scales (status, chart)
may sit outside the brand palette on purpose — don't "fix" them to brand colours.

## Scans

Run after `biome check src/`; a palette hit here that Biome missed means the rule isn't enabled or
doesn't cover that class position (e.g. a class built in a helper) — report both.

```bash
# Arbitrary colour literals in classes
grep -rEn "\[#[0-9A-Fa-f]{3,8}\]|\[(rgb|rgba|hsl|hsla|oklch|oklab)\(" src/ --include="*.tsx" --include="*.ts"

# Tailwind palette colours
grep -rEn "(text|bg|border|ring|outline|fill|stroke|from|via|to|divide|decoration|shadow|accent|caret|text-shadow|drop-shadow|scrollbar-thumb|scrollbar-track)-(gray|red|blue|green|yellow|orange|amber|emerald|lime|teal|cyan|rose|pink|purple|fuchsia|indigo|violet|sky|slate|zinc|neutral|stone|mauve|olive|mist|taupe)-[0-9]" src/ --include="*.tsx"

# Inline colour styles
grep -rEn "style=\{\{[^}]*(color|background|fill|stroke|borderColor)" src/ --include="*.tsx"

# Colour literals in hand-written CSS outside theme.css
grep -rEn "#[0-9A-Fa-f]{3,8}\b|(rgb|hsl|oklch)\(" src/ --include="*.css" | grep -v "src/styles/theme.css"

# [var(--…)] colours that probably have a class alias
grep -rEn "(bg|text|border|ring|fill|stroke)-\[var\(--[a-z-]+\)\]" src/ --include="*.tsx"

# Error red on actions that end something (inspect each hit)
grep -rEn "(Delete|Remove|Revoke|Leave)" src/ --include="*.tsx" | grep -E "destructive|text-red-"
```

`theme.css` holds literal values by design — never flag it.

## Contrast

`src/styles/theme.test.ts` parses `theme.css` and asserts WCAG ratios for the text/surface pairs the
app relies on (4.5:1 text, 3:1 large text, UI boundaries and focus rings), and that no hand-written
utility duplicates a generated one. When the audit finds a new pairing in use (a token on a surface
it wasn't tested against), report it and add the case. If the project has dark mode, the test must
cover both value blocks.

## Semantic mapping

| Element | Token |
|---|---|
| Page background | `bg-background` |
| Card / dialog surface | `bg-card` |
| Body text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Borders | `border-border` |
| Primary button | `bg-primary text-primary-foreground` |
| Dark band (top bar / sidebar) | `bg-sidebar text-sidebar-foreground` |
| Actions that end something | `end-action` (`variant="destructive"`, `text-end-action`) |
| Errors | `text-destructive`, `border-destructive` — red is for errors only |
| Focus ring | `ring-ring` |

Colour-taking utilities added in Tailwind 4.1–4.3 follow the same rule: `text-shadow-<color>`,
`drop-shadow-<color>`, `scrollbar-thumb-<color>`, `scrollbar-track-<color>` take tokens only; add them to
the palette scan if the project uses them. The 4.2 stock palettes (`mauve`, `olive`, `mist`, `taupe`)
are palette colours like any other.

Translucent variants: the `/N` modifier (`bg-primary/10`) in markup, `color-mix(in srgb, var(--token)
N%, transparent)` in CSS.
