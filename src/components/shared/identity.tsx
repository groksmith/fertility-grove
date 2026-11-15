"use client";

/* How people appear: a grove avatar in their own pale hue, display identity,
   the tree beside the name, and badges. Never age, ZIP or gender (PRD §6). */

import { hueInk } from "@/lib/hue";
import type { Badge, Hue, Member } from "@/types/domain";
import { BadgeCheck, Leaf as LeafIcon } from "lucide-react";
import Image from "next/image";
import { LogoOrange } from "./Logo";

/** The grove avatars: plants, wildlife and landscape painted in the same gouache
    as the rest of the grove (all twelve on one sheet, so they share a hand), so
    anyone can find one that feels like them, whatever their gender or age.
    Nothing cute and nothing that presumes how a journey ends: no babies, eggs or
    storks. `zoom` evens out how much of the circle each subject fills. `move` is
    how it answers when picked: fruit and leaves swing from their stem, plants
    sway from their base, the swallow glides in, and so on. The order is fixed:
    members store an index. */
export const AVATARS = [
  { key: "orange", label: "Orange", zoom: 0.86, move: "hang" },
  { key: "olive", label: "Olive branch", zoom: 0.93, move: "hang" },
  { key: "fern", label: "Fern", zoom: 1.12, move: "sway" },
  { key: "swallow", label: "Swallow", zoom: 1.11, move: "glide" },
  { key: "mountain", label: "Mountains", zoom: 1.03, move: "rise" },
  { key: "wave", label: "Wave", zoom: 0.88, move: "roll" },
  { key: "pinecone", label: "Pine cone", zoom: 0.9, move: "hang" },
  { key: "moon", label: "Moon and stars", zoom: 0.96, move: "rock" },
  { key: "oak", label: "Oak leaf", zoom: 0.97, move: "hang" },
  { key: "owl", label: "Owl", zoom: 0.99, move: "perk" },
  { key: "fox", label: "Fox", zoom: 1.04, move: "perk" },
  { key: "sunflower", label: "Sunflower", zoom: 1, move: "sway" },
] as const;

/* The sample members' avatars, spread so no two side by side look alike.
   Indexes into AVATARS. */
const SEED_AVATARS: Record<string, number> = {
  "m-maya": 1,
  "m-dana": 9,
  "m-priya": 11,
  "m-lena": 6,
  "m-sam": 4,
  "m-jules": 7,
  "m-rosa": 5,
  "m-hannah": 8,
  "m-chloe": 3,
  "m-marcus": 10,
  "m-ari": 2,
  "m-tess": 0,
  "m-noah": 3,
  "m-bea": 9,
  "m-ivy": 7,
  "m-gone": 6,
};

/** Members who haven't picked one still get a steady character. */
function avatarFor(m: Pick<Member, "id" | "avatar">): number | undefined {
  if (m.avatar !== undefined && m.avatar >= 0) return m.avatar % AVATARS.length;
  if (m.id === "me") return undefined;
  if (m.id in SEED_AVATARS) return SEED_AVATARS[m.id];
  let h = 0;
  for (const c of m.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % AVATARS.length;
}

export function Avatar({
  member,
  size = 40,
}: {
  member: Pick<
    Member,
    "id" | "firstName" | "handle" | "showRealName" | "avatarHue" | "avatar" | "badges"
  >;
  size?: number;
}) {
  const team = member.badges.includes("team");
  const letter = (member.showRealName ? member.firstName : member.handle)
    .replace(/^@/, "")
    .charAt(0)
    .toUpperCase();
  const hue: Hue = member.avatarHue;
  const pick = team ? undefined : avatarFor(member);
  return (
    <span
      aria-hidden
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: team ? "var(--site-grey)" : `var(--${hue}-50)`,
        color: team ? "white" : hueInk(hue),
        fontSize: size * 0.4,
      }}
    >
      {team ? (
        <LogoOrange size={Math.round(size * 0.6)} />
      ) : pick !== undefined ? (
        <span
          className="avatar-art absolute inset-[9%]"
          data-move={AVATARS[pick].move}
          style={{ transform: `scale(${AVATARS[pick].zoom})` }}
        >
          <Image
            src={`/assets/brand/grove-avatars-gouache/${AVATARS[pick].key}.webp`}
            alt=""
            fill
            sizes={`${Math.round(size * 1.3)}px`}
            quality={90}
            className="object-contain"
          />
        </span>
      ) : (
        letter
      )}
    </span>
  );
}

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

const BADGE: Record<Badge, { label: string; cls: string }> = {
  mentor: { label: "Mentor", cls: "bg-purple-tint text-purple-ink" },
  "founding-mentor": { label: "Founding mentor", cls: "bg-purple-tint text-purple-ink" },
  clinician: { label: "Verified clinician", cls: "bg-blue-tint text-blue-ink" },
  team: { label: "Fertility Grove team", cls: "bg-green-tint text-green-ink" },
  partner: { label: "Partner", cls: "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink" },
};

export function BadgeChip({ badge }: { badge: Badge }) {
  const b = BADGE[badge];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[12px] font-semibold ${b.cls}`}
    >
      {badge === "clinician" && <BadgeCheck size={13} />}
      {(badge === "mentor" || badge === "founding-mentor") && <LeafIcon size={12} />}
      {b.label}
    </span>
  );
}
