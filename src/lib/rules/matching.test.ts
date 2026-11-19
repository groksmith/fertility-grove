import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Journey } from "@/lib/rules/matching";
import { matchGroups, matchPeople, reason } from "@/lib/rules/matching";
import type { Group, Member } from "@/types/domain";

const group = (id: string, tags: string[], over: Partial<Group> = {}): Group => ({
  id,
  name: id,
  description: "",
  whoFor: "",
  type: "Diagnosis",
  tags,
  readAccess: "any",
  status: "active",
  visibleToGuests: false,
  community: "both",
  members: 10,
  postsThisWeek: 0,
  ...over,
});

const member = (id: string, over: Partial<Member> = {}): Member => ({
  id,
  handle: id,
  firstName: "",
  lastInitial: "",
  showRealName: false,
  avatarHue: "green",
  sunlight: 0,
  level: "Seed",
  badges: [],
  community: "womens",
  shareJourney: true,
  diagnoses: [],
  stages: [],
  paths: [],
  followers: 0,
  messagePolicy: "anyone",
  suggestMe: true,
  follows: [],
  joinedDaysAgo: 1,
  ...over,
});

const journey = (over: Partial<Journey> = {}): Journey => ({
  diagnoses: [],
  stages: [],
  paths: [],
  treatments: [],
  ...over,
});

describe("reason", () => {
  it("names the first two shared signals", () => {
    expect(reason(["Endometriosis", "IVF"])).toBe("Matched on endometriosis and IVF");
    expect(reason(["Endometriosis", "IVF", "Egg retrieval"])).toBe(
      "Matched on endometriosis and IVF",
    );
  });

  it("lower-cases words but keeps acronyms", () => {
    expect(reason(["PCOS"])).toBe("Matched on PCOS");
    expect(reason(["Trying to conceive"])).toBe("Matched on trying to conceive");
  });

  it("falls back to popularity when nothing is shared", () => {
    expect(reason([])).toBe("Popular in the grove");
  });
});

describe("matchGroups", () => {
  const endo = group("g-endo", ["Endometriosis"], { postsThisWeek: 5 });
  const ivf = group("g-ivf", ["IVF"], { postsThisWeek: 50 });
  const ttc = group("g-ttc", ["Trying to conceive"], { postsThisWeek: 20 });
  const pcos = group("g-pcos", ["PCOS"], { postsThisWeek: 30 });
  const all = [ivf, ttc, pcos, endo];

  it("ranks in PRD signal order: diagnosis, then stage, then treatment", () => {
    const j = journey({
      diagnoses: ["Endometriosis"],
      stages: ["Trying to conceive"],
      treatments: ["IVF"],
    });
    const result = matchGroups(j, all);
    expect(result.map((r) => r.group.id)).toEqual(["g-endo", "g-ttc", "g-ivf"]);
    expect(result[0]?.why).toBe("Matched on endometriosis");
    expect(result[2]?.why).toBe("Matched on IVF");
  });

  it("names a shared path before a shared treatment in the reason", () => {
    const j = journey({ paths: ["Donor eggs"], treatments: ["IVF"] });
    const both = group("g-both", ["IVF", "Donor eggs"]);
    expect(matchGroups(j, [both])[0]?.why).toBe("Matched on donor eggs and IVF");
  });

  it("matches tags case-insensitively", () => {
    const result = matchGroups(journey({ diagnoses: ["pcos"] }), all);
    expect(result.map((r) => r.group.id)).toEqual(["g-pcos"]);
  });

  it("skips hidden, archived and draft groups", () => {
    const j = journey({ diagnoses: ["Endometriosis"], treatments: ["IVF"] });
    const archived = group("g-old", ["Endometriosis"], { status: "archived" });
    const draft = group("g-new", ["Endometriosis"], { status: "draft" });
    const result = matchGroups(j, [...all, archived, draft], ["g-endo"]);
    expect(result.map((r) => r.group.id)).toEqual(["g-ivf"]);
  });

  it("ignores non-answers like Other and Prefer not to share", () => {
    const other = group("g-other", ["Other", "Prefer not to share", "Not sure yet"]);
    const j = journey({ diagnoses: ["Other"], stages: ["Prefer not to share"] });
    const result = matchGroups(j, [other, ivf, ttc]);
    expect(result.every((r) => r.why === "Popular in the grove")).toBe(true);
    expect(result[0]?.group.id).toBe("g-ivf");
  });

  it("falls back to the most active groups when there are no answers", () => {
    const result = matchGroups(journey(), all);
    expect(result.map((r) => r.group.id)).toEqual(["g-ivf", "g-pcos", "g-ttc", "g-endo"]);
    expect(result.every((r) => r.why === "Popular in the grove")).toBe(true);
  });

  it("respects the limit", () => {
    expect(matchGroups(journey(), all, [], 2)).toHaveLength(2);
    const many = Array.from({ length: 8 }, (_, i) => group(`g-${i}`, ["IVF"]));
    expect(matchGroups(journey({ treatments: ["IVF"] }), many)).toHaveLength(5);
  });

  it("never returns hidden or inactive groups, nor more than the limit", () => {
    const tag = fc.constantFrom("IVF", "PCOS", "Endometriosis", "Trying to conceive");
    const arbGroup = fc.record({
      id: fc.string({ minLength: 1, maxLength: 4 }),
      tags: fc.array(tag, { maxLength: 3 }),
      status: fc.constantFrom("active", "archived", "draft"),
      postsThisWeek: fc.nat(100),
    });
    fc.assert(
      fc.property(
        fc.array(arbGroup, { maxLength: 10 }),
        fc.array(tag, { maxLength: 3 }),
        fc.nat(6),
        (specs, diagnoses, limit) => {
          const groups = specs.map((s) => group(s.id, s.tags, s as Partial<Group>));
          const hidden = groups.slice(0, 2).map((g) => g.id);
          const result = matchGroups(journey({ diagnoses }), groups, hidden, limit);
          expect(result.length).toBeLessThanOrEqual(limit);
          for (const r of result) {
            expect(r.group.status).toBe("active");
            expect(hidden).not.toContain(r.group.id);
          }
        },
      ),
    );
  });
});

describe("matchPeople", () => {
  const j = journey({ diagnoses: ["Endometriosis"], stages: ["Trying to conceive"] });

  it("ranks members by how many signals they share", () => {
    const one = member("m-one", { diagnoses: ["Endometriosis"] });
    const two = member("m-two", { diagnoses: ["Endometriosis"], stages: ["Trying to conceive"] });
    const none = member("m-none", { diagnoses: ["PCOS"] });
    const result = matchPeople(j, [one, none, two], { exclude: [] });
    expect(result.map((r) => r.member.id)).toEqual(["m-two", "m-one"]);
    expect(result[0]?.why).toBe("Matched on endometriosis and trying to conceive");
  });

  it("keeps a private journey's reason vague", () => {
    const priv = member("m-priv", { diagnoses: ["Endometriosis"], shareJourney: false });
    expect(matchPeople(j, [priv], { exclude: [] })[0]?.why).toBe("Similar journey");
  });

  it("leaves out excluded, unavailable, team and opted-out members", () => {
    const base = { diagnoses: ["Endometriosis"] };
    const members = [
      member("m-me", base),
      member("m-gone", { ...base, unavailable: "suspended" }),
      member("m-team", { ...base, badges: ["team"] }),
      member("m-quiet", { ...base, suggestMe: false }),
      member("m-ok", base),
    ];
    const result = matchPeople(j, members, { exclude: ["m-me"] });
    expect(result.map((r) => r.member.id)).toEqual(["m-ok"]);
  });

  it("only suggests mentors who are open and have room when asked for mentors", () => {
    const mentor = (waiting: number, paused = false) => ({
      bio: "",
      helpsWith: [],
      capacity: 3,
      activeMentees: 1,
      waiting,
      paused,
    });
    const base = { diagnoses: ["Endometriosis"] };
    const members = [
      member("m-plain", base),
      member("m-open", { ...base, mentor: mentor(0) }),
      member("m-paused", { ...base, mentor: mentor(0, true) }),
      member("m-full", { ...base, mentor: mentor(2) }),
    ];
    const mentors = matchPeople(j, members, { exclude: [], mentorsOnly: true });
    expect(mentors.map((r) => r.member.id)).toEqual(["m-open"]);
    // Without the mentor filter, everyone sharing a signal is suggested.
    expect(matchPeople(j, members, { exclude: [] })).toHaveLength(4);
  });

  it("returns nothing when no signal is shared", () => {
    expect(
      matchPeople(journey(), [member("m-a", { diagnoses: ["PCOS"] })], { exclude: [] }),
    ).toEqual([]);
  });

  it("respects the limit, defaulting to 5", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      member(`m-${i}`, { diagnoses: ["Endometriosis"] }),
    );
    expect(matchPeople(j, many, { exclude: [] })).toHaveLength(5);
    expect(matchPeople(j, many, { exclude: [], limit: 2 })).toHaveLength(2);
  });
});
