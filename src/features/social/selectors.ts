/* Derived views the screens read: pure functions of the mock server's state. */

import { journey } from "@/features/auth";
import type { State } from "@/lib/mock-server";
import { matchPeople } from "@/lib/rules/matching";

export const peopleMatches = (s: State, limit = 5) =>
  matchPeople(journey(s), s.members, {
    exclude: [...s.blocked, ...s.notForMe, ...s.following],
    limit,
  });
