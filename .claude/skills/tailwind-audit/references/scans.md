# Scan commands

Reference for the `tailwind-audit` skill. Run after `biome check src/` (Step 0). The colour-only
scans with their notes are in `colour-deep-pass.md` → Scans.

```bash
# Arbitrary px spacing/sizing that should be on-scale
grep -rEn "\b(p|m|h|w|min-h|min-w|max-h|max-w|gap|space-[xy])([trblxy])?-\[[0-9]+px\]" src/

# Arbitrary CSS-variable colors that probably have a `@theme inline` alias
grep -rEn "(bg|text|border|ring|fill|stroke)-\[var\(--[a-z-]+\)\]" src/ --include="*.tsx"

# Arbitrary colour literals (hex / rgb / hsl / oklch)
grep -rEn "\[#[0-9A-Fa-f]{3,8}\]|\[(rgb|rgba|hsl|oklch)\(" src/ --include="*.tsx"

# Tailwind palette colors (forbidden — use semantic tokens)
grep -rEn "(text|bg|border|ring|outline|fill|stroke|from|via|to|divide|decoration)-(gray|red|blue|green|yellow|orange|amber|emerald|lime|teal|cyan|rose|pink|purple|fuchsia|indigo|violet|sky|slate|zinc|neutral|stone)-[0-9]" src/ --include="*.tsx"

# Arbitrary radius/border that maps to builtins (radius scale: 2/6/8/10/14/16/24px)
grep -rEn "rounded-\[(2|6|8|10|14|16|24)px\]|border-\[[124]px\]" src/

# Font weight above the loaded ceiling (default ceiling 600; comments mentioning it are fine)
grep -rEn "font-(bold|extrabold|black)" src/ --include="*.tsx"

# v3 leftovers
grep -rEn "bg-gradient-to-|bg-opacity-|text-opacity-|border-opacity-|flex-shrink-0|flex-grow-0" src/ --include="*.tsx"

# Deprecated v4.0 forms and hand-written utilities 4.3 now ships
grep -rEn '(^|[" :])-?(start|end)-[0-9]' src/ --include='*.tsx'
grep -rEn "::-webkit-scrollbar|scrollbar-width|@utility (tab|zoom|scrollbar)" src/ --include="*.css"

# Error red on actions that end something (inspect each hit)
grep -rEn "(Delete|Remove|Revoke|Leave)" src/ --include="*.tsx" | grep -E "destructive|text-red-"

# Double outline: a bordered control that also adds a focus ring
grep -rEn "border[^\"]*focus-visible:ring-[1-9]|focus-visible:ring-[1-9][^\"]*\bborder\b" src/ --include="*.tsx"
```
