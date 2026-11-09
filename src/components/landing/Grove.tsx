"use client";

/* The landing hero as a place you look into: a painted path winds from your
   feet to the horizon in a gentle S, and a whole grove grows along it. The two
   near trees play the brand's growth film; behind them the grove grows in a
   wave, nearest first and out to the far rows, each tree through the painted
   stages the film is made from, so it is one orchard, finishing four ways:
   green, in flower, in flower and fruit, or full of oranges. Rows follow the
   path's bends, so you stand inside the orchard rather than at its edge.
   Further trees are smaller and paler in the haze. The view eases forward a
   little as it grows, as if you'd stepped onto the path, and once the blossoms
   open bees come to them (GroveBees).

   Geometry comes from the painting (public/brand/landing/grove-land-winding.webp,
   prompt in scripts/art/prompts-hero/landscape-winding.txt): the horizon sits
   at 49.9% of its height, and PATH below is the path's centre and half-width
   (% of the painting's width) read off it at each height. Everything is placed
   inside a box with the painting's own proportions, so the trees stay on the
   painted ground at any screen size.

   All motion is CSS (grove-* in globals.css); under reduced motion the grove
   is simply grown. */

import Image from "next/image";
import { STAGE_SRC } from "@/components/art/Tree";
import { GroveBees, type BeePlan, type Pt } from "./GroveBees";

const HORIZON = 49.9; // % of the painting's height
const SIZE = 50; // a grove tree's height at depth 1, as % of the painting's height (short enough to see the path wind between them)
const FILM_SIZE = 63; // the two front trees
const STEP = 420; // ms between a tree's stages

/** The winding path, read off the painting: [height %, centre %, half-width %]. */
const PATH: [number, number, number][] = [
  [50, 53, 0.5],
  [55, 42.5, 2],
  [60, 40, 5],
  [65, 50, 8],
  [70, 57.5, 11.5],
  [75, 58, 14],
  [80, 56, 16],
  [85, 53, 19],
  [90, 49.5, 21.5],
  [95, 46, 24],
  [100, 43, 25],
];
const pathAt = (y: number) => {
  const i = Math.max(0, Math.min(PATH.length - 2, PATH.findIndex((p, k) => y >= p[0] && y <= (PATH[k + 1]?.[0] ?? 101))));
  const [y0, c0, w0] = PATH[i];
  const [y1, c1, w1] = PATH[i + 1];
  const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
  return { centre: c0 + (c1 - c0) * t, half: w0 + (w1 - w0) * t };
};

/** Where something at depth d (1 = the near edge, 0 = the horizon) stands, on one side of the path, `off` beyond its edge (painting widths at depth 1). */
const ground = (d: number, side: number, off: number) => {
  const top = HORIZON + (100 - HORIZON) * d;
  const { centre, half } = pathAt(top);
  return { left: centre + side * (half + off * d * 100), top };
};

/* Rows either side of the path, by distance from its edge (painting widths at
   depth 1): the first lines the path itself, the rest fill the fields out to
   the sides. Each row runs from near to far, closer together with distance,
   as an orchard does. */
const ROWS = [0.07, 0.18, 0.31, 0.47, 0.67, 0.93, 1.28, 1.73];
const FILM_D = 0.64;
const FILM_OFF = [0.16, 0.05]; // left and right front trees, clear of the path and its far bends

/* Keep a sightline down the road: a tree whose crown would hide a stretch of
   path further back (the far bends of the S) is not planted there. */
const ASPECT = 1536 / 2752; // the painting's height over its width
const hidesPath = (left: number, top: number, h: number) => {
  const half = (h * ASPECT * 0.72) / 2; // the crown, a little inside the picture's square
  for (let y = top - h * 0.95; y < top - h * 0.3; y += 0.5) {
    if (y < HORIZON + 1) continue;
    const { centre, half: ph } = pathAt(y);
    // A tree may overlap the road behind it a little; it only goes if it would hide most of a bend.
    const covered = Math.min(left + half, centre + ph) - Math.max(left - half, centre - ph);
    if (covered > ph * 2 * 0.55) return true;
  }
  return false;
};

type Tree = { key: string; d: number; side: number; off: number; row: number; delay: number; scale: number; stages: string[] };

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
      let d = 0.52 - row * 0.025 - (side > 0 ? 0.02 : 0);
      while (d > 0.04) {
        const off = rx + rand() * 0.02;
        const scale = 0.88 + rand() * 0.24;
        const { left, top } = ground(d, side, off);
        if (left > -4 && left < 104 && !hidesPath(left, top, SIZE * d * scale)) {
          // Nearest grow first, then the wave runs out to the far rows.
          const delay = 300 + (1 - d / 0.5) * 2600 + Math.min(row, 4) * 120 + rand() * 180;
          trees.push({
            key: `${row}-${side}-${trees.length}`,
            d,
            side,
            off,
            row,
            delay: Math.round(delay),
            scale,
            stages: stagesFor(d, pickFinish(rand())),
          });
        }
        d *= 0.8;
      }
    }
  });
  // Paint far trees first so nearer ones overlap them.
  return trees.sort((a, b) => a.d - b.d);
}
const TREES = plant();

/* Bees go to the trees that finish in flower. Each visits a few neighbouring
   trees at a chosen depth, and arrives as the blossom on its first one opens,
   so they come in behind the grove's own wave, near to far. Depth sets size. */
const inFlower = (t: Tree) => /blossom|mixed/.test(t.stages[t.stages.length - 1]);
const crown = (t: Tree, u: number): Pt => {
  const { left, top } = ground(t.d, t.side, t.off);
  const h = SIZE * t.d * t.scale;
  return { x: left + u * h * ASPECT * 0.2, y: top - h * 0.62 };
};
const BEES: BeePlan[] = (() => {
  const used = new Set<string>();
  const plans = [
    { side: 1, near: 0.55, far: 0.2, size: 1.9, phone: true },
    { side: -1, near: 0.55, far: 0.2, size: 2, phone: false },
    { side: -1, near: 0.26, far: 0.09, size: 1.3, phone: false },
    { side: 1, near: 0.14, far: 0.05, size: 0.95, phone: false },
    { side: -1, near: 0.14, far: 0.05, size: 0.9, phone: false },
  ];
  return plans.flatMap((p) => {
    const trees = TREES.filter((t) => t.side === p.side && t.d <= p.near && t.d >= p.far && (t.row < 3 || !p.phone) && inFlower(t) && !used.has(t.key))
      // Closest to the road first: that is the part of the grove a phone shows.
      .sort((a, b) => Math.abs(ground(a.d, a.side, a.off).left - 50) - Math.abs(ground(b.d, b.side, b.off).left - 50))
      .slice(0, 3);
    if (trees.length < 2) return [];
    trees.forEach((t) => used.add(t.key));
    const stops = trees.flatMap((t, i) => (i === 0 ? [crown(t, -1), crown(t, 1)] : [crown(t, i % 2 ? 1 : -1)]));
    // The moment the first tree's blossom has opened (its third stage), plus a beat.
    return [{ stops, size: p.size, phone: p.phone, arriveAt: trees[0].delay + 2 * STEP + 380 }];
  });
})();

export function Grove({ films, sceneRef }: { films: React.ReactNode[]; sceneRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-[calc(-1*var(--edge,0px))] overflow-hidden">
      {/* Scrolling out of the hero moves this layer (see useLeaveHero), not the frame that clips it. */}
      <div ref={sceneRef} className="absolute inset-0 origin-[50%_55%]">
      {/* The painting's own box: as wide as the screen, and tall enough that the horizon sits a little over halfway down. */}
      <div className="grove-box absolute top-0 left-1/2 aspect-[2752/1536] w-[max(100%,calc(var(--hero-h)*2.12))] -translate-x-1/2">
        <Image src="/brand/landing/grove-land-winding.webp" alt="" fill priority sizes="(min-width: 1440px) 2000px, 140vw" quality={90} className="object-cover" />

        {TREES.map((t) => {
          const { left, top } = ground(t.d, t.side, t.off);
          const h = SIZE * t.d * t.scale;
          return (
            <span
              key={t.key}
              className={`grove-tree absolute block ${t.row >= 3 ? "hidden md:block" : ""}`}
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
                  {/* Served as they are, not through the image optimiser: a grove would ask it for
                      dozens of resizes at once. Near trees get the 640px stage, far ones a 256px copy. */}
                  <Image src={t.d >= 0.22 ? src : src.replace(".webp", "-sm.webp")} alt="" fill unoptimized className="object-contain object-bottom" />
                </span>
              ))}
            </span>
          );
        })}

        {/* The two near trees play the growth film. */}
        {films.map((film, i) => {
          const { left, top } = ground(FILM_D, i === 0 ? -1 : 1, FILM_OFF[i]);
          const h = FILM_SIZE * FILM_D;
          return (
            <span key={i} className="absolute block -translate-x-1/2" style={{ left: `${left}%`, top: `${top - h * 0.97}%`, height: `${h}%`, aspectRatio: "1" }}>
              {film}
            </span>
          );
        })}

        <GroveBees plans={BEES} />
      </div>
      </div>
    </div>
  );
}
