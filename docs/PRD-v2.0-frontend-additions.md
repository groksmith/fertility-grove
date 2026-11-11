# Frontend features not in PRD v2.0

Source of truth for this list: the current frontend (`src/`), compared with `docs/Fertility-Grove-MVP-PRD-v2.0.docx` on 2026-11-11. It lists only behaviour, not copy or artwork changes. Each item says which PRD section to update, where the feature appears, what it does, its rules and edge cases, and the exact wording on screen. Quoted strings are the frontend's exact copy.

Two naming changes affect the sections below: the member's home screen is now called **Feed** (route `/feed`), and the member's own profile now lives on the **Dashboard** (route `/dashboard`). Old links to `/home` and `/profile` redirect.

---

## 1. Source is optional on posts

**PRD to update:** §9, "Post fields" table (Source row) and the post error messages.

**Where:** Write a post (`/posts/new`).

**What changes**
- Source is optional. The field is labelled "Source (optional)" and its first option reads "No source" (previously "Choose a source").
- A post can be published without a source. Only the post type, title and body are required (plus the group, and accepting the guidelines on a first post).
- Topic tags were already optional in the PRD. They are now labelled "Topic tags (optional)" with the "0 / 5" counter.

**Rules that stay**
- Source link is still required when the source is "From research or guidelines", and optional otherwise.
- "Clinician input" is still offered only to verified clinicians.

**Display**
- A post without a source shows no source label: on post cards, on the post page and on the public shared-post page (`/p/[id]`).

**Validation copy**
- Missing post type: "Pick a post type." This replaces "Pick a post type and a source.", which no longer applies.
- The tip in the side panel now reads "Adding a source, if you have one, helps readers know how much weight to give it."

**Open question for the PRD:** §9's user story ("see whether information comes from a doctor, research or personal experience") assumes every post has a source. Decide whether "no source" needs its own label or filter treatment.

---

## 2. Dashboard: one place for everything that's yours

**PRD to update:** §6 (own profile), and the screen list. The Dashboard contains everything §6 and §13 put on the member's own profile, and adds the views below.

**Where and how to reach it**
- Route `/dashboard`. `/profile` redirects to it, keeping query strings (`/profile?edit=1` opens the editor).
- Desktop sidebar: second item, right under Feed.
- Account menu (the member's row at the foot of the sidebar): "Dashboard", replacing "View profile".
- Phone tab bar: fourth tab, "Dashboard", replacing "Me".
- Tapping the member's own name or avatar anywhere (post cards, mentions) opens the Dashboard.
- Notifications about levels and Sunlight link to it. Sunlight links go to `/dashboard#sunlight`.

**Header (on every tab)**
- The member's avatar, the title "Dashboard", their display name, then either "@handle" (when showing real name) or "First L. (only you see your name)" (when showing the handle), then pronouns if set.
- Buttons: "How others see me" (toggles to "Back to my view") and "Edit profile".

**Tabs**

| Tab | Label (with count) | URL |
|---|---|---|
| Overview | "Overview" | `/dashboard` |
| Posts | "Posts N" (N = own posts + own success stories) | `/dashboard?tab=posts` |
| Replies | "Replies N" (own comments and replies) | `/dashboard?tab=replies` |
| Groups | "Groups N" (groups joined) | `/dashboard?tab=groups` |
| Saved | "Saved N" (saved posts + stories + articles) | `/dashboard?tab=saved` |

- The tab is kept in the URL, so links and Back work. An unknown `tab` value opens Overview.
- "Edit profile" (`?edit=1`) always opens on Overview. Turning on "How others see me" from another tab switches to Overview.

**Overview tab, in order**
1. The edit form (when editing) or the public preview (when "How others see me" is on). Both are as specified in §6.
2. The tree: level, Sunlight, progress to the next level, and the five levels (§13).
3. **Recent activity** (new). See below.
4. About me, My story, and Your journey with its visibility note (§6). Hidden while editing or previewing.
5. Invite a friend (§13 referral link). Hidden while editing or previewing.
6. Sunlight history with "How Sunlight works" (§13).

**Recent activity (new)**
- Shows the member's 4 most recent items across their own posts and replies, newest first.
- Post row: "You posted in {group} · {time} ago", then the post title as a link to the post, then "{n} votes · {n} replies". The vote count is the score.
- Reply row: "You replied in {group} · {time} ago", then the post title as a link to the post's comments, then the reply text clipped to 2 lines.
- Below the list: "All your posts" and "All your replies", which switch to those tabs.
- Empty: "Nothing yet. Your posts and replies will collect here. Write a post" (links to `/posts/new`).

**Posts tab (new)**
- All of the member's own posts as standard post cards, newest first. Posts held for review (§19) are included; only the author can see them. Deleted posts are not shown.
- Below them, "Your stories": the member's own success stories (type chip, title linking to Success stories, time). This block is hidden when there are none.
- Empty (no posts and no stories): "You haven't posted yet." / "Ask a question or share where you are. Your posts collect here." Button: "Write a post".

**Replies tab (new)**
- Every comment and reply the member wrote, newest first, including held ones.
- Each card shows:
  - the group and time: "In {group} · {time} ago". Held items add "· Only you can see this for now".
  - "On “{post title}”", linking to the post's comments.
  - the full reply text.
  - the score: "{n} votes".
- Deleted and removed comments are not shown.
- Empty: "No replies yet." / "Replies you leave on other members' posts collect here." Button: "Go to your feed".

**Groups tab (new)**
- One row per joined group, with:
  - the cover and the name, linking to the group.
  - "{members} members · {n} posts this week". When the member has posted there, it adds "· {n} posts from you". When the group is muted, it adds "· Muted".
  - a "Post" button that opens Write a post with that group preselected. On phones it shows as an icon only.
- Below the rows: "Find more groups" (→ `/groups`).
- Empty: "You haven't joined a group yet." / "Groups are where posts live. Join one that matches where you are." Button: "Browse groups".

**Saved tab (new)**
- A compact list of saved posts, stories and articles. Each row shows its kind ("Post", "Story" or "Article"), the title as a link, and a detail line: the group name for a post, the story type for a story, or "Learn library" for an article.
- Below the list: "Manage saved" (→ `/saved`), where items can be removed.
- Empty: "Nothing saved yet." / "Save posts, stories and articles to find them again before your next appointment."

**Side column (on every tab)**
- Followers and Following, with remove and unfollow (§6, §10).
- **Mentoring card (new)**: up to 4 of the member's mentoring relationships, both as mentee and as mentor. Each shows:
  - the other member's name and avatar.
  - the role: "Your mentor" or "You mentor them".
  - the status: "Waiting for a reply", "Connected", "Not available right now", "Request expired" or "Mentoring ended".

  The link "Open mentors" goes to `/mentors`. The card is hidden when there are no requests either way.
- Your partner (§7: invite, pending invite, or linked with "Open family space").

**Privacy:** the Dashboard is visible only to the member. What other members see stays as §6 defines, shown through "How others see me".

---

## 3. Filters and sort on a group page

**PRD to update:** §8. The "Home feed" control table currently applies to the home feed only. Add a "Group page" control set, and update the flow line "It shows the name, description, rules, member count, posts this week and the feed."

**Where:** a group page (`/groups/[id]`), above the group's posts, when the member can read the group.

**Controls**

| Control | Type | Options and rules |
|---|---|---|
| Sort | Single choice | Newest (default). Top this week: highest score from the last 7 days. Most discussed: most comments in the last 7 days. Same definitions as the home feed |
| Filter by post type | Multiple choice | All five post types (Question, Seeking input, Support needed, Just venting, Just sharing). Shown whenever the group has at least one post the member can see |
| Filter by tag | Multiple choice | Only the topic tags used on this group's posts, most used first, then alphabetical. Shown only when the group's posts use at least 2 different tags |

**Rules**
- Within one filter, the choices combine with OR: any of the picked types, or any of the picked tags.
- The two filters combine with AND: a post shows only if it matches both.
- The post count next to the sort ("N posts") reflects the current filters and sort.
- "Clear filters" appears next to the count while any filter is on, and resets both filters.
- Filters and sort are not saved. Leaving or reloading the page resets them. They are not in the URL.
- A picked tag that no longer appears in the group's posts is ignored.

**Empty states**
- No posts match: "No posts match those filters." With Top this week or Most discussed on: "No posts match those filters this week." Button: "Clear filters".
- A group with no posts at all keeps "No posts yet. Start the conversation." The filters are hidden then.

---

## 4. "From the library" on group pages

**PRD to update:** §8 (group page contents), §16 (article placement), and possibly §20 (who curates the links).

**Where:** a group page's side column, at the end, for groups that can be read.

**What it shows**
- The heading "From the library" and a link: "All articles" when the group has links, or "Browse clinician-reviewed articles" when it has none (both → `/learn`).
- Up to 3 links per group. Each opens a section of a Learn article (`/learn/{slug}#{section}`), with the article's cover, a short label (for example "How endometriosis can affect fertility", "Common treatment paths", "Questions to bring to your doctor") and the article title.

**Rules (prototype)**
- The links are a fixed list per group (`GROUP_READING` in `src/lib/data/articles.ts`).
- A link appears only if that section exists in the article, so a missing section never makes a broken link.
- Groups without a list show only the heading and "Browse clinician-reviewed articles".

**Open question for the PRD:** §16 already gives each article "related groups". Decide whether this list is derived from those (the reverse link) or curated per group in the admin panel (§20).

---

## 5. Members shown on a group page

**PRD to update:** §8 (group page contents) and §21 (privacy), if kept.

**Where:** the group page header, beside "{type} group · N members · N posts this week".

**What it shows:** up to 5 overlapping member avatars (32px). They are decorative: not links, and hidden from screen readers.

**Who is shown (prototype)**
- First, members who have posted in this group, excluding the viewer.
- Then other members, in a different mix for each group.
- Never members who are unavailable or the Support (team) account.

The prototype has no group membership data, so the second set isn't limited to the group's actual members.

**For the PRD to decide**
- Should it show only members of the group?
- Should it respect blocks both ways?
- Should it exclude members who turned off "Suggest me to members on my path"?
- Should it show members of Members-only groups to non-members? Today the avatars appear in the header even before a member joins a Members-only group, while the posts stay hidden.

---

## 6. Invite a friend on onboarding screen 8

**PRD to update:** §5, the "Screen 8. Your personal start" block table. Add a block. §13 referral rules apply unchanged.

**Where:** onboarding screen 8, inside the first card, under "You've planted your Seed in Fertility Grove." It also stays on the Dashboard, the profile placement the PRD already has (§10).

**What it shows**
- An envelope illustration.
- The title: "Refer a friend to start growing your tree".
- The text: "Know someone going through this too? Send them some seeds. When they join with your link, your tree gets 10 Sunlight."
- The member's personal invite link, shown truncated: `{site}/invite/{handle}`.
- A "Copy link" button. It changes to "Copied" with a check.
- The hint below: "Copy the link, then paste it to a friend." After copying it reads "Copied. Paste it to a friend to send your seeds." This message is announced to screen readers.

**Rules**
- Shown to every member on screen 8, partners included. (Screen 8's partner-invite block is the one hidden for linked or invited partners, not this one.)
- The link is built from the member's handle at that moment. If the handle changes later, the link changes too. The PRD should say whether old links keep working.
- Points and limits are as §13 sets them: +10 Sunlight once the friend finishes onboarding, up to 10 referrals a month, and once per new account.

---

## 7. Avatar background colour

**PRD to update:** §5 screen 6 (Photo or avatar) and §6 (profile fields and what others see).

**Where:** onboarding screen 6, and Edit profile on the Dashboard, under the avatar picker.

**Field**

| Field | Type | Required | Rules |
|---|---|---|---|
| Avatar background | Single choice | Required, with a default | Green, Coral, Yellow, Blue, Pink, Purple (pale tints of the brand palette). Default Green |

**Behaviour**
- The avatar picker previews every character on the chosen colour.
- Other members see the colour everywhere the avatar shows. Members without a preset avatar show their initial, in a darker shade of the same colour.
- The colour is shown alongside the avatar, which §6 already makes always visible, so it needs no visibility setting of its own.
- Accessibility: the swatches form a radio group named "Avatar background". Each swatch is labelled, for example "Coral background".

---

## 8. Avatar picker inside the "Complete your profile" card

**PRD to update:** §5, the "Complete your profile" card rule (FG-ONB-04).

**Where:** the Feed, in the "Complete your profile" card, only while the member has neither a photo nor a preset avatar.

**What it shows**
- "Pick a grove avatar" with the first 6 grove avatars as one-tap choices.
- A link, "See all 12", which opens the Dashboard's Edit profile.

**Behaviour**
- One tap saves that avatar straight away, with the toast "Avatar saved. Change it any time on your profile." The avatar choice then leaves the card.
- The card's other gaps still show as links: "Add a diagnosis", "Add your path to parenthood", "Write a line about you" and "Share your story". The card disappears when everything is filled.
- The card's close button reads "Hide for 30 days", as the PRD rule says. In the prototype it hides the card for good. The 30-day return isn't built.

---

## 9. Sign-out confirmation

**PRD to update:** §4 (sign-in and sign-out).

**Where:**
- the account menu at the foot of the desktop sidebar ("Sign out").
- the phone menu sheet ("Sign out" button).

**What it does**
- Signing out asks first, in a dialog:
  - title: "Sign out of Fertility Grove?"
  - description: "You can sign back in any time with your email or Google."
  - buttons: "Sign out" (red) and "Cancel".
- Confirming signs out and lands on the sign-in screen.
- If a form on the page has unsaved changes, the unsaved-changes dialog (item 10) comes first. The sign-out question follows only if the member chooses to leave.

**Inconsistency to settle:** during onboarding, the "Sign out" link in the header signs out at once, with no confirmation, and goes to the landing page. The PRD should say whether onboarding asks too.

---

## 10. Unsaved-changes warning

**PRD to update:** §21 (quality, privacy and security) or a cross-cutting "Forms" rule.

**Forms it protects**

| Form | Where | "Save and leave" offered |
|---|---|---|
| Write a post | `/posts/new` | No |
| Edit a post | `/posts/[id]` | Yes |
| Share your story | `/stories/new` | No |
| Edit profile | Dashboard, `?edit=1` | Yes |
| Settings: Account (email, password) | `/settings` | Yes |
| Settings: Your journey | `/settings` | Yes |
| Mentor setup | `/mentors/setup` | Yes |
| Family note, editing | `/family/notes/[id]` | Yes |
| Appointment question list, editing a question | `/guide/appointments/[id]` | Yes when editing an existing question. No when adding a new one |

**When it asks:** only while the form has edits nobody saved, when the member:
- follows any link inside the app (sidebar, tab bar, menus, links on the page).
- presses the browser's Back button.
- switches Settings sections.
- signs out.
- closes Edit profile with its close button or "Cancel".

Links to another part of the same page (`#section`) don't count as leaving.

**Dialog**
- Title: "You have unsaved changes"
- Description: "If you leave now, what you've changed on this page won't be kept."
- Buttons: "Save and leave" (only where the form can save in place), "Leave without saving" and "Keep editing".

**Rules**
- "Save and leave" runs the form's normal save and its validation. If the save fails, the dialog closes and the member stays with the errors shown.
- Closing or reloading the browser tab shows the browser's own "Leave site?" prompt. Browsers don't allow a custom dialog there.
- A form that has just been submitted successfully never asks.

---

## 11. Floating Grove Guide button

**PRD to update:** §17 (how members open the Grove Guide). The PRD doesn't say where the Guide is opened from.

**Where:** every screen of the signed-in app, fixed in the bottom-right corner. On phones it sits just above the tab bar. Not shown:
- on the Grove Guide's own screens (`/guide` and below).
- in an open conversation (`/messages/[id]`).
- on public, sign-in and onboarding screens.

**What it shows**
- Desktop and tablet: the orange-and-sparkle mark, the label "Grove Guide" and an "AI" tag.
- Phone: the mark only.
- Its accessible name is "Ask Grove Guide, the AI assistant".

**Behaviour**
- Tapping it opens the Grove Guide (`/guide`).
- The label folds away while the member scrolls down past the top of the page, and comes back as soon as they scroll up. The mark always stays.
- It is not a navigation item. The Guide isn't listed in the sidebar or the tab bar.

---

## 12. A separate Saved page, including saved stories

**PRD to update:**
- §9 ("Saved posts are private and listed under Saved on the member's profile").
- §10 (saving success stories isn't in the PRD).
- §16 (saved articles).

**Where:** route `/saved`. Reached from:
- the "Yours" section of the desktop sidebar ("Saved").
- the phone menu sheet.
- the Dashboard's Saved tab ("Manage saved").

**What it shows**
- Title "Saved". The subtitle reads "{n} saved items to bring to your next appointment.", or "Keep posts, stories and articles here to find again before your next appointment." when nothing is saved.
- Tabs: All, Posts, Stories, Articles. Each type tab shows its count when above zero. "All" lists articles, then posts, then stories.
- Rows by type:
  - Article: "Article · N min read", title, one-line summary on wider screens, and a bookmark to remove it.
  - Post: the standard post card, with its own bookmark.
  - Story: type chip, author, title linking to Success stories, a 2-line excerpt, and a bookmark to remove it.
- Removing an item folds it away, with the toast "Removed from saved". Items already there stay still; newly saved ones rise in.

**Saving success stories (new):** success stories carry a bookmark, and saved stories appear here and on the Dashboard. The PRD only defines saved posts and saved articles.

**Extras on the page**
- **"Worth saving"**: when fewer than 4 items are saved, up to 3 Learn articles not yet saved are suggested. Articles matching the member's diagnosis come first. Each has a one-tap bookmark, with the toast "Saved". Subtitle: "Clinician-reviewed, and matched to your journey where we can."
- **"Before your appointment"** panel:
  - "Make a question list" (or "Your question lists · N lists ready to print or share") → `/guide/appointments`.
  - "Share with your partner" (or "Share with {partner}" when linked) → `/family`.
- Privacy note: "Only you can see what you save."

**Empty states**
- Nothing saved: "Nothing saved yet." / "Tap the bookmark on any post, story or article and it waits for you here." Button: "Browse Learn".
- A type tab with none: "No saved {posts | stories | articles} yet. Tap the bookmark on one and it shows up here."
