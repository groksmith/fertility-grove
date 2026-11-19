"use client";

import type { Hue, Member } from "@/types/domain";
import { AVATARS, Avatar } from "./Avatar";

const AVATAR_HUES: Hue[] = ["green", "coral", "yellow", "blue", "pink", "purple"];

/** The pale backgrounds an avatar can sit on. */
export function HueSwatches({ value, onChange }: { value: Hue; onChange: (h: Hue) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Avatar background"
      className="mt-3 flex flex-wrap items-center gap-2.5"
    >
      {AVATAR_HUES.map((h) => (
        // biome-ignore lint/a11y/useSemanticElements: colour swatches inside a role="radiogroup"; native <input type="radio"> would need a visually-hidden-input rewrite to keep the identical swatch styling
        <button
          key={h}
          type="button"
          role="radio"
          aria-checked={value === h}
          aria-label={`${h.charAt(0).toUpperCase()}${h.slice(1)} background`}
          onClick={() => onChange(h)}
          className={`press h-8 w-8 rounded-full ring-1 ring-line-strong ${value === h ? "ring-2 ring-accent ring-offset-2" : ""}`}
          style={{ background: `var(--${h}-50)` }}
        />
      ))}
    </div>
  );
}

/** Choose a grove avatar: a radio group of the characters in the member's hue. */
export function AvatarPicker({
  member,
  value,
  onChange,
  count = AVATARS.length,
  size = 52,
  name = "avatar",
}: {
  member: Pick<Member, "id" | "firstName" | "handle" | "showRealName" | "avatarHue" | "badges">;
  value: number;
  onChange: (i: number) => void;
  count?: number;
  size?: number;
  name?: string;
}) {
  // The full set sits in two even rows of six; a short row just flows.
  return (
    <div className={count > 6 ? "grid w-fit grid-cols-6 gap-2.5" : "flex flex-wrap gap-2.5"}>
      {AVATARS.slice(0, count).map((a, i) => (
        <label key={a.key} className="press cursor-pointer" title={a.label}>
          <input
            type="radio"
            name={name}
            className="peer sr-only"
            checked={value === i}
            onChange={() => onChange(i)}
          />
          <span
            className={`avatar-pick block rounded-full p-0.5 ring-2 transition-[box-shadow] duration-150 ${value === i ? "ring-accent" : "ring-transparent hover:ring-line-strong"} peer-focus-visible:ring-[var(--focus)]`}
            data-on={value === i ? "" : undefined}
          >
            <Avatar member={{ ...member, avatar: i }} size={size} />
          </span>
          <span className="sr-only">{a.label}</span>
        </label>
      ))}
    </div>
  );
}
