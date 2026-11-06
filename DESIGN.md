---
name: Fertility Grove
description: The first purpose built platform for the fertility community.
colors:
  white: "#ffffff"
  site-grey: "#f3f3f3"
  site-line: "#e6e6e6"
  site-line-strong: "#d8d8d8"
  site-ink: "#222222"
  site-muted: "#666666"
  brand-orange: "#f89414"
  brand-orange-deep: "#e97d03"
  brand-leaf: "#6c9e3b"
  ink: "#090814"
  ink-soft: "#3d3d3d"
  surface: "#f8f8f8"
  green: "#32a765"
  green-bright: "#42c074"
  green-dark: "#0a7a3b"
  green-ink: "#031e0f"
  coral: "#f48265"
  coral-dark: "#e06a4d"
  blue: "#85c5f9"
  blue-dark: "#529bd7"
  blue-ink: "#326a97"
  yellow: "#ffd339"
  yellow-soft: "#ffee8c"
  yellow-ink: "#c3a52a"
  purple: "#7546a4"
  purple-mid: "#a874db"
  purple-soft: "#e3d1f9"
  pink: "#f97ab3"
  tint-green: "#e0f6eb"
  tint-blue: "#dff3ff"
  tint-pink: "#ffe7de"
  tint-yellow: "#fffbe8"
  tint-purple: "#f1e7f1"
  tint-neutral: "#f5f5f5"
  tag-coral-ink: "#c24a28"
  tag-yellow-ink: "#8a6d12"
  tag-pink-bg: "#ffe8f3"
  tag-pink-ink: "#c94c88"
  error: "#c0392b"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "68px"
    fontWeight: 400
    lineHeight: 1.04
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.1
  section:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "56px"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  size-12:
    fontSize: "12px"
  size-14:
    fontSize: "14px"
  size-16:
    fontSize: "16px"
  size-17:
    fontSize: "17px"
  size-20:
    fontSize: "20px"
  size-22:
    fontSize: "22px"
  size-24:
    fontSize: "24px"
  size-26:
    fontSize: "26px"
  size-28:
    fontSize: "28px"
  size-30:
    fontSize: "30px"
  size-34:
    fontSize: "34px"
  size-36:
    fontSize: "36px"
  size-40:
    fontSize: "40px"
  size-44:
    fontSize: "44px"
rounded:
  chip: "5px"
  inner: "8px"
  control: "10px"
  card: "20px"
  pill: "9999px"
  focus: "6px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.site-ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "24px"
  nav-item-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "36px"
  count-badge:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
---

# Design System: Fertility Grove

## Overview

**Creative North Star: "The Tended Grove"**

Fertility Grove looks like fertilitygrove.com: a calm white page, the orange logo, watercolour orange trees and a near-black pill. Someone arriving at 2am after a hard appointment sees people and answers first. Colour is reserved for what is alive: the brand orange on your tree and Sunlight, category tints on groups and posts, and the watercolour art.

All artwork is the brand's own watercolour orange tree, taken from the growth film on the live site. Its frames are the five tree levels, the empty-state pictures and the group covers. The Blossom Tree carries white orange blossoms, as the real tree does. The orange from the logo stands for the Grove Guide and conversations. The Learn covers are painted in the same gouache hand, one topic subject each.

**Key Characteristics:**
- A white canvas with light-grey chrome (#f8f8f8 sidebar, #f3f3f3 bands), and white cards with a hairline (#e6e6e6).
- The near-black pill (#222) for the one primary action, as on the live site.
- Brand orange (#f89414) for the tree, Sunlight and counts that need you.
- Instrument Serif for titles and Instrument Sans for everything a member reads or taps (the live site's faces).
- Watercolour artwork only, never flat vector illustration.

## Logo

The logo is the orange with its leaf beside "fertility GROVE" (`public/brand/logo.png`, from fertilitygrove.com). It appears through `Logo` in `src/components/Logo.tsx`. The orange alone (`LogoOrange`) is the favicon and the team avatar; the "fg" tile (`AppIcon`) is the app icon only. Never redraw, recolour, re-letter or replace any of them.

## Colors

The palette is fixed: the live site's colours plus the approved v1 palette. Never change, re-tint or extend it.

### Primary
- **Site Ink** (#222222): primary buttons, selected states (sort, chips, stage picker), toggles that are on, focus rings, toasts, the crisis card.
- **Brand Orange** (#f89414, deep #e97d03): the tree, Sunlight progress, count badges (with ink text), list dots, the caret.
- **Brand Leaf** (#6c9e3b): the tree glyph's leaves.

### Secondary (category tints from the v1 palette)
- **Coral** tint #ffe7de with ink #c24a28: Diagnosis groups. On its own tint, text is Ink Soft and the hue shows as tint plus outline.
- **Blue** tint #dff3ff with ink #326a97: Stage groups, Question posts, clinicians.
- **Yellow** tint #fffbe8 with ink #8a6d12: Topic groups, Seeking input.
- **Pink** #ffe8f3 with ink #c94c88: success stories, Support needed, partner badges (Ink Soft text on the tint, pink outline).
- **Purple** tint #f1e7f1 with ink #7546a4: mentoring.
- **Green Dark** (#0a7a3b) on tint #e0f6eb: positive states (upvote, Sunlight gained, Just sharing).

### Neutral
- **White** (#ffffff): page and cards. **Surface** (#f8f8f8): sidebar. **Site Grey** (#f3f3f3): bands, quiet buttons, active rows.
- **Ink** (#090814), **Ink Soft** (#3d3d3d), **Site Muted** (#666666): text, all at 4.5:1 or better on white.
- **Site Line** (#e6e6e6), **Site Line Strong** (#d8d8d8): hairlines and input strokes. **Error** (#c0392b).

### Named Rules
**The Fixed Palette Rule.** These values are the brand's. Design tools change layout, components, motion and illustration, never these colours. When a tool flags a brand colour, keep the colour and note the exception.

**The Readable Tint Rule.** Text on a tint must reach 4.5:1. Coral and pink inks don't on their own tints, so text there is Ink Soft and the tint plus a hue outline carry the colour.

**The Distinct State Rule.** Selected, active and on states are never pale-on-pale. They use Site Ink (dark fill or ring); counts use Brand Orange.

**The Art Layer Rule.** The gouache backdrop brings warm cream, peach, blush, sky blue and navy, but only in the background wash and painted elements, which always fade into the white page. The ambient light painted over them (lamp glow #ffde96 to #ffc46e, petal #fffaf4 with a #ecc4c4 edge) belongs to the art layer and is never used for UI chrome, text or fills.

## Typography

**Display and titles:** Instrument Serif (with Georgia, serif).
**Text:** Instrument Sans (with system-ui, sans-serif).

**Character:** The live site's pairing. A condensed editorial serif gives titles a human voice; a clear grotesque keeps every control legible on a phone at night.

### Hierarchy
- **Display** (400 serif, 68px desktop / 44px tablet / 28px phone, 1.04): the landing headline only.
- **Section** (400 serif, 56px desktop / 44px phone, 1.0): landing section titles.
- **Headline** (400 serif, 32px desktop / 28px phone, 1.1): app page titles (h1).
- **Title** (600 sans, 18–20px, 1.35): post, card and panel titles.
- **Body** (400 sans, 15–16px, 1.6): posts, articles (about 65ch), descriptions.
- **Label** (600 sans, 12–14px): chips, badges, metadata, field labels. Sentence case, never tracked capitals.

## Layout

App screens: a 248px labelled sidebar on #f8f8f8 with a hairline edge (logo and community at the top, people search, nav on a 38px pitch, a "Yours" group, your row at the bottom). The canvas is white, in a centred 1160px column, mostly two thirds content with a 320–340px right rail. On phones: a 52px top bar (logo, notifications, menu), a four-item bottom nav (Home, Groups, Messages, Me) whose active item sits in a grey pill, and a full-screen menu sheet. Grove Guide is not in any nav: it is a floating #222 pill bottom right, marked as AI the way people already recognise it: a three-star sparkle in brand orange and white, and "Grove Guide" with a small orange AI tag (label from 640px; the sparkle alone below). The small stars twinkle in turn, the big star turns a quarter under a mouse pointer, and the label folds away while you scroll down to read and returns when you scroll up; all of it holds still under reduced motion, sitting above the phone bottom nav and hidden on the Guide itself and inside a conversation, where it would cover the composer. Every grid declares `grid-cols-1` before its breakpoint columns. The landing page has a site bar: logo left, section links centred (How it works, Library, Your tree, Partners, Help), Sign in and the Create account pill right. It sits clear on the hero's painted wash, pins on scroll as soft white with a hairline, marks the section you're reading and glides to a section on click; phones get a menu panel. Below it, the hero is a place you look into (`components/landing/Grove.tsx`): a painted landscape in the wash's colours (pale sky, blush clouds, cream fields; `public/brand/landing/grove-land.webp`, prompt in `scripts/art/prompts-hero/`) with a path running from the foreground to a vanishing point in the middle of the horizon, and the headline in the sky above it. A grove grows along the path. Then white and #f3f3f3 bands.

## Elevation & Depth

Flat at rest. Cards separate from the white page by a 1px hairline (#e6e6e6), and bands by one tone step. Shadows exist only on what floats: dialogs and sheets, menus and toasts (tinted from Green Ink, `rgba(3,30,15,…)`).

## Shapes

Cards 20px, controls 10px, inner items 8px, chips 5px. Buttons, chips, badges and the phone nav pill are full pills. On the landing page the orange's circle is the motif: round painted scenes, round plate crops, orange dot bullets.

## Components

### Buttons
- **Primary:** Site Ink (#222) pill, white text, hover to black, press scales to 0.97.
- **Secondary:** white pill with a #d8d8d8 stroke that turns ink on hover. **Quiet:** #f3f3f3 fill. **Ghost:** transparent.
- **Focus:** a 2px Site Ink outline, offset 2px.

### Chips
- **Post type:** tint with readable ink (see The Readable Tint Rule). **Filters and topic tags:** white with a line; selected is a Site Ink fill with white text.

### Cards / Containers
- 20px radius, white, 1px #e6e6e6 hairline, 20–24px padding, no shadow.

### Inputs / Fields
- White, 1px #d8d8d8 stroke, 10px radius, 44px tall, 16px text on touch devices. Focus: Site Ink stroke plus a 3px #e6e6e6 ring. Errors: a bold red message under the field, tied with `aria-describedby`.

### Navigation
- Sidebar rows are 14px with a 17px outline icon; the active row is a white tab with a hairline ring and semibold ink. Count badges are Brand Orange with ink text, and only appear on queues that need action.

### The Tree (signature)
`TreeArt` shows the brand's watercolour tree at each level, all drawn from the final painting of the growth film so the set is one hand: Seed (a painted citrus pip half sunk in soil, its first shoot breaking the tip), Bush (the green canopy low on a short trunk), Tree (the full canopy before fruit), Blossom Tree (the same canopy in white orange blossom) and Orange Tree (in fruit). `STAGE_SRC` holds the same five at one shared scale on one ground line, for the growth plate on the landing page. The hero film (`tree-grow.webm` / `.mp4`, 1024×1024 square pixels, about 0.6 MB / 1 MB) is cut straight from the site's original (`trees.mp4`, 1440×1080 stored, anamorphic 4:3, so 1920×1080 displayed), cropped round the tree at full resolution; always cut art from that original at its displayed width, never from an earlier cut. `TreeGlyph` is the 16px mark beside every name, coloured from that art; it stays attached to the name and the name truncates first. The landing hero plays the growth film once on its two near trees, keyed to transparency so they stand solid in front of the grove (`tree-grow-alpha.mov`, HEVC with alpha, for Safari; `tree-grow-alpha.webm`, VP9 with alpha, for the rest; stills `tree-grow-first.webp` before it plays and `tree-grow-last.webp` under reduced motion), and behind them the whole grove grows: rows of trees either side of the path, placed in true one-point perspective from the painting's geometry (horizon at 49.5% of its height, path 21.5% of its width either side of centre at the bottom), smaller and paler in the haze with distance. Each grove tree rises from 0.82 and grows through the same painted stages (bush, tree, blossom, oranges; far trees skip one), the next stage fading in before the last fades out, and finishes one of four ways like a real orchard: green only (20%), in flower (25%), in flower and fruit at once (25%, `stage-mixed.webp`: the blossom tree with half the oranges set into it) or full of oranges (30%). They grow in a wave from near to far over about five seconds, matching the film, while the view eases forward 3.5% as if you'd stepped onto the path. Under reduced motion the grove is simply grown. Leaving the hero is walking down the path: as you scroll, the grove layer moves at about a third of the page's speed and eases another 7% forward, while the words rise 90px and fade a little faster so the text clears first (`useLeaveHero`, one rAF-throttled scroll listener, transform and opacity only, off under reduced motion). The Private by default band is brushed over the bottom of the scene in its own grey (`brush-edge.webp`, a dry-brush edge generated to match the gouache), so there is no ruled line and the scene slides under the paint as you scroll; each privacy symbol then grows up out of the band with a small overshoot, 90ms after the one before.

### The Cosy Layer (background atmosphere)
`components/art/Cozy.tsx` paints a background behind the brand's pictures, never instead of them. Every foreground image (the watercolour trees, spot art, the growth film, photos) stays as it was. Art is original gouache made for Fertility Grove with Nano Banana Pro; files live in `public/brand/cozy/`.
- **The wash:** a light cream-plaster wall with a band of pale sky and blush cloud, fading into white at the bottom. It sits behind the landing hero, the sign-in and onboarding panel, and the header of each app section (`HeaderBackdrop`, mounted by `AppShell` from `sceneFor(path)` on index pages; content starts 132px down on desktop, 104px on a phone).
- **Elements, not scenes:** one or two painted cut-outs hang in from the top-right edge and bleed off it: a lively orange branch (Home), the café awning with its string lights (Groups), orange blossom (Success stories), a layered window for Learn (each shutter cut out and nudged on its hinge by a breeze, on its own beat, with lamplight breathing in the glass) beside a hanging orange branch, two birds on a branch (Messages), townhouse rooftops (Family space), a big reaching branch (Mentors), a lantern (Grove Guide), a woven basket of oranges (Saved), a brass bell (Notifications), a copper watering can that lets a drop fall from its spout now and then (Settings: tending your corner of the grove) a little birdhouse with drifting petals (Help: a sheltered place to turn to) and a wooden rope swing on an orange branch (your own profile: your spot in the grove). The bell is its own layer hanging from its bow and rings once, a few damped swings, when you arrive with something unread. On the landing page, a branch beside the statement, blossom by Partners and a branch over Join. They stay clear of text and sit behind controls and cards. Each has three compositions: phones (small, top right); mid desktop, 1024 to 1759px, where content fills the width, so the element is lifted until its best part (flowering tips, lit scallops, the lantern) hangs into the 132px strip above the title; and wide screens, 1760px and up, larger in the empty margin beside the content. Write that breakpoint as `min-[110rem]:`, never `min-[1760px]:`: Tailwind can't order a px breakpoint against `lg` (64rem), so a px one silently loses.
- **Privacy promises (landing):** the "Private by default" strip keeps its compact grey band; each promise's symbol is painted in the gouache hand (a tag marked @, an eye struck through by a twig, a heart under a padlock, an arrow down into an envelope) and stands on the band on its own, without a circle (104px desktop, 80px phone). Pictures here must carry the meaning first and the mood second.
- **Motion:** a hanging element is three nested layers on co-prime periods, so it never visibly repeats: it sways from where it's tied (±1.1°, 7.3s), its tips flex (skew ±1.8°, 4.9s) and it bobs (±1.5px, 6.1s), all on easeInOutSine. Café bulbs and the lantern breathe on staggered beats; a few petals and loose leaves drift down, fluttering as they fall. Loops run only while on screen (`useAmbient`) and hold still under reduced motion.
- **Making more:** `scripts/art/gen.py` (needs `GEMINI_API_KEY`) with the shared `style.txt` and `style-anchor.png`; prompts for the whole set are in `scripts/art/prompts/`. Elements are painted on flat magenta and cut out by `key.py`. Ask for lively foliage (many greens, sunlit edges, curling leaves) and never copy a reference picture: take elements, not compositions. Serve the art at `quality={90}` with `sizes` that match the rendered width.

### The Gift (sign-up and onboarding)
Joining is by invitation, so the panel beside sign-in, sign-up and onboarding is a gift: a young orange tree in a terracotta pot tied with a cream ribbon bow and a blank kraft tag (`components/art/GiftTree.tsx`, pieces in `public/brand/gift/`, prompts in `scripts/art/prompts-gift/`). No bees or other creatures.

- **Sign-in, sign-up and step 1:** the gift: leaves only, no flowers yet.
- **Step 2:** closed buds on some branches.
- **Step 3:** buds on every spot, some opened into blossom.
- **Steps 4–5:** in full bloom.
- **Step 6:** the first fruit sets where the middle blossom was: one small green orange.
- **Step 7:** that orange is ripe, and two greenish ones have set beside it, among the blossoms.
- **Step 8:** the tree is full of ripe oranges (16), every blossom turned to fruit.

Every fruit goes through the same three paintings (green fruitlet, greenish young orange, ripe orange; the first two painted from each other so they read as one fruit) at growing sizes (0.72, 0.86, 1). Motion, all CSS transitions: buds set with a small overshoot (600ms), a bud gives way as its blossom unfolds from 0.55 scale and -28° with a slight overshoot (760ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`); a fruit swells in on the same overshoot as its blossom fades and ripens by cross-fading its paintings (900ms); at the harvest each orange and its blossom share a delay, 55ms after the one before, so flowers turn into fruit in turn with no bare moment. When several buds or blossoms change on one step they go in a wave, 70ms apart. Each step is its own page, so the scene remembers the last step and plays from it instead of just appearing. Under reduced motion everything simply appears.

### Group Covers
Each group has its own cover (`public/brand/groups/{id}.webp`, `GroupCover` in components/art/Brand.tsx), readable at 40px, and the set is deliberately mixed the way a real community looks.
- **Candid photos** (as a group creator would upload, phone-shot, natural light, no faces or text): a hot-water bottle on a rumpled bed (endometriosis), a foggy forest path (unexplained), a phone beside a coffee (waiting on a diagnosis), a dandelion letting go (IUI), two people's hands around mugs (partners), a hammock by a lake (taking a break), a home desk (work and treatment), white blossom against blue sky (spring transfers).
- **Painted motifs** in the gouache hand on the type's tint (Diagnosis blush, Stage sky, Topic butter): a crescent moon and stars (PCOS), a jar of a few golden seeds (diminished ovarian reserve), acorns (male factor), a feather on a stone with forget-me-nots (recurrent loss), a cloche over a seedling (IVF), a frosted orange (egg freezing), an empty nest with blossom (pregnant after infertility), a sapling tied with a ribbon (donor conception).
Never babies or anything clinical. A group without its own cover falls back to a canopy crop. Prompts: `scripts/art/prompts-groups/` (painted) and `scripts/art/prompts-groups-photo/` (photos).

### Article Covers
Each of the six Learn articles has its own painted cover (`public/brand/learn/{slug}-topic.webp`, `articleCover(slug)`), on the diagnosis's tint: one large painted subject taken from the article's title and summary, so a member can tell what it covers at a glance. Stylised and gentle, never clinical or graphic, no text. Endometriosis: a uterus made of coral blossoms and leaves, a few blooms growing outside its outline (tissue beyond where it belongs). PCOS: a round ovary cut open with a ring of tiny pearls inside (the "string of pearls"). Diminished ovarian reserve: a glass jar with only a few golden seeds left. Male factor: a brass microscope with a slide (the semen analysis). Recurrent pregnancy loss: a kintsugi bowl mended with gold, a seedling growing in it, forget-me-nots beside (loss, care, going on). Unexplained: a jigsaw puzzle complete but for one missing piece (every test normal, one piece unknown). A generic object with a book beside it said nothing and was dropped. Cards show the cover edge to edge at 16:9 (a slow 1.03 zoom on hover); the diagnosis list uses it as a 64×48 thumbnail; the article page shows it in its tinted header. The landing's library is the same shelf: three columns of covers with the diagnosis in its hue, title, summary and read time; each card rises in turn as the section enters and its cover settles from a 1.08 zoom over 1.1s. Prompts: `scripts/art/prompts-learn/`.

### Landing Scenes
The landing page uses no photographs. Its round pictures are gouache scenes (`public/brand/landing/`, prompts in `scripts/art/prompts-landing/`), painted square with the subject centred for a circle crop. "Where are you right now?" has one per stage: a path into the grove (trying to conceive), a bench by a closed gate (waiting on tests), blossom with a first small fruit (in treatment), a hammock by a lake (taking a break) and two chairs side by side (partner). "Room for partners" shows two young orange trees growing side by side above a lake. No people: togetherness and rest are told through places. Motion: the chosen stage's painting settles in from a 1.04 zoom over 500ms while the last fades, and every scene drifts slowly (`.drift`, 18s), like a view through a window; all of it holds still under reduced motion.

### Settings
Settings works like a settings app, not a long form with jump chips. A grouped list (Account · Privacy and safety · People · Membership) where each row is an icon tile, the section's name and its current state in muted text ("Messages from people you follow", "14 credits", "Not linked"), with a chevron; Delete my account sits last in danger red, and Prototype tools sits apart below a rule. Desktop: the list is a sticky 320px column and the chosen section opens beside it as its own page (24px title, a line on what it's for, then one card of controls); the selected row is white with a ring and a dark icon tile. Phone: the list first; a row opens its section alone with "← Settings" back. The open section is the URL hash, so `/settings#privacy` deep-links and Back works.

### Saved
One list with type tabs (All · Posts · Stories · Articles), articles shown with their painted cover. Beside it, "Before your appointment": make or open a question list, share with your partner, and the privacy line. While fewer than four things are saved, "Worth saving" offers three reviewed articles matched to the member, each with one-tap save. Motion: a removed item fades and its row folds closed (240ms), then a toast; a newly saved item rises in; items already there when the page opened never animate; the bookmark pops on press; reduced motion removes instantly.

### Devices
The app behaves like a native community app at every size.
- **Phone (under 1024px, iPhone and iPad portrait):** translucent top bar (logo, notifications, menu) and four-item tab bar, both blurring what scrolls beneath. The burger opens a bottom sheet with every destination in 48px rows, people search and your row. A conversation opens full screen like iOS Messages: its own bar with back, the list scrolling inside, the composer pinned above the home indicator, no tab bar. Rows that crowd stack instead (a group's Join sits under its text).
- **iPad landscape (1024 to 1279px):** the sidebar becomes a 76px icon rail (labels kept for screen readers and as tooltips, counts as small badges); pages with a side column stack it under the main column; master-detail screens (Messages, Settings, the Guide) keep both panes.
- **Desktop (1280px and up):** the labelled sidebar and side columns.
- **Signing out:** your row at the foot of the sidebar is an account menu (opens upward: View profile, Settings, Help, then Sign out). On phones the menu sheet ends with a Sign out row in danger red. Both confirm first ("Sign out of Fertility Grove?") and ask about unsaved edits before that; signing out lands on the sign-in screen.
- Content-plus-rail layouts use `xl:grid-cols-[minmax(0,1fr)_Npx]`, never `lg:`. Every tap target is at least 44px (back links, tabs, and switches through an invisible halo). No screen scrolls sideways at 390, 768 or 1024.

### Unsaved Changes
Any form with edits nobody saved (`useUnsavedGuard` in components/UnsavedGuard.tsx) asks before you leave: a link anywhere in the app, the Back button, closing an editor, or switching a Settings section opens "You have unsaved changes" with Save and leave (runs the form's own save; if it can't save yet the dialog closes and the field errors show), Leave without saving, and Keep editing. Forms that create something new (a post, a story, a question list) offer only Leave or Keep editing, since saving there would publish. Closing or reloading the tab gets the browser's own prompt, the only one browsers allow. Guarded: Edit profile, Settings Account and Journey, Mentor setup, family notes, editing a post, editing a question, and drafts of a new post or story.

### Grove Avatars
Members post under handles, so nobody's face is required. `AVATARS` (components/ui/identity.tsx) is a set of 12 emblems painted like plates from a naturalist field guide: orange, olive branch, fern, swallow, mountains, wave, pine cone, moon and stars, oak leaf, owl, fox, sunflower. Grown-up and gender-neutral: accurate and detailed, no cartoon faces, a muted palette (olive, sage, ochre, slate blue, ink navy, terracotta; brand orange only where natural), and a mix of plants, wildlife and landscape so anyone can find one that feels like theirs. Each has a bold silhouette that still reads at 32px, and a `zoom` that evens out how much of the circle it fills. Files are in `public/brand/grove-avatars/`, prompts in `scripts/art/prompts-avatars/`. The order is fixed because members store an index. None of them presumes how a journey ends: no babies, eggs, storks or bumps. In the picker the emblem you choose settles in with a small pop (340ms overshoot) and, under a mouse, the one you point at lifts a touch; avatars elsewhere never move. A member wears one on their own pale hue (`avatarHue`), so the same character in two colours still tells people apart. Members who haven't chosen get a steady character from their id; your own account shows your initial until you pick, which Home's "Complete your profile" card invites with a one-tap row of six and "See all 12". Onboarding and Edit profile carry the full picker (two rows of six) plus the six background swatches. Posts show the author's avatar, with the group as a link beneath.

## Do's and Don'ts

### Do:
- **Do** use the real logo (`Logo`) and the brand's watercolour art for every picture.
- **Do** keep pages white and light, with the near-black pill for the one primary action.
- **Do** make every text and tint pair reach 4.5:1, and every touch target at least 24px (44px for primary controls).
- **Do** show selected states with Site Ink, never pale-on-pale.
- **Do** use the PRD's exact copy for errors and empty states.

### Don't:
- **Don't** change the logo, its colours or any palette value, or add a colour that isn't in the palette.
- **Don't** fill large areas with green; the brand is white with orange and watercolour.
- **Don't** draw flat vector scenes or icons in tinted squares; use the watercolour tree or the gouache set, and make new pictures in the same gouache hand.
- **Don't** put a shadow on anything at rest, or an eyebrow label above a heading.
- **Don't** colour orange blossoms anything but white.
