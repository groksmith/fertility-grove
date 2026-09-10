# Fertility Grove — front-end prototype

A clickable, front-end-only prototype of the Fertility Grove member platform, built
from the Figma high-fidelity screens and the v1.2 PRD.

**There is no backend.** All data is mocked in `src/lib/data.ts` and everything you
change (posts, likes, to-dos, saved vendors, your campaign, donations) is kept in
the browser's `localStorage`. Reset it any time from **Settings → Reset demo data**.

## Run it

```bash
npm install && npm run dev
```

Then open http://localhost:3000.

To skip sign-up and land straight in the product, open http://localhost:3000/demo
(there is also an "Explore the prototype" link on the sign-up screen).

## Screens

| Route | Screen | Figma |
|---|---|---|
| `/signup` | Create a free account | 1 |
| `/login` | Log in | — |
| `/onboarding` | 9-step onboarding wizard | 2–6 |
| `/dashboard` | My Dashboard | 7 |
| `/profile` | My Profile | 8 |
| `/community` | Community board (sort, filter, like, save, comment) | 9 |
| `/community/new` | Create a post + success modal | 10, 11 |
| `/community/groups` | Group directory | — |
| `/community/groups/[id]` | Group detail | 12 |
| `/care` | Care Guide — browse + search results | 13, 14 |
| `/care?category=Acupuncture` | Deep link into a category search | 14 |
| `/care/network` | My care network & saved vendors | — |
| `/fundraising` | Browse campaigns + How It Works | 15 |
| `/fundraising/new` | 8-step campaign builder | 16, 17, 18 |
| `/fundraising/mine` | My campaign | — |
| `/fundraising/[slug]` | Public campaign page (no app chrome, donate flow) | — |
| `/learn` | Infertility 101 | 19 |
| `/learn/[slug]` | Article with clinician review + disclaimer | — |
| `/messages` | Messages | 20 |
| `/search?q=` | Global search across posts, groups, care, Learn | — |
| `/settings`, `/help` | Settings and guidelines / FAQ | — |

## What actually works

- **Onboarding** — all 9 steps with real validation; the profile you enter is used
  everywhere afterwards.
- **Community** — create a post (post type, tags, and validation per the PRD, including
  the "add at least one tag" error), like, save, comment, sort, filter, join/leave groups.
- **Care Guide** — category browse, search by term + zip, distance / diagnosis /
  delivery filters as removable chips, empty state with "widen to 50 miles",
  recommend-a-provider (with the 3-recommendation threshold explained), care quiz,
  bookmark, add to care network.
- **Fundraising** — the 8-step builder writes a real campaign, which then appears on
  the browse grid, on "My campaign", and on its own public page where donations
  update the total and supporter list.
- **Learn** — full-text search, personalized ordering by the diagnoses picked during
  onboarding, cross-links into the Care Guide.
- **Messages** — 1:1 threads with day separators, send, block, report.
- **Anonymity** — switching to a handle in Settings changes your display identity
  consistently across posts, comments, and messages.

## Design fidelity

The Figma file was not reachable through the Figma MCP (no edit access on
`j2aop5jdVRDsRysjfE6G7i`), so the designs were recovered by parsing the local
`.fig` export directly. Two things came out of that and are used here:

- **Artwork is the real thing.** Every Care Guide tile, the onboarding
  illustrations, the Learn section art and the post-published graphic in
  `public/illustrations/` are exported verbatim from the Figma vectors rather
  than redrawn. Campaign cover photos in `public/photos/` come from the same
  file.
- **The Learn page has six sections**, not two — the reference render was
  cropped at 1024px. Diagnoses, Treatments, Lifestyle and Holistic Approaches,
  Emotional and Mental Wellbeing, FAQs, and Glossary & Resources are all built.

**One deliberate deviation from the PRD.** §11 of the PRD says the left nav
tints to the active section's brand colour. The approved Figma frames don't do
that — every sidebar is `#F5F5F5` with the active row as a solid white cut-out,
except Messages, which tints the whole nav pale yellow. The build follows the
Figma. If you'd rather have the PRD behaviour, it's the `tint` values in
`src/components/AppShell.tsx`.

## Design system

- **Type** — Instrument Serif for headlines and quotes, Manrope for UI and body copy
  (both loaded via `next/font`).
- **Section colour** — each section keeps its accent (Community coral, Care Guide
  green, Fundraising blue, Learn yellow, Messages purple) on buttons, tags and
  cards; the sidebar itself stays neutral, as the Figma frames have it. Tokens
  live in `src/app/globals.css`.
- **Layout** — designed at 1440px and responsive down to 390px. The right rail
  collapses beneath the content column below 1280px, and primary actions that
  live in the rail (Create post, Join group) surface inline above it so they
  stay reachable. Below 1024px a bottom nav carries the six sections and a
  slide-over menu in the top bar carries search, profile, Settings and Help.
  Messages switches to one pane at a time with a back control.

## Deliberate gaps

These come from the PRD and were built to match the design language rather than copied
from a Figma frame, because those frames were not in the export:

- Onboarding steps 2 (about me), 5 (diagnoses), 6 (anonymity), 7 (notifications).
- Campaign builder steps 1–2 (story, title), 5–7 (timeline, wishlist, review).

Controls that are intentionally inert in the prototype (file uploads, "New
message") are visibly disabled and carry a tooltip saying so, rather than
looking live and doing nothing.

Nothing here is medical advice, no payments are processed, and no data leaves the browser.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react
