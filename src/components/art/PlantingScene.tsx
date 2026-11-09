"use client";

/* Onboarding's picture: planting your seed, one action per step, on one patch
   of soil. We hand over the seeds (1), you dig (2), three seeds go in (3), the
   soil is patted over them (4), you water it (5), the sun comes out and the soil
   cracks (6), the tip pushes through (7), and a little shoot unfolds from
   that same tip (8), the Seed you are awarded on that screen. Step 8 is step 7's
   own painting with the shoot grown on it, so the seed never changes size.

   The soil is eight paintings of one mound, made together as a storyboard so
   they line up (public/brand/planting/, prompts in scripts/art/prompts-planting/),
   stacked so each fades in over the last at the moment its cause lands. Props
   act on their own step (keyed to data-step in globals.css). Each onboarding
   step is its own page, so the scene remembers the last one and plays only the
   new action, and its line of narration changes with it. Positions are in cqw
   of the stage, so it holds at any size.
   Under reduced motion each step simply shows its finished state. */

import Image from "next/image";
import { useEffect, useState } from "react";

const DIR = "/brand/planting";

/* When each soil layer arrives, in ms: [delay, duration]. Timed to its cause:
   2 on the trowel's first strike, 3 as the last seed lands, 5 slowly under the water. */
const SOIL: Record<number, [number, number]> = {
  1: [0, 300],
  2: [560, 260],
  3: [1460, 240],
  4: [640, 500],
  5: [1100, 1800],
  6: [500, 700],
  7: [300, 600],
  8: [0, 400],
};
const DROPS = [0, 1, 2, 3, 4, 5];

/* A line of storybook narration for each step. It says what the hands are doing
   and nothing about what will come of it: no promises, no "in its own time". */
const LINES = [
  "Here are your seeds.",
  "Let's make room for them.",
  "In they go.",
  "Now, tuck them in.",
  "A little water.",
  "A little sun.",
  "Pushing through.",
  "Your first leaf.",
];

/* The three seeds of step 3, furthest first. x, y and r match where they are
   painted into soil-3 (centre, in cqw, and tilt); from is the pouch's mouth.
   The gaps tighten, like a hand finding its rhythm. */
const FROM = { x: 12, y: 49 };
const SEEDS = [
  { x: 57, y: 59.67, r: 30, delay: 0, fly: 1150 },
  { x: 48.42, y: 60.33, r: 6, delay: 380, fly: 1060 },
  { x: 39.83, y: 59.17, r: -27, delay: 660, fly: 1000 },
];

/* The current layer fades in over the one before; that one (it has transparent
   parts, like the dirt pile) then fades away once the new one is fully there. */
function soilStyle(k: number, s: number): React.CSSProperties {
  if (k === s) {
    const [delay, duration] = SOIL[k];
    return {
      opacity: 1,
      transition: `opacity ${duration}ms var(--e-out)`,
      transitionDelay: `${delay}ms`,
    };
  }
  if (k < s) {
    const [delay, duration] = SOIL[k + 1];
    return { opacity: 0, transition: "opacity 260ms var(--e-out)", transitionDelay: `${delay + duration}ms` };
  }
  return { opacity: 0, transition: "opacity 300ms var(--e-out)" };
}

let lastStep: number | undefined;

export function PlantingScene({ step, compact = false }: { step: number; compact?: boolean }) {
  const target = Math.max(1, Math.min(8, step));
  const [s, setS] = useState(() => (lastStep !== undefined && lastStep < target ? lastStep : target));
  useEffect(() => {
    lastStep = target;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setS(target)));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="plant absolute inset-0 overflow-hidden" data-step={s} data-compact={compact ? "" : undefined} aria-hidden>
      <div className={`plant-stage absolute left-1/2 aspect-[1200/1005] -translate-x-1/2 ${compact ? "bottom-0 h-[80%]" : "bottom-[6%] w-[69%]"}`}>
        <span className="plant-sun">
          <Image src={`${DIR}/sun.webp`} alt="" width={640} height={640} unoptimized priority className="relative block h-auto w-full" />
        </span>

        <div className="plant-soil absolute inset-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
            <Image
              key={k}
              src={`${DIR}/soil-${k}.webp`}
              alt=""
              fill
              unoptimized
              priority
              className="object-contain"
              style={soilStyle(k, s)}
            />
          ))}
        </div>

        <span className="plant-pouch">
          <Image src={`${DIR}/pouch.webp`} alt="" width={640} height={769} unoptimized priority className="block h-auto w-full" />
        </span>
        <span className="plant-trowel">
          <Image src={`${DIR}/trowel.webp`} alt="" width={420} height={1572} unoptimized priority className="block h-auto w-full" />
        </span>
        {SEEDS.map((seed) => (
          <span
            key={seed.x}
            className="plant-seed"
            style={
              {
                left: `${seed.x}cqw`,
                top: `${seed.y}cqw`,
                "--x": `${FROM.x - seed.x}cqw`,
                "--y": `${FROM.y - seed.y}cqw`,
                "--r": `${seed.r}deg`,
                "--d": `${seed.delay}ms`,
                "--t": `${seed.fly}ms`,
              } as React.CSSProperties
            }
          >
            <Image src={`${DIR}/seed.webp`} alt="" width={320} height={530} unoptimized priority className="block h-auto w-full" />
          </span>
        ))}
        {/* The hole's front edge, over the seeds, so they drop in behind it. */}
        <Image src={`${DIR}/soil-lip.webp`} alt="" fill unoptimized priority className="plant-lip object-contain" />
        <span className="plant-shoot">
          <Image src={`${DIR}/shoot.webp`} alt="" width={151} height={119} unoptimized priority className="block h-auto w-full" />
        </span>
        <span className="plant-can">
          <Image src={`${DIR}/can.webp`} alt="" width={900} height={487} unoptimized priority className="block h-auto w-full" />
        </span>
        <span className="plant-water">
          {DROPS.map((d) => (
            <span key={d} className="plant-drop" style={{ left: `${(d % 3) * 0.7 - 0.7}cqw`, animationDelay: `${d * 0.14}s` }} />
          ))}
        </span>
      </div>

      <p className="plant-say serif">
        {LINES.map((line, i) => {
          const k = i + 1;
          return (
            <span key={k} className="plant-line" data-at={k === s ? "now" : k < s ? "past" : "next"}>
              {line}
            </span>
          );
        })}
      </p>
    </div>
  );
}
