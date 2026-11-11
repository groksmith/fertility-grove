/* Sample conversations, mentor requests, notifications and Sunlight history
   for the signed-in demo member. Sunlight history sums to the profile's
   starting Sunlight (asserted below). */

import type {
  Conversation,
  MentorRequest,
  Notification,
  SunlightEvent,
} from "../types";
import { SUPPORT_ID } from "./members";

export const CONVERSATIONS: Conversation[] = [
  {
    id: "cv-maya",
    memberId: "m-maya",
    kind: "mentoring",
    muted: false,
    unread: true,
    messages: [
      { id: "x1", from: "them", body: "Hi! I accepted your request. I remember exactly where you are right now. What's on your mind this week?", minutesAgo: 2880 },
      { id: "x2", from: "me", body: "Thank you so much. Mostly whether to do surgery before IVF. I have a consult on Thursday.", minutesAgo: 2860 },
      { id: "x3", from: "them", body: "That's the big one. Want to make a list of questions together before Thursday? I'll share what I asked.", minutesAgo: 1440 },
      { id: "x4", from: "them", body: "Also: how are you sleeping? That week before a consult was always the worst for me.", minutesAgo: 35 },
    ],
  },
  {
    id: "cv-chloe",
    memberId: "m-chloe",
    kind: "dm",
    muted: false,
    unread: false,
    messages: [
      { id: "y1", from: "them", body: "Saw your post about excision. I'm deciding the same thing! Which clinic are you with?", minutesAgo: 4300 },
      { id: "y2", from: "me", body: "A clinic downtown. Happy to compare notes after Thursday.", minutesAgo: 4200 },
      { id: "y3", from: "them", body: "Yes please. Good luck!", minutesAgo: 4100, attachedPostId: "p-3" },
    ],
  },
  {
    id: "cv-marcus",
    memberId: "m-marcus",
    kind: "dm",
    request: "incoming",
    muted: false,
    unread: true,
    messages: [
      { id: "z1", from: "them", body: "Hi, sorry to message out of the blue. My wife has endo and your post helped us a lot. Could I ask what your RE said about surgery?", minutesAgo: 180 },
    ],
  },
  {
    id: "cv-support",
    memberId: SUPPORT_ID,
    kind: "support",
    muted: false,
    unread: false,
    messages: [
      { id: "s1", from: "them", body: "Welcome to the Fertility Grove beta. If anything feels off, or you just want to tell us how it's going, reply here. A real person reads every message.", minutesAgo: 20160 },
    ],
  },
];

export const MENTOR_REQUESTS: MentorRequest[] = [
  {
    id: "mr-1",
    mentorId: "m-maya",
    menteeId: "me",
    message: "Hi Maya, I have stage III endo and I'm deciding about surgery before IVF. I'd love to hear how you decided.",
    helpWith: ["Endometriosis", "IVF"],
    status: "accepted",
    daysAgo: 3,
  },
  // More than 4, so the Dashboard's Mentoring card shows its order (PRD §6):
  // waiting, connected, then finished ones, newest first. The oldest is cut.
  {
    id: "mr-2",
    mentorId: "m-priya",
    menteeId: "me",
    message: "Hi Priya, could I ask how you kept track of your cycles? I'm starting to feel lost in the numbers.",
    helpWith: ["IVF"],
    status: "waiting",
    daysAgo: 1,
  },
  {
    id: "mr-3",
    mentorId: "m-noah",
    menteeId: "me",
    message: "Hi Noah, my partner is finding this hard to talk about. Could I ask how you two handled it?",
    helpWith: ["Relationships"],
    status: "declined",
    note: "I'm stretched thin right now. Please try again in a month.",
    daysAgo: 16,
  },
  {
    id: "mr-4",
    mentorId: "m-dana",
    menteeId: "me",
    message: "Hi Dana, I'd love to hear how you decided between clinics.",
    helpWith: ["IVF"],
    status: "expired",
    daysAgo: 30,
  },
  {
    id: "mr-5",
    mentorId: "m-dana",
    menteeId: "me",
    message: "Hi Dana, I was just diagnosed and don't know where to begin.",
    helpWith: ["Endometriosis"],
    status: "ended",
    daysAgo: 44,
  },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n-1", kind: "reply", text: "Dr. Lena O. answered your question in Endometriosis", href: "/posts/p-1", minutesAgo: 50, read: false, actorId: "m-lena" },
  { id: "n-2", kind: "message", text: "Maya R. sent you a message", href: "/messages/cv-maya", minutesAgo: 35, read: false, actorId: "m-maya" },
  { id: "n-3", kind: "message-request", text: "@marcus_mf sent you a message request", href: "/messages/cv-marcus", minutesAgo: 180, read: false, actorId: "m-marcus" },
  { id: "n-4", kind: "follow", text: "@jules_waits started following you", href: "/u/jules_waits", minutesAgo: 400, read: true, actorId: "m-jules" },
  { id: "n-5", kind: "match", text: "3 new people on your path this week", href: "/feed#people", minutesAgo: 1440, read: true },
  { id: "n-6", kind: "mentor", text: "Maya R. accepted your mentor request", href: "/messages/cv-maya", minutesAgo: 2880, read: true, actorId: "m-maya" },
];

export const SUNLIGHT_HISTORY: SunlightEvent[] = [
  { id: "sh-1", label: "Upvotes on “Did anyone do excision surgery before starting IVF?”", amount: 14, daysAgo: 0 },
  { id: "sh-2", label: "Upvotes on your comments", amount: 41, daysAgo: 2 },
  { id: "sh-3", label: "New followers (6)", amount: 12, daysAgo: 4 },
  { id: "sh-4", label: "Upvotes on “Questions I'm bringing to my RE consult”", amount: 88, daysAgo: 9 },
  { id: "sh-5", label: "A friend you invited finished onboarding", amount: 10, daysAgo: 12 },
  { id: "sh-6", label: "Upvotes on older posts", amount: 107, daysAgo: 21 },
  { id: "sh-7", label: "Downvote on a comment", amount: -1, daysAgo: 25 },
];

/** The demo member's Sunlight is the sum of the history above. */
export const DEMO_SUNLIGHT = SUNLIGHT_HISTORY.reduce((s, e) => s + e.amount, 0);
console.assert(DEMO_SUNLIGHT === 271, "Sunlight history must add up to the profile total");

export const GUIDE_STARTERS: Record<string, string[]> = {
  Endometriosis: [
    "Should I have surgery for endometriosis before IVF?",
    "How can endometriosis affect egg quality?",
    "What questions should I ask about an endometrioma?",
  ],
  PCOS: [
    "How does letrozole help with PCOS?",
    "How do I know if I ovulated on a medication cycle?",
    "Can lifestyle changes help ovulation with PCOS?",
  ],
  "Diminished ovarian reserve": [
    "What does a low AMH result mean?",
    "Does low AMH mean my eggs are poor quality?",
    "When do people consider donor eggs?",
  ],
  "Male factor infertility": [
    "What does a semen analysis measure?",
    "What is ICSI and when is it used?",
    "What can a urologist check for?",
  ],
  "Recurrent pregnancy loss": [
    "What testing is done after recurrent pregnancy loss?",
    "What does it mean if no cause is found?",
    "How can I prepare for a pregnancy after loss?",
  ],
  Unexplained: [
    "What does unexplained infertility mean?",
    "How many IUI cycles do people try before IVF?",
    "Can IVF find causes that tests missed?",
  ],
  default: [
    "What tests are usually done in a fertility workup?",
    "What's the difference between IUI and IVF?",
    "How do I prepare for my first fertility consultation?",
  ],
};
