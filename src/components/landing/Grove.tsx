"use client";

/* The landing hero as a place you look into: a painted path runs from your
   feet to the horizon, and a whole grove grows along it. The two near trees
   play the brand's growth film; behind them the grove grows in a wave, nearest
   first and out to the far rows, each tree through the same five painted
   painted stages the film is made from, so it is one orchard, and they finish
   four ways: green, in flower, in flower and fruit, or full of oranges. Further trees are smaller, closer to the path and paler in the
   haze. The view eases forward a little as it grows, as if you'd stepped onto
   the path.

   Geometry comes from the painting (public/brand/landing/grove-land.webp,
   prompt in scripts/art/prompts-hero/): the horizon sits at 49.5% of its
   height and the path narrows in one-point perspective to the middle of it,
   21.5% of the painting's width either side of centre at the bottom edge.
   Everything is placed inside a box with the painting's own proportions, so
   the trees stay on the painted ground at any screen size.

   All motion is CSS (grove-* in globals.css); under reduced motion the grove
   is simply grown. */

import Image from "next/image";
import { STAGE_SRC } from "@/components/art/Tree";

const HORIZON = 49.5; // % of the painting's height
const SIZE = 63; // a tree's height at depth 1, as % of the painting's height
const STEP = 420; // ms between a tree's stages

/** Where something standing at depth d (1 = the near edge, 0 = the horizon) and lateral offset x meets the ground. */
const ground = (d: number, x: number) => ({ left: 50 + x * d * 100, top: HORIZON + (100 - HORIZON) * d });

/* Rows of trees either side of the path, by lateral offset (painting widths at
   depth 1). Each row runs from near to far on a geometric spacing so the
   spacing shrinks with distance, as it does in an orchard. */
const ROWS = [0.28, 0.44, 0.64, 0.92, 1.3, 1.85]; // the first just clear of the path's edge (0.215)
const FILM_D = 0.64;
const FILM_X = 0.36;

type Tree = { key: string; d: number; x: number; row: number; delay: number; scale: number; stages: string[] };

/* Grove trees start as small bushes (a seed reads as a stone at this size; the
   near trees still grow from a sprout in the film) and finish four ways, like
   a real orchard: green only, in flower, in flower and fruit at once
   (stage-mixed.webp, the blossom tree with half the oranges set into it), or
   full of oranges. Far trees skip a stage. */
const SRC = { ...STAGE_SRC, Mixed: "/brand/art/stage-mixed.webp" };
type Finish = "green" | "flowers" | "mixed" | "oranges";
const FINISHES: [Finish, number][] = [
  ["green", 0.2],
  ["flowers", 0.25],
  ["mixed", 0.25],
  ["oranges", 0.3],
];
const PATHS: Record<Finish, (keyof typeof SRC)[]> = {
  green: ["Bush", "Tree"],
  flowers: ["Bush", "Tree", "Blossom Tree"],
  mixed: ["Bush", "Tree", "Blossom Tree", "Mixed"],
  oranges: ["Bush", "Tree", "Blossom Tree", "Orange Tree"],
};
const stagesFor = (d: number, finish: Finish) => {
  const path = PATHS[finish];
  const keep = d < 0.2 && path.length > 3 ? [path[0], path[1], path[path.length - 1]] : path;
  return keep.map((k) => SRC[k]);
};
const pickFinish = (r: number): Finish => {
  let acc = 0;
  for (const [f, w] of FINISHES) if (r < (acc += w)) return f;
  return "oranges";
};

function plant(): Tree[] {
  const trees: Tree[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  ROWS.forEach((rx, row) => {
    for (const side of [-1, 1]) {
      let d = Math.min(0.5, 0.5 - row * 0.03) - (side > 0 ? 0.02 : 0);
      while (d > 0.045) {
        const x = side * (rx + (rand() - 0.5) * 0.02);
        const scale = 0.88 + rand() * 0.24;
        const { left } = ground(d, x);
        if (left > -4 && left < 104) {
          // Nearest grow first, then the wave runs out to the far rows.
          const delay = 300 + (1 - d / 0.5) * 2600 + Math.min(row, 4) * 120 + rand() * 180;
          trees.push({
            key: `${row}-${side}-${trees.length}`,
            d,
            x,
            row,
            delay: Math.round(delay),
            scale,
            stages: stagesFor(d, pickFinish(rand())),
          });
        }
        d *= 0.71;
      }
    }
  });
  // Paint far trees first so nearer ones overlap them.
  return trees.sort((a, b) => a.d - b.d);
}
const TREES = plant();

export function Grove({ films }: { films: React.ReactNode[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The painting's own box: as wide as the screen, and tall enough that the horizon sits a little over halfway down. */}
      <div className="grove-box absolute top-0 left-1/2 aspect-[2752/1536] w-[max(100%,calc(var(--hero-h)*2.12))] -translate-x-1/2">
        <Image src="/brand/landing/grove-land.webp" alt="" fill priority sizes="(min-width: 1440px) 2000px, 140vw" quality={88} className="object-cover" />

        {TREES.map((t) => {
          const { left, top } = ground(t.d, t.x);
          const h = SIZE * t.d * t.scale;
          return (
            <span
              key={t.key}
              className={`grove-tree absolute block ${t.row >= 2 ? "hidden md:block" : ""}`}
              style={
                {
                  left: `${left}%`,
                  top: `${top - h * 0.984}%`,
                  height: `${h}%`,
                  aspectRatio: "1",
                  // Haze: further trees fade toward the sky.
                  opacity: Math.min(1, 0.3 + 0.7 * Math.pow(t.d / 0.42, 1.15)),
                  "--a": `${t.delay}ms`,
                } as React.CSSProperties
              }
            >
              {t.stages.map((src, i) => (
                <span
                  key={src}
                  className="grove-stage absolute inset-0"
                  style={
                    {
                      "--in": `${t.delay + i * STEP}ms`,
                      "--out": `${t.delay + (i + 1) * STEP + 240}ms`,
                    } as React.CSSProperties
                  }
                  data-last={i === t.stages.length - 1 ? "" : undefined}
                >
                  <Image src={src} alt="" fill sizes={`${Math.max(3, Math.round(t.d * 45))}vw`} className="object-contain object-bottom" />
                </span>
              ))}
            </span>
          );
        })}

        {/* The two near trees play the growth film. */}
        {films.map((film, i) => {
          const { left, top } = ground(FILM_D, (i === 0 ? -1 : 1) * FILM_X);
          const h = SIZE * FILM_D;
          return (
            <span key={i} className="absolute block -translate-x-1/2" style={{ left: `${left}%`, top: `${top - h * 0.97}%`, height: `${h}%`, aspectRatio: "1" }}>
              {film}
            </span>
          );
        })}
      </div>
    </div>
  );
}
