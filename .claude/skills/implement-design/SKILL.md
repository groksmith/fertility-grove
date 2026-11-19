---
name: implement-design
description: Translates Figma designs into production-ready code that matches the design while staying inside the project's design system (semantic tokens, allowed font weights, shadcn primitives). Use when implementing UI from Figma files, when the user mentions "implement design", "build Figma design", "match the mock", provides Figma URLs, or asks to build components matching Figma specs. Requires the Figma MCP server.
metadata:
  mcp-server: figma
---

# Implement Design (Figma → code)

Figma tells you **layout, hierarchy, content and behaviour**. The design system tells you **colour,
type, radius, shadow, focus and component choice**. When they disagree, the system wins —
`CLAUDE.md` is the rulebook, and nothing from Figma (a hex, a font, a weight, a red delete button)
overrides it.

## Prerequisites

- Figma MCP tools are available (`get_design_context`, `get_metadata`, `get_screenshot`). If not, ask
  the user to enable the Figma MCP server and restart the client — don't guess from memory.
- A URL like `https://figma.com/design/:fileKey/:fileName?node-id=1-2` → `fileKey` is the segment
  after `/design/`, `nodeId` is `node-id` (`1-2`).

## Workflow

1. **Fetch context:** `get_design_context(fileKey, nodeId)`. If it's truncated, `get_metadata` for the
   node map, then `get_design_context` per child section.
2. **Fetch the reference:** `get_screenshot(fileKey, nodeId)` — the visual source of truth for
   checking. Mobile and desktop are both required; ask for the missing frame.
3. **Inventory before writing.** For each piece of the frame find what already exists:
   `components/ui/*`, the `components/shared` barrel (`FormField`, `ConfirmDialog`, `EmptyState`, …),
   `components/common` (`PageHeader`, `PageContent`, shell), a sibling route's `_components/`. Most
   screens are composition. Placement of anything new → `component-design`.
4. **Translate every value onto a token, don't paste.** The MCP output (React + Tailwind with literal
   values) is a description, not code. Build a small mapping table as you go:

   | Figma value | Becomes |
   |---|---|
   | `#1F2937` text | `text-foreground` (or `text-brand-text`) |
   | `#6B7280` text | `text-muted-foreground` |
   | `#E5E7EB` stroke | `border-border` |
   | brand fill | `bg-primary` / `bg-brand-accent` |
   | red "Delete" button | `variant="destructive"` (`end-action`) |
   | 16 / 24 / 32 px gaps | `gap-4` / `gap-6` / `gap-8` |
   | 12 px radius | `rounded-xl` |
   | Inter 700 | `Instrument Sans`, `font-semibold` |

   - **Colour** → the nearest semantic or `brand-*` token in `src/styles/theme.css`. No hex, no
     `text-[#…]`, no palette classes. No close token? Stop and propose one (below).
   - **Type** → the project font only (`Instrument Sans`, loaded once with `next/font/google` or
     `next/font/local`, global via `--font-sans`/`--font-heading`); only the weights it ships
     (default 400/500/600); hierarchy above that via size and colour. Never add a font from the file.
   - **Ending actions** (delete, remove, revoke, leave) use `end-action`, even if Figma paints them
     red; red is for errors.
   - **Focus** follows the no-double-outlines rule — Figma rarely shows focus; the primitives do it.
   - **Spacing/radius/shadow** → the Tailwind scale and theme shadows. Snap 17px to 16px unless the
     designer marked it intentional.
   - **Page padding** comes from `PageContent`; no per-page `px-*`. Forms/details sit in `max-w-4xl`.
   - **Dialogs** use `components/ui/dialog` with the corner ✕ and a `DialogClose asChild` Cancel; a
     dialog opened from a dialog hands over (one pop-up at a time) — never build stacked modals.
   - **Icons** → `lucide-react`, or an authored icon in `src/components/icons/`. No new icon package.
     Brand logos in the frame (social, payment, OAuth) aren't in lucide 1.x — use `simple-icons` or
     the brand's SVG file under `public/assets/brands/`.
   - **Primitives first** → the CLI 4 set covers common Figma pieces: labelled inputs with help and
     error text → `field` (via `FormField`); inputs with an icon/button inside → `input-group`;
     empty panels → `empty` (via `EmptyState`); loaders → `spinner`. If the shadcn MCP server is
     configured (`npx shadcn@latest mcp init --client claude`), use it to look a primitive up
     before building one.
   - **Motion** in the frame (page enter/exit, shared element) → the motion agent, which leads with
     React `<ViewTransition>` and a reduced-motion fallback.
5. **Download assets.** Images/illustrations come from the MCP's localhost asset URL: download each
   (`curl -o public/assets/<subfolder>/<name>.<ext> <url>`), reference as `/assets/…` via
   `next/image` with width/height and alt. ⚠️ Never ship a `localhost` asset URL — it only exists
   while the MCP server runs. Prefer SVG → lucide where a matching glyph exists.
6. **Wire real behaviour.** Data via feature hooks → service; forms via react-hook-form + Zod +
   `FormField`; loading = `<Skeleton>`, empty = `<EmptyState>`, errors inline/toast per `forms`. No
   mock data in components. If the frame only shows the happy path, build the other states and say so.
7. **Validate** against the screenshot at mobile and desktop: layout, type size/weight, token
   colours, interactive states, responsive behaviour, assets. Run `yarn typecheck`, `yarn lint`,
   `yarn test` (the style guards catch colour, focus, dialog and end-action violations), look at it
   in the running app, and run `ui-validate` — including the axe check that visible button text sits
   inside its accessible name (Figma layer names often leak into `aria-label`s).

## When the design breaks a rule

Don't silently "fix" it and don't silently follow it. Build to the system, then tell the user
exactly what differs and why (e.g. "Figma's delete is red; ending actions use `end-action`"). If the
design needs a genuinely new token or pattern, stop and propose it — token changes go to the styling
agent, with a contrast case in `src/styles/theme.test.ts` for any new text/background pair.

## Related

`frontend-design` (direction for screens with no mock), `ui-validate` / `web-design-guidelines`
(review), `a11y`, `responsive-patterns`, `motion`.
