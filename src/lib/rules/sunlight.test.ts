import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  LEVELS,
  POINTS,
  canMentor,
  keepLevel,
  levelFor,
  levelIndex,
  nextLevel,
  progress,
} from "@/lib/rules/sunlight";
import type { TreeLevel } from "@/types/domain";

const ALL_LEVELS: TreeLevel[] = ["Seed", "Bush", "Tree", "Blossom Tree", "Orange Tree"];
const anyLevel = fc.constantFrom(...ALL_LEVELS);

describe("LEVELS", () => {
  it("lists the five tree levels in order with PRD thresholds", () => {
    expect(LEVELS.map((l) => [l.level, l.at])).toEqual([
      ["Seed", 0],
      ["Bush", 50],
      ["Tree", 250],
      ["Blossom Tree", 750],
      ["Orange Tree", 2000],
    ]);
  });

  it("says Blossom Tree unlocks mentoring", () => {
    expect(LEVELS.find((l) => l.level === "Blossom Tree")?.unlocks).toMatch(/Mentoring/);
  });
});

describe("POINTS", () => {
  it("matches the Sunlight earning rules and caps", () => {
    expect(POINTS).toEqual({
      upvote: 1,
      downvote: -1,
      follower: 2,
      referral: 10,
      upvoteDailyCap: 100,
      followerDailyCap: 20,
      referralMonthlyCap: 10,
    });
  });
});

describe("levelFor", () => {
  it.each([
    [0, "Seed"],
    [49, "Seed"],
    [50, "Bush"],
    [249, "Bush"],
    [250, "Tree"],
    [749, "Tree"],
    [750, "Blossom Tree"],
    [1999, "Blossom Tree"],
    [2000, "Orange Tree"],
    [100000, "Orange Tree"],
  ] as const)("%i Sunlight is %s", (sunlight, level) => {
    expect(levelFor(sunlight)).toBe(level);
  });

  it("treats negative Sunlight as Seed", () => {
    expect(levelFor(-25)).toBe("Seed");
  });

  it("is monotonic in Sunlight", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 5000 }), fc.nat(5000), (a, delta) => {
        expect(levelIndex(levelFor(a + delta))).toBeGreaterThanOrEqual(levelIndex(levelFor(a)));
      }),
    );
  });
});

describe("keepLevel", () => {
  it("never drops a level when Sunlight falls", () => {
    expect(keepLevel("Blossom Tree", 10)).toBe("Blossom Tree");
    expect(keepLevel("Orange Tree", 0)).toBe("Orange Tree");
  });

  it("raises the level when Sunlight earns a higher one", () => {
    expect(keepLevel("Seed", 750)).toBe("Blossom Tree");
    expect(keepLevel("Bush", 2000)).toBe("Orange Tree");
  });

  it("is always at least the stored level and the earned level", () => {
    fc.assert(
      fc.property(anyLevel, fc.integer({ min: -100, max: 5000 }), (stored, sunlight) => {
        const kept = levelIndex(keepLevel(stored, sunlight));
        expect(kept).toBeGreaterThanOrEqual(levelIndex(stored));
        expect(kept).toBeGreaterThanOrEqual(levelIndex(levelFor(sunlight)));
      }),
    );
  });
});

describe("levelIndex and nextLevel", () => {
  it("indexes levels in order", () => {
    expect(ALL_LEVELS.map(levelIndex)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns the next level, or undefined at the top", () => {
    expect(nextLevel("Seed")?.level).toBe("Bush");
    expect(nextLevel("Tree")?.level).toBe("Blossom Tree");
    expect(nextLevel("Orange Tree")).toBeUndefined();
  });
});

describe("progress", () => {
  it("measures from the current threshold to the next", () => {
    expect(progress("Seed", 0)).toBe(0);
    expect(progress("Seed", 25)).toBe(0.5);
    expect(progress("Tree", 500)).toBe(0.5);
    expect(progress("Blossom Tree", 750)).toBe(0);
  });

  it("is full at the top level", () => {
    expect(progress("Orange Tree", 2000)).toBe(1);
    expect(progress("Orange Tree", 0)).toBe(1);
  });

  it("clamps when a kept level's Sunlight has dropped below its threshold", () => {
    expect(progress("Blossom Tree", 100)).toBe(0);
    expect(progress("Seed", 10000)).toBe(1);
  });

  it("always stays within 0 and 1", () => {
    fc.assert(
      fc.property(anyLevel, fc.integer({ min: -1000, max: 10000 }), (level, sunlight) => {
        const p = progress(level, sunlight);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }),
    );
  });
});

describe("canMentor", () => {
  it("unlocks mentoring at Blossom Tree and above", () => {
    expect(canMentor("Seed", false)).toBe(false);
    expect(canMentor("Bush", false)).toBe(false);
    expect(canMentor("Tree", false)).toBe(false);
    expect(canMentor("Blossom Tree", false)).toBe(true);
    expect(canMentor("Orange Tree", false)).toBe(true);
  });

  it("lets founding mentors mentor at any level", () => {
    for (const level of ALL_LEVELS) expect(canMentor(level, true)).toBe(true);
  });

  it("unlocks mentoring once a member reaches 750 Sunlight", () => {
    expect(canMentor(keepLevel("Tree", 749), false)).toBe(false);
    expect(canMentor(keepLevel("Tree", 750), false)).toBe(true);
  });
});
