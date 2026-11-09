"use client";

/* Bees in the grove. A few come to the trees that finish in flower, each one
   arriving as the blossom on its first tree opens (so they follow the grove's
   wave rather than a timer of their own), then fly a round of nearby flowers,
   hovering at each. They live inside the painting's box, so the view easing
   forward and the scroll carry them with the trees.

   A route is sampled into keyframes ahead of time: curved flights with a slight
   wobble, tilting into the flight and turning to face the way they go. It runs
   on the Web Animations API because each path is different; the wings are CSS.
   Everything pauses while the hero is off screen. Under reduced motion each bee
   simply rests on its first flower. */

import Image from "next/image";
import { useEffect, useRef } from "react";

export type Pt = { x: number; y: number };
export type BeePlan = { stops: Pt[]; size: number; arriveAt: number; phone: boolean };

const ASPECT = 1536 / 2752; // the painting's height over its width

type Sample = { t: number; x: number; y: number; face: number; tilt: number };
type Track = { pos: Keyframe[]; turn: Keyframe[]; total: number };

const toTrack = (samples: Sample[], fadeIn = false): Track => {
  const total = samples[samples.length - 1].t;
  return {
    total,
    pos: samples.map((s, i) => ({
      offset: s.t / total,
      transform: `translate(${s.x.toFixed(3)}%, ${s.y.toFixed(3)}%)`,
      ...(fadeIn ? { opacity: Math.min(1, i / 3) } : {}),
    })),
    turn: samples.map((s) => ({ offset: s.t / total, transform: `scaleX(${s.face.toFixed(3)}) rotate(${s.tilt.toFixed(2)}deg)` })),
  };
};

/** A curved flight from a to b, then a hover at b. Appends to `out` and returns the facing it ends on. */
function leg(out: Sample[], a: Pt, b: Pt, facing: number, bend: number, size: number, hover: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy * ASPECT);
  const fly = Math.max(800, Math.min(2200, 650 + dist * 260));
  const dir = Math.abs(dx) < 0.4 ? facing : Math.sign(dx);
  // The arc bulges to one side of the straight line (in true screen proportions).
  const cx = (a.x + b.x) / 2 - dy * ASPECT * bend;
  const cy = (a.y + b.y) / 2 + (dx / ASPECT) * bend;
  const STEPS = 16;
  const t0 = out.length ? out[out.length - 1].t : 0;
  for (let k = 1; k <= STEPS; k++) {
    const raw = k / STEPS;
    const s = raw * raw * (3 - 2 * raw); // eases in and out of each flower
    const m = 1 - s;
    const wobble = Math.sin(raw * Math.PI * 4) * size * 0.1;
    out.push({
      t: t0 + raw * fly,
      x: m * m * a.x + 2 * m * s * cx + s * s * b.x,
      y: m * m * a.y + 2 * m * s * cy + s * s * b.y + wobble / ASPECT,
      face: facing + (dir - facing) * Math.min(1, k / 3),
      tilt: Math.sin(raw * Math.PI) * 9,
    });
  }
  const t1 = t0 + fly;
  const BOB = 10;
  const amp = size * 0.2;
  for (let k = 1; k <= BOB; k++) {
    const raw = k / BOB;
    out.push({
      t: t1 + raw * hover,
      x: b.x + Math.sin(raw * Math.PI * 2) * amp * 0.5,
      y: b.y + (Math.sin(raw * Math.PI * 4) * amp) / ASPECT,
      face: dir,
      tilt: 0,
    });
  }
  return dir;
}

/** The way in (a short flight onto the first flower) and the round that loops after it. */
function route(plan: BeePlan, seed: number) {
  let n = seed;
  const rand = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const { stops, size } = plan;
  const lastFacing = Math.sign(stops[0].x - stops[stops.length - 1].x) || 1;
  const hover = () => 1100 + rand() * 1500;

  const inbound: Sample[] = [];
  const from = { x: stops[0].x - lastFacing * size * 3.6, y: stops[0].y - (size * 1.8) / ASPECT };
  inbound.push({ t: 0, x: from.x, y: from.y, face: lastFacing, tilt: 0 });
  leg(inbound, from, stops[0], lastFacing, 0.16, size, hover());

  const round: Sample[] = [{ t: 0, x: stops[0].x, y: stops[0].y, face: lastFacing, tilt: 0 }];
  let facing = lastFacing;
  stops.forEach((p, i) => {
    const q = stops[(i + 1) % stops.length];
    facing = leg(round, p, q, facing, (i % 2 ? -1 : 1) * (0.14 + rand() * 0.12), size, hover());
  });
  return { arrive: toTrack(inbound, true), loop: toTrack(round) };
}

function GroveBee({ plan, seed }: { plan: BeePlan; seed: number }) {
  const fly = useRef<HTMLSpanElement>(null);
  const turn = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const a = fly.current;
    const b = turn.current;
    if (!a || !b) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      a.style.opacity = "1";
      return;
    }
    const { arrive, loop } = route(plan, seed);
    const first = [
      a.animate(arrive.pos, { duration: arrive.total, delay: plan.arriveAt, fill: "both" }),
      b.animate(arrive.turn, { duration: arrive.total, delay: plan.arriveAt, fill: "both" }),
    ];
    let looping: Animation[] = [];
    first[0].onfinish = () => {
      looping = [a.animate(loop.pos, { duration: loop.total, iterations: Infinity }), b.animate(loop.turn, { duration: loop.total, iterations: Infinity })];
    };
    return () => [...first, ...looping].forEach((x) => x.cancel());
  }, [plan, seed]);

  const start = plan.stops[0];
  return (
    <span
      ref={fly}
      className={`pointer-events-none absolute inset-0 block ${plan.phone ? "" : "hidden md:block"}`}
      style={{ transform: `translate(${start.x}%, ${start.y}%)`, opacity: 0 }}
    >
      <span className="absolute top-0 left-0 block -translate-x-1/2 -translate-y-1/2" style={{ width: `${plan.size}%` }}>
        <span ref={turn} className="relative block">
          <span className="bee-wing" style={{ left: "26%", top: "-30%", width: "32%", height: "62%", rotate: "-24deg" }} />
          <span className="bee-wing bee-wing-b" style={{ left: "45%", top: "-22%", width: "25%", height: "50%", rotate: "10deg" }} />
          <Image src="/brand/landing/bee.webp" alt="" width={240} height={152} unoptimized className="relative block h-auto w-full" />
        </span>
      </span>
    </span>
  );
}

export function GroveBees({ plans }: { plans: BeePlan[] }) {
  const box = useRef<HTMLDivElement>(null);

  // Nothing flies while the hero is off screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.getAnimations({ subtree: true }).forEach((a) => (e.isIntersecting ? a.play() : a.pause()));
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="pointer-events-none absolute inset-0">
      {plans.map((p, i) => (
        <GroveBee key={i} plan={p} seed={101 + i * 37} />
      ))}
    </div>
  );
}
