"use client";

/* The gift: a young orange tree in a terracotta pot, tied with a ribbon and a
   blank tag, because joining Fertility Grove starts with an invitation. Through
   onboarding it comes alive:
     sign-in / sign-up, step 1   the gift: leaves only, no flowers yet
     step 2                      closed buds on some branches
     step 3                      buds everywhere, some opened into blossom
     steps 4–5                   in full bloom
     step 6                      the first fruit sets: one small green orange
     step 7                      that one is ripe, and two greenish ones have set
     step 8                      the tree is full of ripe oranges
   Every fruit goes through the same stages (green, greenish, ripe), and a
   blossom gives way to the fruit that grows from it.

   Pieces are painted separately (public/brand/gift/, prompts in
   scripts/art/prompts-gift/) so each can move. Everything runs on CSS
   transitions, so clicking quickly through steps retargets instead of
   restarting. Under reduced motion it all simply appears. */

import Image from "next/image";
import { useEffect, useState } from "react";

const DIR = "/brand/gift";

/** Where blossoms sit on the canopy, as % of the tree picture, in the order they open. */
const SPOTS = [
  { x: 25, y: 20.6, r: -14 },
  { x: 70.5, y: 13.4, r: 18 },
  { x: 52.3, y: 30.3, r: 4 },
  { x: 41, y: 9.8, r: -24 },
  { x: 78.2, y: 29.6, r: 30 },
  { x: 21.9, y: 35.1, r: -6 },
  { x: 61.4, y: 40, r: 12 },
  { x: 47.8, y: 18.2, r: -32 },
];

/** Where oranges hang: the blossom spots first (fruit grows where the flower was), then more between them. */
const ORANGES = [
  ...SPOTS.map(({ x, y }) => ({ x, y })),
  { x: 33, y: 28 },
  { x: 60, y: 22 },
  { x: 38, y: 41 },
  { x: 84, y: 21 },
  { x: 16, y: 26 },
  { x: 57, y: 6.5 },
  { x: 70, y: 32 },
  { x: 29, y: 12 },
].map((p, k) => ({ ...p, size: [9, 8, 9.5, 8.5, 7.5, 9, 9.5, 8][k % 8] }));

type Stage = "green" | "greenish" | "ripe";
const STAGE_SCALE: Record<Stage, number> = { green: 0.72, greenish: 0.86, ripe: 1 };

type Spot = "none" | "bud" | "open" | "fruit";

/** What a blossom spot shows at a step. */
function spotOf(k: number, step: number): Spot {
  if (stageOf(k, step)) return "fruit";
  if (step <= 1) return "none";
  if (step === 2) return k < 5 ? "bud" : "none";
  if (step === 3) return k < 4 ? "open" : "bud";
  return "open";
}

/** Which oranges are on the tree at a step, and how ripe each is. */
function stageOf(k: number, step: number): Stage | undefined {
  if (step >= 8) return "ripe";
  if (step === 7) return k === 2 ? "ripe" : k === 0 || k === 4 ? "greenish" : undefined;
  if (step === 6) return k === 2 ? "green" : undefined;
  return undefined;
}

/* Each onboarding step is its own page, so the scene remounts on every Next.
   This remembers what was last on screen, so the new blossom or fruit grows
   from the previous step instead of just appearing. */
let lastStep: number | undefined;

export function GiftTree({ step }: { step: number }) {
  const target = Math.max(0, Math.min(8, step));
  const [s, setS] = useState(() => (lastStep !== undefined && lastStep < target ? lastStep : target));
  useEffect(() => {
    lastStep = target;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setS(target)));
    return () => cancelAnimationFrame(id);
  }, [target]);

  const full = s >= 8;
  // At the harvest, each blossom fades on its own orange's beat, so flowers turn into fruit.
  const beat = (k: number) => `${200 + k * 55}ms`;

  return (
    <div className="absolute bottom-[3%] left-1/2 aspect-[1100/1636] h-[88%] -translate-x-1/2">
      <Image src={`${DIR}/tree.webp`} alt="" fill sizes="(min-width: 1024px) 40vw, 30vw" quality={90} priority className="object-contain" />

      {SPOTS.map((p, k) => {
        const spot = spotOf(k, s);
        // Several buds or blossoms change at once on a step, so each comes a beat after the one before.
        const wave = `${80 + k * 70}ms`;
        return (
          <span key={k} className="absolute block w-[11%]" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.r}deg)` }}>
            <span className="gift-bud" data-state={spot === "none" ? "none" : spot === "bud" ? "bud" : "gone"} style={{ transitionDelay: spot === "bud" ? wave : "0ms" }}>
              <Image src={`${DIR}/bud.webp`} alt="" width={200} height={552} className="mx-auto h-auto w-[38%]" />
            </span>
            <span
              className="gift-bloom absolute inset-0 grid place-items-center"
              data-open={spot === "open" ? "" : undefined}
              style={{ transitionDelay: spot === "open" ? wave : full ? beat(k) : "0ms" }}
            >
              <Image src={`${DIR}/blossom.webp`} alt="" width={240} height={222} className="h-auto w-full" />
            </span>
          </span>
        );
      })}

      {ORANGES.map((o, k) => {
        const stage = stageOf(k, s);
        return (
          <span
            key={k}
            className="gift-fruit absolute block"
            data-open={stage ? "" : undefined}
            style={
              {
                left: `${o.x}%`,
                top: `${o.y + 1}%`,
                width: `${o.size}%`,
                "--fruit-scale": stage ? STAGE_SCALE[stage] : 0.3,
                transitionDelay: full ? beat(k) : "200ms",
              } as React.CSSProperties
            }
          >
            {/* Three paintings of the same fruit, cross-faded as it ripens. */}
            <Image src={`${DIR}/fruitlet.webp`} alt="" width={220} height={269} className="gift-ripen h-auto w-full" style={{ opacity: !stage || stage === "green" ? 1 : 0 }} />
            <Image src={`${DIR}/fruit.webp`} alt="" width={220} height={268} className="gift-ripen absolute inset-0 h-auto w-full" style={{ opacity: stage === "greenish" ? 1 : 0 }} />
            <Image src={`${DIR}/orange.webp`} alt="" width={220} height={253} className="gift-ripen absolute inset-0 h-auto w-full" style={{ opacity: stage === "ripe" ? 1 : 0 }} />
          </span>
        );
      })}
    </div>
  );
}
