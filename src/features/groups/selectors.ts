/* Derived views the screens read: pure functions of the mock server's state. */

import { journey } from "@/features/auth";
import type { State } from "@/lib/mock-server";
import { matchGroups } from "@/lib/rules/matching";

export const groupMatches = (s: State, limit = 5) =>
  matchGroups(journey(s), s.groups, s.notForMe, limit);
