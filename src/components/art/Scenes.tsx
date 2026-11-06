/* Scenes and spot art. The onboarding scene is the gifted orange tree
   (GiftTree): a blossom opens per answer, bees come to visit, and the first
   orange forms on the last screen. Spots compose the brand's watercolour
   growth stages (and the orange from the logo) into small pictures for
   headers and empty states. */

import Image from "next/image";
import { GiftTree } from "./GiftTree";
import { TREE_SRC } from "./Tree";

/** The sign-up and onboarding panel: the gifted orange tree (see GiftTree). */
export function OnboardingScene({ step, className = "" }: { step: number; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <GiftTree step={step} />
    </div>
  );
}

export type SpotKind =
  | "canopy"
  | "plate"
  | "lantern"
  | "birds"
  | "blossom"
  | "shelter"
  | "roots"
  | "seeds"
  | "sun"
  | "sprout"
  | "seedlings"
  | "lens"
  | "bud"
  | "bookmark"
  | "envelope"
  | "stories";

type Piece = { src: string; x: number; w: number; flip?: boolean };

const ORANGE = "/brand/orange.png";

/* Each spot is pieces standing on one ground line; x and w are % of width. */
const SPOTS: Record<SpotKind, Piece[]> = {
  canopy: [
    { src: TREE_SRC.Tree, x: 2, w: 44 },
    { src: TREE_SRC["Orange Tree"], x: 26, w: 52 },
    { src: TREE_SRC["Blossom Tree"], x: 56, w: 44, flip: true },
  ],
  sun: [{ src: TREE_SRC["Orange Tree"], x: 18, w: 64 }],
  blossom: [{ src: TREE_SRC["Blossom Tree"], x: 18, w: 64 }],
  stories: [{ src: TREE_SRC["Blossom Tree"], x: 18, w: 64 }],
  shelter: [
    { src: TREE_SRC["Orange Tree"], x: 4, w: 62 },
    { src: TREE_SRC.Seed, x: 58, w: 36 },
  ],
  roots: [
    { src: TREE_SRC.Tree, x: 6, w: 52 },
    { src: TREE_SRC["Blossom Tree"], x: 42, w: 52, flip: true },
  ],
  seeds: [
    { src: TREE_SRC.Seed, x: 10, w: 44 },
    { src: TREE_SRC.Seed, x: 46, w: 44, flip: true },
  ],
  sprout: [{ src: TREE_SRC.Seed, x: 22, w: 56 }],
  seedlings: [
    { src: TREE_SRC.Seed, x: 0, w: 40 },
    { src: TREE_SRC.Bush, x: 30, w: 40 },
    { src: TREE_SRC.Seed, x: 60, w: 40, flip: true },
  ],
  bud: [{ src: TREE_SRC.Bush, x: 22, w: 56 }],
  lens: [{ src: TREE_SRC.Bush, x: 22, w: 56 }],
  lantern: [],
  birds: [],
  envelope: [],
  bookmark: [],
  plate: [],
};

export function Spot({ kind, size = 160, className = "" }: { kind: SpotKind; size?: number; className?: string }) {
  const h = Math.round((size * 3) / 4);
  if (kind === "plate") {
    return (
      <span aria-hidden className={`relative block shrink-0 overflow-hidden rounded-[0_40%_0_40%] ${className}`} style={{ width: h, height: h }}>
        <Image src="/plates/citrus-limonum-rungiah.jpg" alt="" fill sizes={`${h}px`} className="object-cover object-[45%_35%]" />
      </span>
    );
  }
  if (kind === "lantern" || kind === "bookmark" || kind === "envelope" || kind === "birds") {
    // The orange from the logo: one for the Guide and saved things, two in conversation.
    const two = kind === "birds" || kind === "envelope";
    return (
      <span aria-hidden className={`relative flex shrink-0 items-end justify-center gap-[6%] ${className}`} style={{ width: size, height: h }}>
        <Image src={ORANGE} alt="" width={Math.round(h * 0.62)} height={Math.round(h * 0.67)} className="object-contain" />
        {two && <Image src={ORANGE} alt="" width={Math.round(h * 0.5)} height={Math.round(h * 0.54)} className="-scale-x-100 object-contain" />}
      </span>
    );
  }
  return (
    <span aria-hidden className={`relative block shrink-0 ${className}`} style={{ width: size, height: h }}>
      {SPOTS[kind].map((p, i) => (
        <span key={i} className="absolute bottom-0" style={{ left: `${p.x}%`, width: `${p.w}%`, aspectRatio: "1" }}>
          <Image src={p.src} alt="" fill sizes={`${Math.round((size * p.w) / 100)}px`} className={`object-contain object-bottom ${p.flip ? "-scale-x-100" : ""}`} />
        </span>
      ))}
    </span>
  );
}
