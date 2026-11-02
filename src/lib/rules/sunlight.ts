/* Sunlight and tree levels, PRD v2.0 §13. Levels never drop: a member's level
   is the highest threshold they have ever reached. */

import type { TreeLevel } from "../types";

export const LEVELS: { level: TreeLevel; at: number; unlocks: string }[] = [
  { level: "Seed", at: 0, unlocks: "Full access to Fertility Grove." },
  { level: "Bush", at: 50, unlocks: "Your Bush badge, next to your name everywhere." },
  { level: "Tree", at: 250, unlocks: "Your Tree badge, next to your name everywhere." },
  {
    level: "Blossom Tree",
    at: 750,
    unlocks: "Mentoring is now available. You can help newer members one to one.",
  },
  { level: "Orange Tree", at: 2000, unlocks: "The top level badge in the grove." },
];

export const POINTS = {
  upvote: 1,
  downvote: -1,
  follower: 2,
  referral: 10,
  upvoteDailyCap: 100,
  followerDailyCap: 20,
  referralMonthlyCap: 10,
};

export function levelFor(sunlight: number): TreeLevel {
  let current: TreeLevel = "Seed";
  for (const l of LEVELS) if (sunlight >= l.at) current = l.level;
  return current;
}

/** Applies "levels never drop": keep the higher of the stored and earned level. */
export function keepLevel(stored: TreeLevel, sunlight: number): TreeLevel {
  const earned = levelFor(sunlight);
  return levelIndex(earned) > levelIndex(stored) ? earned : stored;
}

export const levelIndex = (l: TreeLevel) => LEVELS.findIndex((x) => x.level === l);

export function nextLevel(level: TreeLevel) {
  return LEVELS[levelIndex(level) + 1];
}

/** Progress toward the next level as 0–1, measured from the current threshold. */
export function progress(level: TreeLevel, sunlight: number) {
  const here = LEVELS[levelIndex(level)];
  const next = nextLevel(level);
  if (!next) return 1;
  return Math.max(0, Math.min(1, (sunlight - here.at) / (next.at - here.at)));
}

export const canMentor = (level: TreeLevel, founding: boolean) =>
  founding || levelIndex(level) >= levelIndex("Blossom Tree");
