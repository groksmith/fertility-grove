# Moving Fertility Grove to Figma

The app (Next.js, running at http://localhost:3003) is the source of truth. Figma gets a rebuild of every screen at three sizes, made through the TalkToFigma bridge (cursor-talk-to-figma-mcp), which lets Claude Code create frames in an open Figma file.

## Setup (done once)

- Bun is installed (`~/.bun/bin`), and the bridge is cloned at `~/cursor-talk-to-figma-mcp`.
- Relay: `cd ~/cursor-talk-to-figma-mcp && bun socket` (keep it running; it listens on port 3055).
- Claude Code server: the **local** server, not the published one: `claude mcp add TalkToFigma -- /Users/benfrunjyan/.bun/bin/bun run /Users/benfrunjyan/cursor-talk-to-figma-mcp/src/talk_to_figma_mcp/server.ts` (full paths; Bun isn't on Claude Code's PATH).
- The local copy is extended for this build (backups in `/tmp/code.js.bak` and `/tmp/server.ts.bak` until reboot): `create_text` takes `fontFamily`, `fontStyle`, `width` (wraps), `lineHeight`, `letterSpacing` and `textAlign`; new tools `create_page`, `set_current_page`, `rename_page` and `set_effects` (shadows). It already had `set_image_fill` from a local file, so real art and photos go into Figma. Also added: `build_nodes` (a whole tree of frames, text, images, SVG icons and component instances in one call, from inline JSON or a spec file), `create_styles` (colour and text styles from [styles.json](styles.json)) and `to_components` (frames to components).
- Figma desktop: Plugins › Development › Import plugin from manifest › `/Users/benfrunjyan/cursor-talk-to-figma-mcp/src/cursor_mcp_plugin/manifest.json`. Run it in the "Fertility Grove" file. The local plugin always joins the channel `fertility-grove`. Builds run from `docs/figma/tools/` (`FG_CHANNEL=fertility-grove node components.mjs <boardId>`), talking to the plugin through the relay directly with `lib.mjs`/`fg.mjs`, so no Claude Code reload is needed when the plugin changes; just re-run the plugin.
- MCP servers load when a Claude Code session starts: after adding one, start or resume a session.

## Steps

1. **Connect the bridge** (above), then join the plugin's channel and check which tools it offers, especially image placement.
2. **Foundations page:** colour styles, text styles, radius, spacing, shadows from [foundations.json](foundations.json).
3. **Components:** buttons, inputs, switches, chips, tabs, avatars (12 grove characters), post card, group row, sidebar and icon rail, phone top bar and tab bar, menus, dialogs, toasts, each with its states.
4. **Artboard map:** one Figma page per area (Public, Auth, Onboarding, App, States). Each screen gets three frames side by side: `Area / Screen / Desktop 1440`, `Tablet 768`, `Phone 390`.
5. **Screens**, area by area, from the components; compare each area with the reference captures before moving on.
6. **Tablet and phone variants** with their real layouts: icon rail (1024 to 1279), stacked columns, bottom tab bar and sheets, full-screen chat.
7. **Review** against the live app; list anything that didn't translate.

## Progress

- Steps 1 to 3 are done: Foundations and Components pages ([styles.json](styles.json), [components.json](components.json)).
- Steps 4 and 5, Public and Auth: done. Each screen is a row of three frames (`Area / Screen / Desktop 1440`, `Tablet 768`, `Phone 390`).
  - Auth page: `node tools/screens-auth.mjs <pageId> [screen...]`. Seven screens: Sign in, Create account, Forgot password, Reset password, Confirm email, Beta invite, Partner invite.
  - Public page, Landing (y 0): `node tools/screens-landing.mjs <pageId> [y] [Desktop|Tablet|Phone]`. It builds the board first, then one section per call, because the page carries a lot of art.
  - Public page, reading pages (from y 11000): `node tools/screens-public.mjs <pageId> <startY> [screen...]`. Five screens: Help, Terms, Privacy, Shared post, Demo personas.
- Onboarding page: done. `node tools/screens-onboarding.mjs <pageId> [step...]` builds the eight steps with Annie's answers, one row per step on a 3400px pitch, so a single step can be rebuilt in place.
- App page, main screens: Home, Groups, a group (Endometriosis), Messages (list and an open conversation), Notifications, Your profile and a member's profile ([app-main-screens.json](app-main-screens.json)). The full list of 28 is in [app-screens.json](app-screens.json) if more are wanted later.
  - These come straight from the running app: `node tools/dom-to-figma.mjs <pageId> ../app-main-screens.json [name...]` opens each route in headless Chrome as Annie at 1440, 768 and 390, reads the rendered page with [tools/dom-extract.js](tools/dom-extract.js) and rebuilds it as frames, text, images and icons at their exact positions. The layers are positioned, not auto layout.
  - Fixed bars sit at the page's ends: the sidebar runs the full height on desktop, and on tablet and phone the top bar is at the top, with the tab bar and the Grove Guide button at the bottom.
  - Rows are 4000px apart (`FG_PITCH`), in list order, so one screen can be rebuilt in place.
  - Bold words or links inside a sentence need the plugin's styled runs (added to the local plugin; re-run the plugin in Figma to pick them up).

### Notes for the Public and Auth screens

- **Shared post** shows a post with sharing on (`/p/p-3`). The "This post isn't available" state goes on the States page.
- **Hero tree** ([assets/hero-tree.png](assets/hero-tree.png)) is the last frame of the growth film with the paper keyed out. The app shows the film over the wash with multiply blending.
- **Join band:** on desktop it is 468px tall (52% of a 900px window).
- **Images:** `lib.mjs` scales every image to twice its drawn size before sending it, so large pages don't stall the plugin.

Inventory: [screens.md](screens.md) (49 screens, 147 artboards). Design rules: `DESIGN.md` at the repo root. Reference captures of every screen at all three sizes are regenerated with the capture script used in the session (full-page screenshots at 1440, 768 and 390, signed in as the demo member, signed out for public and auth screens).
