/* Derived views the screens read: pure functions of the mock server's state. */

import type { State } from "@/lib/mock-server";

/** What the "Complete your profile" card lists (PRD §5): what was skipped. */
export function profileGaps(s: State) {
  const gaps: { key: string; label: string; href: string }[] = [];
  if (s.me.healthConsent && !s.me.diagnoses.length)
    gaps.push({ key: "diagnosis", label: "Add a diagnosis", href: "/settings#journey" });
  if (s.me.healthConsent && !s.me.paths.length)
    gaps.push({ key: "path", label: "Add your path to parenthood", href: "/settings#journey" });
  if (!s.me.hasPhoto && s.me.avatarPreset < 0)
    gaps.push({ key: "photo", label: "Choose a photo or avatar", href: "/dashboard?edit=1" });
  if (!s.me.aboutMe)
    gaps.push({ key: "aboutMe", label: "Write a line about you", href: "/dashboard?edit=1" });
  if (!s.me.myStory)
    gaps.push({ key: "story", label: "Share your story", href: "/dashboard?edit=1" });
  return gaps;
}

/** What GET /api/v1/profile/me says about the "Complete your profile" card.
    The backend's keys are "diagnosis", "path", "photo" and "aboutMe"; it will
    add "story" (My story) too. TODO(api): exists, apart from "story". */
export function profileCompletion(s: State, now = Date.now()) {
  const missingProfileItems = profileGaps(s).map((g) => g.key);
  const hidden = (s.me.profileCardHiddenUntil ?? 0) > now;
  return {
    showProfileCompletionCard: missingProfileItems.length > 0 && !hidden,
    missingProfileItems,
  };
}
