---
name: icon-audit
description: Audit icon and image usage — lucide-react 1.x sizing and labelling (aria-hidden by default, LucideProvider, no brand icons), authored icons in components/icons, brand marks via simple-icons or authored SVG, next/image vs sanctioned plain <img> cases, alt text, and public/assets placement. Use when reviewing icons/images or adding one in a Next.js App Router project.
allowed-tools: Read, Glob, Grep, Bash
---

# Icon & Image Audit

Rules come from `CLAUDE.md` (Static assets, Dependency flow → `config/` and `icons/`).
Read-only: report `file:line` issues with fixes. Baseline (Nov 2026) — verify against package.json:
lucide-react 1.66, next 16.4.

## Icons

**Sources, in order of preference**

1. **`lucide-react`** — named `…Icon` imports (`XIcon`, `CheckIcon`, `MapPinIcon`). The only UI icon
   library. Each icon is also exported as `Foo` and `LucideFoo`; pick the `…Icon` form and stay
   consistent. Avoid `DynamicIcon` (`lucide-react/dynamic`) — it fetches each icon at runtime.
2. **`components/icons/`** — authored only when no lucide glyph fits. Lucide idiom: 24×24 box,
   `fill="none"`, `stroke="currentColor"`, 2px round strokes, honours `size`, `aria-hidden` unless
   labelled. Leaf file, imported by direct path. A `⚠️` header says why lucide couldn't.
3. **Brand marks** — lucide 1.x ships **no brand icons** (an old `GithubIcon`-style import fails
   after upgrading). Use `simple-icons` behind a shared component, or an authored SVG file under
   `public/assets/brands/`. Never hand-copy a brand SVG into a component.

**Legit inline `<svg>`** (not violations): third-party marks that must keep their own colours (e.g. an
OAuth sign-in button), data-driven graphics (progress rings, sparklines), and the app's own logo
component. Flag an inline `<svg>` only when a lucide glyph would do, or when it lacks
`aria-hidden`/a label. List your project's sanctioned ones here: ``components/art/Tree.tsx`, `components/common/AuthFrame.tsx` (the Google "G"), `components/common/AppShell.tsx`, `components/common/landing/Landing.tsx``.

**Sizing** — `size-*`, not `h-4 w-4` and not the `size` prop: `size-3`/`size-3.5` dense rows,
`size-4` default (buttons already size un-sized svgs), `size-5` nav and prominent buttons, `size-6`+
hero/empty-state. One size per context.

**Defaults** — app-wide stroke or size defaults go in one `LucideProvider` (it sets `size`, `color`,
`strokeWidth`, `nonScalingStroke`, `className`) near the root, not repeated per icon.
`absoluteStrokeWidth` is deprecated — use `nonScalingStroke`.

**Colour** — inherit `currentColor`, or a semantic token (`text-brand-accent`,
`text-muted-foreground`). Ending actions `text-end-action`. Never palette classes or hex.

**Accessibility** — lucide 1.x renders `aria-hidden="true"` by default; it drops it only when the
icon gets children, an `aria-*` prop, `role` or `title`. So a decorative icon needs nothing — a
hand-added `aria-hidden` is redundant (Low). An **icon-only button** needs `aria-label` on the
**button** (a tooltip alone is not a name), not on the svg. An icon that carries meaning on its own
(status) needs `aria-label`/`role="img"` on the icon, or adjacent text. A button with an icon **and**
visible text must not get an `aria-label` that differs from that text (axe 4.14
`label-content-name-mismatch`; see `ui-validate`). Authored icons in `components/icons/` should copy
the same default: hidden unless labelled.

## Images

**Placement** — every static image under `public/assets/<subfolder>/` (`brands/`, `images/`,
`illustrations/`, …). Nothing at `public/` root or in `src/`. Next file-convention files
(`src/app/icon.png`, `opengraph-image.tsx`, `favicon.ico`) are the exception.

**`next/image` by default**, with `width`/`height` (or `fill` + sized parent), meaningful `alt`
(`alt=""` when the name is printed beside it), `priority` only above the fold. Small fixed marks may
pass `unoptimized` (e.g. `.ico`, which the optimizer can't handle) — intended, not a finding.

**Sanctioned plain `<img>`** — only where `next/image` can't work, e.g. a same-origin proxy that
redirects to a third-party CDN, or user/operator-uploaded media of unknown size and origin. Record
them: `none`. Any other `<img>` is a finding.

## Scan commands

Quote `--include` globs (zsh expands them otherwise).

```bash
# Icon libraries other than lucide / your brand-icon package
grep -rnE "from \"(react-icons|@heroicons|@radix-ui/react-icons|@tabler)" src --include='*.tsx'

# Deprecated / slow lucide usage
grep -rnE "absoluteStrokeWidth|lucide-react/dynamic|DynamicIcon" src --include='*.tsx'

# Redundant aria-hidden on lucide icons (decorative is the default)
grep -rnE "<[A-Z][A-Za-z]*Icon[^>]*aria-hidden" src --include='*.tsx'

# Inline SVGs — review against the sanctioned list
grep -rln "<svg" src --include='*.tsx' | grep -v '\.test\.'

# Old sizing idiom
grep -rnE "\bh-([3-9]|1[0-2]) w-\1\b" src --include='*.tsx' | grep -i icon

# Plain <img> outside the sanctioned files
grep -rln "<img" src --include='*.tsx' | grep -v '\.test\.'

# next/image — inspect each for alt
grep -rn -A6 "<Image" src --include='*.tsx' | grep -v '\.test\.' | grep -c "alt="

# Images outside public/assets/<subfolder>/
find public -maxdepth 2 -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' -o -name '*.svg' \) -not -path 'public/assets/*/*'
find src -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' -o -name '*.svg' \) -not -path 'src/app/*'
```

## Output

```markdown
## Icon & Image Audit

**Critical** — `file:line` — missing alt / unlabelled icon-only button → fix
**Medium** — `file:line` — hand-drawn icon where lucide has one / stray asset → fix
**Low** — `file:line` — inconsistent size in one context → use `size-4`
```
