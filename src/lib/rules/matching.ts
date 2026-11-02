/* Matching, PRD v2.0 §11. Signals in order: diagnosis, journey stage, path,
   treatment, then what the member is looking for. Region (from ZIP) is used in
   the background only and never appears in a reason. */

import type { Group, Member } from "../types";

export interface Journey {
  diagnoses: string[];
  stages: string[];
  paths: string[];
  treatments: string[];
}

const lc = (s: string) => s.toLowerCase();

/** "Matched on endometriosis and IVF": the first two shared signals, lower-cased
 *  except for acronyms. */
export function reason(shared: string[]) {
  const pretty = shared.map((s) => (/^[A-Z]{2,}/.test(s) ? s : lc(s)));
  if (!pretty.length) return "Popular in the grove";
  return `Matched on ${pretty.slice(0, 2).join(" and ")}`;
}

function journeyTerms(j: Journey) {
  return [...j.diagnoses, ...j.stages, ...j.treatments, ...j.paths].filter(
    (t) => !["Other", "Prefer not to share", "Not sure yet", "Own eggs and sperm", "Not diagnosed yet"].includes(t),
  );
}

export function matchGroups(j: Journey, groups: Group[], hidden: string[] = [], limit = 5) {
  const terms = journeyTerms(j);
  const scored = groups
    .filter((g) => g.status === "active" && !hidden.includes(g.id))
    .map((g) => {
      const shared = terms.filter((t) =>
        g.tags.some((tag) => lc(tag) === lc(t)),
      );
      // Diagnosis matches weigh most, then stage, then the rest.
      const score =
        shared.filter((s) => j.diagnoses.includes(s)).length * 4 +
        shared.filter((s) => j.stages.includes(s) || j.treatments.includes(s)).length * 2 +
        shared.length;
      return { group: g, shared, score };
    });
  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (matched.length) {
    return matched.slice(0, limit).map((s) => ({ group: s.group, why: reason(s.shared) }));
  }
  // No answers: popular groups, by activity.
  return scored
    .sort((a, b) => b.group.postsThisWeek - a.group.postsThisWeek)
    .slice(0, limit)
    .map((s) => ({ group: s.group, why: "Popular in the grove" }));
}

export function matchPeople(
  j: Journey,
  members: Member[],
  opts: { exclude: string[]; mentorsOnly?: boolean; limit?: number },
) {
  const terms = journeyTerms(j);
  return members
    .filter(
      (m) =>
        m.suggestMe &&
        !m.unavailable &&
        !m.badges.includes("team") &&
        !opts.exclude.includes(m.id) &&
        (!opts.mentorsOnly || (m.mentor && !m.mentor.paused)),
    )
    .map((m) => {
      const theirs = [...m.diagnoses, ...m.stages, ...m.paths];
      const shared = terms.filter((t) => theirs.some((x) => lc(x) === lc(t)));
      const mentorFull =
        m.mentor && m.mentor.activeMentees + m.mentor.waiting >= m.mentor.capacity;
      return { member: m, shared, mentorFull };
    })
    .filter((x) => x.shared.length > 0 && (!opts.mentorsOnly || !x.mentorFull))
    .sort((a, b) => b.shared.length - a.shared.length)
    .slice(0, opts.limit ?? 5)
    .map((x) => ({
      member: x.member,
      // A private journey still matches, but the reason stays vague.
      why: x.member.shareJourney ? reason(x.shared) : "Similar journey",
    }));
}
