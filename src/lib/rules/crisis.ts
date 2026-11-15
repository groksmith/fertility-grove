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
  "selfharm",
  "suicide",
  "suicidal",
  "better off without me",
];

/** Method or plan language: the post is held while the team checks in. */
const HIGH_CONFIDENCE = ["tonight", "pills", "have a plan", "my plan", "goodbye forever"];

export type CrisisLevel = "none" | "signal" | "high";

/** Lower-cased, with phone keyboards' curly apostrophes made straight and every run of
 *  whitespace (double spaces, line breaks, tabs) collapsed to one space, so phrase checks see
 *  "can't  cope\n" the way they see "can't cope". */
export function normalizeText(text: string) {
  return text.toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/\s+/g, " ").trim();
}

export function detectCrisis(text: string): CrisisLevel {
  const t = normalizeText(text);
  if (!PHRASES.some((p) => t.includes(p))) return "none";
  return HIGH_CONFIDENCE.some((p) => t.includes(p)) ? "high" : "signal";
}

export const HELD_MESSAGE =
  "We've held your post for a moment so our team can check in. You're not alone. If you're in danger now, call or text 988.";
