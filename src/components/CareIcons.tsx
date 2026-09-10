"use client";

import type { ProviderCategory } from "@/lib/types";

/* The Care Guide tile artwork is exported verbatim from the Figma file
   (`public/illustrations/care-*.svg`), so the tiles match the design exactly. */

const SLUG: Record<ProviderCategory, string> = {
  IVF: "ivf",
  IUI: "iui",
  "Talk Therapy": "talk-therapy",
  "Home Support": "home-support",
  Medication: "medication",
  Acupuncture: "acupuncture",
  Nutrition: "nutrition",
  Psychiatry: "psychiatry",
  "Red Light Therapy": "red-light-therapy",
  "Massage Therapy": "massage-therapy",
  Supplements: "supplements",
  Reiki: "reiki",
};

export function CareIcon({
  category,
  size = 72,
}: {
  category: ProviderCategory;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/illustrations/care-${SLUG[category]}.svg`}
      alt=""
      aria-hidden
      style={{ height: size, width: "auto", maxWidth: "100%" }}
    />
  );
}
