/* Crisis detection, PRD v2.0 §19. The real product pairs an admin-managed
   phrase list with an automatic detector owned by a clinical advisor; this mock
   uses a short phrase list so the flows can be demonstrated. */

const PHRASES = [
  "want to die",
  "kill myself",
  "end my life",
  "ending it all",
  "no reason to live",
  "hurt myself",
  "self harm",
  "self-harm",
  "suicide",
  "suicidal",
  "better off without me",
];

/** Method or plan language: the post is held while the team checks in. */
const HIGH_CONFIDENCE = ["tonight", "pills", "have a plan", "my plan", "goodbye forever"];

export type CrisisLevel = "none" | "signal" | "high";

export function detectCrisis(text: string): CrisisLevel {
  const t = text.toLowerCase();
  if (!PHRASES.some((p) => t.includes(p))) return "none";
  return HIGH_CONFIDENCE.some((p) => t.includes(p)) ? "high" : "signal";
}

export const HELD_MESSAGE =
  "We've held your post for a moment so our team can check in. You're not alone. If you're in danger now, call or text 988.";
