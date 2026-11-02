# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** a US adult going through infertility (waiting on tests, newly diagnosed, in treatment, taking a break, or moving forward without treatment), or exploring fertility preservation. Mostly on a phone, often late at night or before or after an appointment. Their job: find people on the same path, get answers they can trust for their own case, and prepare for doctor visits.
- **Second audience:** the member's partner or spouse. They join by invite with their own private account, and they want to understand what is happening, support their partner and talk to other partners.
- **Mentors:** experienced members (Blossom Tree level or Founding mentor badge) who help newer members one to one.
- Moderators and admins exist in the PRD but are out of scope for this prototype.

## Product Purpose

A private community for people going through infertility, and their partners. A member describes their situation once and lands in the right groups with people on the same path. They get trusted answers from a clinician-reviewed library and the Grove Guide AI, connect one to one with peers and mentors, and bring their partner in.

Success (North Star): members who gave or received help in a week.

## Positioning

- **Matched, not general:** members are matched by diagnosis, journey stage and path to parenthood, and every match says why ("Matched on endometriosis and IVF").
- **Reviewed answers:** the Learn library is clinician-reviewed, and the Grove Guide answers only from it.
- **Experienced help:** mentors who have been through it, with no application.
- **Private by default:** handles by default, no ad trackers, health data never sold, and success stories kept in their own space.
- **Partners included:** partners have their own accounts and community.

## Operating Context

- US only, English, web (phone-first). Invite-only 8-week beta with 100–300 members.
- The source of truth is `docs/Fertility-Grove-MVP-PRD-v2.0.docx` (v2.0, Oct 21, 2026).
- This repository is a **front-end-only clickable prototype**. All data is mocked and kept in localStorage, and there is no backend.

## Capabilities and Constraints

- **In scope (PRD v2.0):**
  - Auth and beta invites, the 8-screen onboarding with health-data consent, and profiles with privacy settings.
  - Partner accounts and the family space.
  - Two communities and groups; posts with types, sources and votes; success stories.
  - Follows, people search, matching, mentors, Sunlight and tree levels (Seed, Bush, Tree, Blossom Tree, Orange Tree).
  - Direct messages, notifications, the Learn library (6 articles), Grove Guide AI, AI credits and checkout.
  - Reporting and crisis resources (988).
- **Out of scope:** the Care Guide or provider directory (Phase 2); fundraising, wishlists and gifts (Phase 3); to-dos, records and the daily quote; and the admin panel (out of this prototype).
- **Never:** medical advice, diagnosis or dosing. Copy must never suggest live monitoring.
- **Open in the PRD:** credit numbers and pack prices, the final points and level names, and the launch group list. The prototype uses labelled sample values.

## Brand Commitments

- The name is Fertility Grove. The live site, https://www.fertilitygrove.com/, is the visual reference: white and light, the orange logo, watercolour orange trees, Instrument Serif + Instrument Sans, and the near-black pill button.
- **The logo (orange with leaf beside "fertility GROVE") and every palette value (the live site's colours plus the approved v1 palette) are fixed. Never change, re-tint, extend or replace them.** Redesigns may change layout, components, motion and illustration only.
- Artwork is the brand's own watercolour orange tree (the growth film on the live site). Orange blossoms are white.
- **Voice:** warm, plain and steady, like a kind friend who has been through it. No medical jargon, no toxic positivity, no exclamation-heavy cheer. PRD copy is the reference ("You're all caught up.", "No posts yet. Start the conversation.").

## Evidence on Hand

- The PRD (product facts, exact error and empty-state copy). Member quotes in the PRD are research, not testimonials. Do not put them on the landing page.
- **No statistics on the landing page** (user decision). There are no testimonials, member counts, press, clinician names or reviews, and none may be invented. Sample clinicians and reviewers must be fictional and labelled as samples.

## Product Principles

1. Safety first: crisis resources are always one tap away, and safety rules never bend for growth.
2. Private by default: the member decides what anyone else sees.
3. Every suggestion explains why it was made.
4. Kind empty states: say so gently and offer exactly one next step.
5. Help is the currency: Sunlight rewards being useful to others, not volume.

## Accessibility & Inclusion

- WCAG 2.2 AA.
- Inclusive gender and pronoun options (PRD §5), and partner language that doesn't assume gender.
- Phone-first, with motion that respects reduced-motion settings.
