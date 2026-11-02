# Fertility Grove: front-end prototype (PRD v2.0)

A clickable, front-end-only prototype of the Fertility Grove MVP, built from
`docs/Fertility-Grove-MVP-PRD-v2.0.docx`. It covers the member app only; the
moderator and admin panel (PRD §19–20) is out of this prototype.

**There is no backend.** All data is mocked under `src/lib/data/` and every change
you make is kept in this browser's `localStorage`. Reset any time from
**Settings → Prototype tools → Reset demo data**.

## Run it

```bash
npm install && npm run dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/demo to
pick a persona:

| Persona | What it shows |
|---|---|
| New member | The invite-only sign-up, email confirmation and the 8-screen onboarding |
| Annie (established) | A Tree-level member with groups, posts, a mentor and messages |
| Invited partner | The partner invite page and onboarding with partner presets |
| Mentor at Blossom Tree | Mentoring unlocked, with an incoming mentor request |

Demo sign-in: `annie.m@grove.test` / `sunlight-demo`.

## What's built (PRD v2.0)

| Area | Routes | PRD |
|---|---|---|
| Landing, Help, Terms, Privacy | `/`, `/help`, `/terms`, `/privacy` | §4 |
| Sign-up (invite gate, paused state, Google or email), sign-in (lockout), reset, confirm email | `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/confirm-email`, `/invite/[code]` | §4 |
| Onboarding, 8 screens, consent, matching on screen 8 | `/onboarding/1` … `/onboarding/8` (`?preview=1` to view when already onboarded) | §5, §11 |
| Home feed (For you / Following, sort, filters, matched posts, Complete your profile) | `/home` | §3, §8, §11 |
| Groups and group pages (join, mute, leave, members-only, archived) | `/groups`, `/groups/[id]` | §8 |
| Posts, comments, votes, source tags, one-level replies, collapse at −5 | `/posts/new`, `/posts/[id]` | §9 |
| Success stories | `/stories`, `/stories/new` | §10 |
| People search, member profiles, follow, message, request mentoring | `/people`, `/u/[handle]` | §6, §10, §12 |
| Your profile, Sunlight history, How others see me | `/profile` | §6, §13 |
| Learn library (6 articles) | `/learn`, `/learn/[slug]` | §16 |
| Grove Guide AI, appointment questions | `/guide`, `/guide/appointments` | §17 |
| AI credits and demo checkout | `/credits`, `/credits/checkout` | §18 |
| Mentors: find, request, accept, end, feedback, setup | `/mentors`, `/mentors/setup` | §12 |
| Direct messages, requests, mentoring threads, block, report | `/messages`, `/messages/[id]` | §14 |
| Notifications | `/notifications` | §15 |
| Partner invite and family space (share, notes, versions, activity) | `/partner-invite/[token]`, `/family`, `/family/notes/[id]` | §7, §7a |
| Settings, consent withdrawal, data download, delete with 14-day restore | `/settings`, `/restore`, `/suspended` | §6, §19, §21 |
| Public shared post (noindex) | `/p/[id]` | §10 |
| Saved | `/saved` | §9 |

Removed from the v1 prototype because PRD v2.0 §27 moves them out of the MVP:
the Care Guide directory (Phase 2), fundraising and wishlists (Phase 3), to-dos,
records and the daily quote. The v1 source is archived at
`../fertility-grove-v1-prototype-backup.tar.gz`.

## Rules the prototype enforces

All field rules and error messages come word for word from the PRD (see
`src/lib/rules/validation.ts`). Some highlights you can try:

- Unconfirmed members can browse, onboard and join groups, but posting,
  commenting, voting, messaging, requesting a mentor and buying credits ask them
  to confirm their email first.
- **Votes:** members can't downvote Support needed or Just venting posts, and
  anything at −5 or below collapses behind "Show hidden content".
- **Sunlight and levels:** levels never drop. Reaching Blossom Tree (750
  Sunlight) unlocks mentoring.
- **Mentor requests:** a member can have one open request and two mentors at a
  time.
- **Messages:** a first message goes as a request unless the recipient follows
  you or accepts messages from anyone.
- **Crisis detection** (a mock phrase list) shows the 988 resources at once and
  holds high-confidence posts. The Grove Guide's crisis reply is free and works
  at a zero balance.
- **Grove Guide:** it answers only from the six reviewed articles and cites them.
  It refuses to diagnose or advise on doses, and sends emergencies to the clinic
  or 911.

## Prototype tools

**Settings → Prototype tools** simulates what a backend would do:
- confirm or unconfirm the email
- pause sign-ups, turn the invite off, expire links
- add Sunlight to trigger level-ups
- have a mentor accept, decline or let a request expire
- have your partner accept the invite
- receive a suspension
- reset everything

## Sample values to confirm

The PRD leaves these open (§18, §27), so the prototype uses labelled samples:

- **Credits:** 20 free credits a month; a Guide question costs 1, an
  appointment list costs 3; the low-balance warning is at 3; at most 5 packs a
  day.
- **Packs:** Sprout 25 credits for $4.99, Grove 60 for $9.99, Orchard 150 for
  $19.99, tax included.
- **Names:** points are called "Sunlight" and level 2 is "Bush".
- **Groups:** the launch group list is taken from the PRD's examples.
- **Learn articles:** the six articles are plain-language samples, and their
  reviewer, "Dr. Lena Ortiz", is fictional.
- **Members:** every member is fictional.

## Design

- **Brand, from fertilitygrove.com:**
  - The orange logo (`public/brand/`, `src/components/Logo.tsx`).
  - The white and light look, with the near-black pill button.
  - Instrument Serif + Instrument Sans.
  - The site's colours plus the approved v1 palette (tokens in `src/app/globals.css`).
  - The logo and palette are fixed.
- **Artwork:** the brand's own watercolour orange tree, taken from the growth film on the live site (`public/brand/art/`, made by a small script from `tree-grow.mp4`). It is used for:
  - the five tree levels (the Blossom Tree has white orange blossoms);
  - the onboarding grove, which grows one stage per answer;
  - empty-state pictures and group covers.
  - The full sheet is at `/art`.
- **Landing page:** follows the live site's hero, with the growth film playing once beside the headline.
- **Imagery:** photographs from the Fertility Grove design files (`public/photos/`), and the botanical plate *Citrus limonum* by Rungiah (1851), public domain via Wikimedia Commons (`public/plates/credits.json`).
- **Accessibility:** axe-core (WCAG 2.2 AA) reports no violations on any of the 41 routes checked, at desktop and phone widths.

### Design skills used

| Skill | How it was used |
|---|---|
| `design-taste-frontend` | Page run for the landing page (direction "one motif", seed 1576100232) and the app-screen run (style "pastel-consumer", seed 657692864); inspector and lint gates |
| `impeccable` | PRODUCT.md, surface briefs with direction contracts, craft floor, detector |
| `ui-ux-pro-max` | Form, error and touch-target rules; its generic style suggestion was set aside for the brand |
| `design-system` | Primitive → semantic → component tokens |
| `emil-design-eng`, `mobile-native`, `find-animation-opportunities` | Press feedback, origin-aware menus, sheets, safe areas, 16px inputs, motion audit |

Skipped as not applicable:
- `imagegen-*`, `image-to-code`: no image-generation tool is available.
- `animate-expo`, `write-swift`: they target native apps.
- `slides`, `banner-design`, `brandkit`: they produce decks and marketing assets.
- `ask-sonner`: there is no toast library; toasts are hand-built.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react.
Nothing is medical advice, no payments are processed, and no data leaves the
browser.
