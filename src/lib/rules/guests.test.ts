import { describe, expect, it } from "vitest";

import { groupOpenToGuests, guestCanRead, publicAuthor, publicPostState } from "@/lib/rules/guests";
import type { Group, Member, Post } from "@/types/domain";

const group = (over: Partial<Group> = {}): Group => ({
  id: "g-pcos",
  name: "PCOS",
  description: "",
  whoFor: "",
  type: "Diagnosis",
  tags: ["PCOS"],
  readAccess: "any",
  status: "active",
  visibleToGuests: true,
  community: "both",
  members: 10,
  postsThisWeek: 1,
  ...over,
});

const member = (over: Partial<Member> = {}): Member => ({
  id: "m-1",
  handle: "hopeful_annie",
  firstName: "Annie",
  lastInitial: "K",
  showRealName: false,
  pronouns: "she/her",
  avatarHue: "green",
  sunlight: 300,
  level: "Tree",
  badges: [],
  community: "womens",
  aboutMe: "About me",
  myStory: "My story",
  shareJourney: true,
  diagnoses: ["PCOS"],
  stages: ["Trying to conceive"],
  paths: ["IVF"],
  followers: 4,
  messagePolicy: "anyone",
  suggestMe: true,
  credentials: "RN",
  mentor: {
    bio: "",
    helpsWith: [],
    capacity: 2,
    activeMentees: 0,
    waiting: 0,
    paused: false,
  },
  follows: ["m-2"],
  joinedDaysAgo: 30,
  blocks: ["m-3"],
  ...over,
});

const post = (over: Partial<Post> = {}): Post => ({
  id: "p-1",
  groupId: "g-pcos",
  authorId: "m-1",
  type: "Question",
  title: "Letrozole timing",
  body: "When did you start?",
  tags: [],
  allowSharing: true,
  showToVisitors: true,
  minutesAgo: 5,
  up: 0,
  down: 0,
  myVote: 0,
  saved: false,
  status: "published",
  ...over,
});

describe("groupOpenToGuests", () => {
  it("opens a live group that is visible to guests and readable by anyone", () => {
    expect(groupOpenToGuests(group())).toBe(true);
    expect(groupOpenToGuests(group({ status: "archived" }))).toBe(true);
  });

  it("stays closed for missing, hidden, members-only or draft groups", () => {
    expect(groupOpenToGuests(undefined)).toBe(false);
    expect(groupOpenToGuests(group({ visibleToGuests: false }))).toBe(false);
    expect(groupOpenToGuests(group({ readAccess: "members-only" }))).toBe(false);
    expect(groupOpenToGuests(group({ status: "draft" }))).toBe(false);
  });
});

describe("guestCanRead", () => {
  it("shows a published, visitor-visible post in an open group", () => {
    expect(guestCanRead(post(), group(), member())).toBe(true);
  });

  it.each<[string, Post, Group | undefined, Member | undefined]>([
    ["the group is closed to guests", post(), group({ visibleToGuests: false }), member()],
    ["the group is members-only", post(), group({ readAccess: "members-only" }), member()],
    ["the group is missing", post(), undefined, member()],
    ["the post is not shown to visitors", post({ showToVisitors: false }), group(), member()],
    ["the post is held", post({ status: "held" }), group(), member()],
    ["the post is removed", post({ status: "removed" }), group(), member()],
    ["the post is deleted", post({ status: "deleted" }), group(), member()],
    ["the post waits in the crisis queue", post({ crisisPending: true }), group(), member()],
    ["the author is missing", post(), group(), undefined],
    ["the author is suspended", post(), group(), member({ unavailable: "suspended" })],
    ["the author is deleting", post(), group(), member({ unavailable: "deleting" })],
  ])("hides the post when %s", (_why, p, g, a) => {
    expect(guestCanRead(p, g, a)).toBe(false);
  });
});

describe("publicPostState", () => {
  it("lists posts guests can read", () => {
    expect(publicPostState(post(), group(), member())).toBe("listed");
  });

  it("opens shared posts by link only when the group is not open to guests", () => {
    expect(publicPostState(post({ showToVisitors: false }), group(), member())).toBe("link-only");
    expect(publicPostState(post(), group({ visibleToGuests: false }), member())).toBe("link-only");
  });

  it("keeps a draft group's posts unavailable, even when sharing is on", () => {
    // Regression: only readAccess was checked, so a draft group's post opened by link.
    const draft = group({ status: "draft" });
    expect(publicPostState(post({ showToVisitors: false }), draft, member())).toBe("unavailable");
  });

  it("still opens an archived group's shared post by link", () => {
    const archived = group({ status: "archived", visibleToGuests: false });
    expect(publicPostState(post(), archived, member())).toBe("link-only");
  });

  it("keeps members-only and unshared posts unavailable", () => {
    const membersOnly = group({ readAccess: "members-only", visibleToGuests: false });
    expect(publicPostState(post(), membersOnly, member())).toBe("unavailable");
    expect(
      publicPostState(post({ allowSharing: false, showToVisitors: false }), group(), member()),
    ).toBe("unavailable");
  });

  it.each<[string, Post | undefined, Member | undefined]>([
    ["the post is missing", undefined, member()],
    ["the author is missing", post(), undefined],
    ["the author is unavailable", post(), member({ unavailable: "suspended" })],
    ["the post is held", post({ status: "held" }), member()],
    ["the post is in the crisis queue", post({ crisisPending: true }), member()],
  ])("is unavailable when %s, even by link", (_why, p, a) => {
    expect(publicPostState(p, group(), a)).toBe("unavailable");
  });

  it("is unavailable when the group is missing and the post is not listed", () => {
    expect(publicPostState(post(), undefined, member())).toBe("unavailable");
  });
});

describe("publicAuthor", () => {
  it("never shows any part of the real name for a member using a handle", () => {
    const shown = publicAuthor(member({ showRealName: false }));
    expect(shown.firstName).toBe("");
    expect(shown.lastInitial).toBe("");
    expect(shown.handle).toBe("hopeful_annie");
  });

  it("keeps the real name when the member chose to show it", () => {
    const shown = publicAuthor(member({ showRealName: true }));
    expect(shown.firstName).toBe("Annie");
    expect(shown.lastInitial).toBe("K");
  });

  it("strips the profile, journey, social graph and mentor details", () => {
    const shown = publicAuthor(member());
    expect(shown.aboutMe).toBeUndefined();
    expect(shown.myStory).toBeUndefined();
    expect(shown.diagnoses).toEqual([]);
    expect(shown.stages).toEqual([]);
    expect(shown.paths).toEqual([]);
    expect(shown.follows).toEqual([]);
    expect(shown.blocks).toBeUndefined();
    expect(shown.mentor).toBeUndefined();
    expect(shown.credentials).toBeUndefined();
  });

  it("keeps the display identity and does not mutate the original", () => {
    const original = member();
    const shown = publicAuthor(original);
    expect(shown).toMatchObject({ id: "m-1", level: "Tree", avatarHue: "green", badges: [] });
    expect(original.diagnoses).toEqual(["PCOS"]);
    expect(original.firstName).toBe("Annie");
  });
});
