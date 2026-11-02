import type { Hue } from "./types";

/** Text colour for a hue's pale tint. Coral and pink inks fall under 4.5:1 on
 *  their own tints, so text there is ink; the tint and an outline carry the hue. */
export const hueInk = (h: Hue) => (h === "coral" || h === "pink" ? "var(--ink-soft)" : `var(--${h}-700)`);
