/* Server-safe reads for server layouts (no client hooks). TODO(api): ask the public group
   endpoint; the server only knows the sample groups. */

import { GROUPS } from "@/lib/mock-server/seed/groups";
import { groupOpenToGuests } from "@/lib/rules/guests";
import type { Group } from "@/types/domain";

/** The group when it is visible to guests (so it may be listed, PRD v1.2 §10), otherwise null. */
export function listedGroup(id: string): Group | null {
  const group = GROUPS.find((g) => g.id === id);
  return group && groupOpenToGuests(group) ? group : null;
}
