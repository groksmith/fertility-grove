"use client";

/* Version D: the Riviera styling (version A's tokens, art, italic accent and
   tinted discs) on a new layout. Same copy, same brand colours and faces,
   same single watercolour hand. What changes is the composition:

     hero        copy on the left, a round painted terrace on the right that
                 opens like a sun rising (an iris), the brand orange settling
                 beside it; nothing behind the words
     privacy     four postcards instead of a band
     statement   a type moment: each word inks in, in reading order, as you scroll
     six ways    six round medallions, like painted plates on a terrace wall
     where       stage pills across the top, the picture and what you'd join side by side
     library     one featured article and an index of the other five
     grow        the five trees climb a dotted path, which draws itself first
     partners    words left, the painting right, the branch from the screen edge
     join        a centred close, the italic "Join"

   Shared pieces come from LandingGouache.tsx; motion lives in gouache.css under .gq-d. */

import { STAGE_SRC } from "@/components/art/Tree";
import { LogoOrange } from "@/components/shared";
import { ARTICLES, articleCover } from "@/lib/data/articles";
import { GROUPS } from "@/lib/data/groups";
import { hueInk } from "@/lib/hue";
import { LEVELS } from "@/lib/rules/sunlight";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GuideScene } from "../GuideScene";
import {
  Branch,
  Btn,
  Footer,
  Garland,
  OrangeDot,
  PRIVACY,
  SPECIMENS,
  STAGES,
  SiteNav,
  Thumb,
  useReveal,
} from "./LandingGouache";

const ART = "/assets/brand/gouache";
const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/* ------------------------------------------------------------- Hero */

function Hero() {
  return (
    <header className="relative">
      <Branch
        kind="hang"
        w="clamp(90px, 8vw, 140px)"
        className="-top-6 right-[14%] hidden lg:block"
      />
      <div className="mx-auto grid min-h-[max(680px,100svh)] max-w-[1440px] grid-cols-1 items-center gap-12 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-24 lg:pb-10">
        <div className="lg:col-span-6">
          <p
            className="gq-script text-3xl text-[var(--gq-ink-soft)] sm:text-4xl"
            data-enter
            style={d(150)}
          >
            Welcome to the grove
          </p>
          <h1
            className="gq-display mt-4 max-w-[17ch] text-5xl leading-[1.02] sm:text-6xl xl:text-7xl xl:leading-[1.0]"
            data-enter
            style={d(280)}
          >
            The first purpose built platform for the fertility community.
          </h1>
          <p
            className="mt-6 max-w-[42ch] text-lg text-[var(--gq-ink-soft)] sm:text-xl"
            data-enter
            style={d(420)}
          >
            A private community for people going through infertility, and their partners.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3" data-enter style={d(560)}>
            <Btn href="/signup">Create account</Btn>
            <Btn href="/login" quiet>
              Sign in
            </Btn>
          </div>
          <p
            className="mt-5 max-w-[52ch] text-sm text-[var(--gq-ink-soft)]"
            data-enter
            style={d(680)}
          >
            Invite-only during the beta. Ask a member for their invite link, or{" "}
            <Link
              href="/community"
              className="font-semibold text-[var(--gq-ink)] underline underline-offset-2"
            >
              read posts members shared
            </Link>
            .
          </p>
        </div>

        <div className="lg:col-span-6">
          <div className="relative mx-auto aspect-square w-full max-w-[min(600px,72svh)] lg:mr-0">
            <div
              aria-hidden
              className="gq-d-disc absolute inset-0 rounded-full bg-[var(--gq-sage)]"
            />
            <div className="gq-d-iris gq-frame absolute inset-[6%]">
              <Image
                src={`${ART}/terrace-round.webp`}
                alt="A café table and two chairs on a sunlit terrace under an orange tree, looking over an orange grove to the sea"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 90vw"
                quality={90}
                className="gq-breathe object-cover"
              />
            </div>
            <span aria-hidden className="gq-d-sun absolute right-[3%] bottom-[5%]">
              <LogoOrange size={76} />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------- Privacy: one slim card */

const PROMISE_TINT = ["var(--gq-sage)", "var(--gq-sky)", "var(--gq-blush)", "var(--gq-butter)"];

/** A quiet reassurance, not a chapter: one slim card under the hero, the four
    promises in a row, each a small painting on a tinted disc. */
function Privacy() {
  return (
    <section
      aria-labelledby="privacy-h"
      className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:py-14"
    >
      <div className="gq-card grid grid-cols-1 items-center gap-6 bg-[var(--gq-paper)] px-6 py-6 lg:grid-cols-[auto_1fr] lg:gap-12 lg:px-10 lg:py-7">
        <h2 id="privacy-h" className="gq-display text-2xl lg:text-3xl">
          Private by default
        </h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-8">
          {PRIVACY.map(({ text, art }, i) => (
            <li
              key={text}
              className="flex items-center gap-3"
              data-reveal
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span
                aria-hidden
                className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full"
                style={{ background: PROMISE_TINT[i] }}
              >
                <span className="relative block h-10 w-10">
                  <Image
                    src={art}
                    alt=""
                    fill
                    sizes="40px"
                    quality={90}
                    className="object-contain"
                  />
                </span>
              </span>
              <span className="text-sm font-semibold text-balance lg:text-base">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Statement: words ink in */

type Tok = string | { w: string; thumb: React.ReactNode; tail: string };

const LINES: Tok[][] = [
  ["Tell", "us", "where", "you", "are", "once."],
  [
    "Meet",
    "people",
    "on",
    "your",
    {
      w: "path",
      thumb: (
        <Thumb src="/assets/brand/landing/stage-trying.webp" alt="A path through an orange grove" />
      ),
      tail: ",",
    },
    "answers",
    "a",
    "clinician",
    {
      w: "reviewed",
      thumb: <Thumb src={articleCover("male-factor")} alt="A microscope from the library" />,
      tail: ",",
    },
  ],
  [
    "and",
    "someone",
    "who's",
    "been",
    {
      w: "there",
      thumb: (
        <Thumb
          src="/assets/brand/art/tree-orange.webp"
          alt="An orange tree in fruit"
          bg="var(--gq-sage)"
        />
      ),
      tail: ".",
    },
  ],
];

/** Lights the words of `ref` one by one, in reading order, as the block rises
    from low on the screen to its middle. Once lit, a word stays lit. */
function useInkIn() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = [...el.querySelectorAll<HTMLElement>("[data-w]")];
    el.dataset.armed = "";
    let lit = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.35 + r.height / 2)));
      const n = Math.ceil(p * words.length);
      for (; lit < n; lit++) words[lit].dataset.lit = "";
      if (lit >= words.length) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return ref;
}

function Statement() {
  const ref = useInkIn();
  const line = "block md:whitespace-nowrap";
  return (
    <section
      aria-label="What you get"
      className="relative px-5 pt-24 pb-24 sm:px-8 lg:pt-32 lg:pb-32"
    >
      <p
        ref={ref}
        className="gq-display gq-statement gq-ink relative text-center text-[clamp(30px,8.4vw,44px)] leading-[1.18]"
      >
        {LINES.map((toks, l) => (
          <span key={l} className={`${line} ${l ? "mt-4 lg:mt-6" : ""}`}>
            {toks.map((t, k) => (
              <span key={k}>
                {k > 0 && " "}
                {typeof t === "string" ? (
                  <span data-w className="gq-w">
                    {t}
                  </span>
                ) : (
                  <span data-w className="gq-w whitespace-nowrap">
                    {t.w} {t.thumb}
                    <span className="-ml-[0.1em]">{t.tail}</span>
                  </span>
                )}
              </span>
            ))}
          </span>
        ))}
      </p>
      <Garland className="relative mt-20 lg:mt-28" />
    </section>
  );
}

/* ------------------------------------------------------------- Six ways in: medallions */

function Medallion({ s, i }: { s: (typeof SPECIMENS)[number]; i: number }) {
  return (
    <div
      className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-full shadow-[var(--gq-shadow)]"
      style={{ background: s.bg }}
    >
      {s.art === "guide" ? (
        <GuideScene delay={i * 120} />
      ) : s.art === "tree" ? (
        <span className="absolute inset-x-[18%] top-[14%] bottom-[12%] block">
          <Image
            src={STAGE_SRC["Orange Tree"]}
            alt=""
            fill
            sizes="200px"
            className="object-contain object-bottom"
          />
        </span>
      ) : s.bleed ? (
        <span className="absolute inset-x-[4%] bottom-[16%] block aspect-[1400/906]">
          <Image
            src={s.art}
            alt=""
            fill
            sizes="(min-width: 1024px) 280px, 45vw"
            quality={90}
            className="object-contain"
          />
        </span>
      ) : (
        <span className="absolute inset-[17%] block">
          <Image
            src={s.art}
            alt=""
            fill
            sizes="(min-width: 1024px) 200px, 35vw"
            quality={90}
            className="object-contain"
          />
        </span>
      )}
    </div>
  );
}

function Specimens() {
  return (
    <section
      id="groups"
      aria-labelledby="spec-h"
      className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12 lg:gap-8">
        <h2 id="spec-h" className="gq-display text-5xl lg:col-span-6 lg:text-6xl">
          Six ways in
        </h2>
        <p className="max-w-[40ch] text-lg text-[var(--gq-ink-soft)] lg:col-span-5 lg:col-start-8">
          Groups, answers, mentors and your partner, so this isn&apos;t one more thing to juggle.
        </p>
      </div>
      <ul
        className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-16"
        // biome-ignore lint/a11y/noRedundantRoles lint/a11y/useSemanticElements: role="list" restores list semantics that Safari/VoiceOver drop under list-style: none; do not remove
        role="list"
      >
        {SPECIMENS.map((s, i) => (
          <li
            key={s.name}
            className="flex flex-col items-center text-center"
            data-reveal
            style={{ transitionDelay: `${(i % 3) * 140}ms` }}
          >
            <Medallion s={s} i={i} />
            <h3 className="mt-6 text-xl font-semibold">{s.name}</h3>
            <p className="mt-2 max-w-[32ch] text-base text-[var(--gq-ink-soft)]">{s.fact}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- Where are you */

function WhereAreYou() {
  const [i, setI] = useState(0);
  const cur = STAGES[i];
  const groups = cur.groups.map((id) => GROUPS.find((g) => g.id === id)!);
  const article = ARTICLES.find((a) => a.slug === cur.article)!;
  return (
    <section
      aria-labelledby="where-h"
      className="gq-band my-16"
      style={{ "--band": "var(--gq-band-2)" } as React.CSSProperties}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <h2 id="where-h" className="gq-display text-center text-4xl lg:text-5xl">
          Where are you right now?
        </h2>
        <div
          role="tablist"
          aria-label="Journey stage"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {STAGES.map((s, k) => (
            <button
              key={s.stage}
              type="button"
              role="tab"
              aria-selected={k === i}
              onClick={() => setI(k)}
              onMouseEnter={() => setI(k)}
              onFocus={() => setI(k)}
              className={`h-11 rounded-full px-5 text-base font-semibold transition-[background-color,box-shadow,color] duration-500 ${
                k === i
                  ? "bg-[var(--gq-primary)] text-[var(--gq-on-primary)] shadow-[var(--gq-shadow-btn)]"
                  : "bg-[var(--gq-paper)]/70 text-[var(--gq-ink-soft)] shadow-[0_0_0_1px_var(--gq-line)] hover:text-[var(--gq-ink)]"
              }`}
            >
              {s.stage}
            </button>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="relative mx-auto aspect-square w-full max-w-[460px] lg:col-span-5 lg:col-start-2">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full transition-colors duration-700"
              style={{ background: cur.disc }}
            />
            <div className="gq-frame absolute inset-[8%]">
              {STAGES.map((s, k) => (
                <div
                  key={s.stage}
                  aria-hidden={k !== i}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-[var(--gq-ease)] ${k === i ? "opacity-100" : "opacity-0"}`}
                >
                  <Image
                    src={s.photo}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 420px, 90vw"
                    quality={90}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div aria-live="polite" className="lg:col-span-5 lg:col-start-8">
            <p key={cur.stage} className="gq-display gq-swap text-3xl leading-[1.15] lg:text-4xl">
              {cur.line}
            </p>
            <div className="gq-card mt-8 bg-[var(--gq-paper)] p-6 text-base">
              <p className="font-semibold">You&apos;d start in</p>
              <ul className="mt-2 space-y-1.5">
                {groups.map((g) => (
                  <li key={g.id} className="flex gap-2.5">
                    <OrangeDot />
                    {g.name}
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-semibold">First read</p>
              <p className="text-[var(--gq-ink-soft)]">{article.title}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Library: featured + index */

function diagnosisLabel(a: (typeof ARTICLES)[number]) {
  return a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis;
}

function LearnList() {
  const [first, ...rest] = ARTICLES;
  return (
    <section
      id="learn"
      aria-labelledby="learn-h"
      className="mx-auto max-w-[1440px] scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="learn-h" className="gq-display text-5xl lg:text-6xl">
          Clinician-reviewed library
        </h2>
        <span className="shrink-0 text-base whitespace-nowrap text-[var(--gq-ink-soft)]">
          6 articles
        </span>
      </div>
      <p className="mt-4 max-w-[60ch] text-base text-[var(--gq-ink-soft)]">
        One for each of six diagnoses, each reviewed by a clinician before it&apos;s published. Read
        the summaries now; the full articles open when you join.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        <article className="lg:col-span-6" data-reveal>
          <span aria-hidden className="gq-card relative block aspect-[4/3] overflow-hidden">
            <Image
              src={articleCover(first.slug)}
              alt=""
              fill
              sizes="(min-width: 1024px) 680px, 100vw"
              quality={90}
              className="object-cover"
            />
          </span>
          <p className="mt-6 text-sm font-semibold" style={{ color: hueInk(first.hue) }}>
            {diagnosisLabel(first)}
          </p>
          <h3 className="gq-display mt-1 text-3xl lg:text-4xl">{first.title}</h3>
          <p className="mt-3 max-w-[56ch] text-base text-[var(--gq-ink-soft)]">{first.summary}</p>
          <p className="mt-3 text-sm text-[var(--gq-ink-soft)] tabular-nums">
            {first.readMinutes} min read · Reviewed {first.lastReviewed}
          </p>
        </article>

        <ul className="divide-y divide-[var(--gq-line)] lg:col-span-5 lg:col-start-8">
          {rest.map((a, i) => (
            <li
              key={a.slug}
              className="flex gap-5 py-6 first:pt-0 last:pb-0"
              data-reveal
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span
                aria-hidden
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full shadow-[var(--gq-shadow)]"
              >
                <Image
                  src={articleCover(a.slug)}
                  alt=""
                  fill
                  sizes="80px"
                  quality={90}
                  className="object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: hueInk(a.hue) }}>
                  {diagnosisLabel(a)}
                </p>
                <h3 className="mt-0.5 text-xl font-semibold">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-base text-[var(--gq-ink-soft)]">{a.summary}</p>
                <p className="mt-2 text-sm text-[var(--gq-ink-soft)] tabular-nums">
                  {a.readMinutes} min read · Reviewed {a.lastReviewed}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Grow: the climbing path */

function Grow() {
  return (
    <section
      id="grow"
      aria-labelledby="grow-h"
      className="gq-band my-16 scroll-mt-20"
      style={{ "--band": "var(--gq-band-3)" } as React.CSSProperties}
    >
      <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-12 lg:gap-8">
          <h2 id="grow-h" className="gq-display text-5xl lg:col-span-6 lg:text-6xl">
            Grow by helping
          </h2>
          <p className="max-w-[46ch] text-base text-[var(--gq-ink-soft)] lg:col-span-5 lg:col-start-8">
            The grove rewards being useful, not being loud. Each time someone finds your reply
            helpful, your tree gets Sunlight. At Blossom Tree you can start mentoring others.
          </p>
        </div>

        {/* Each tree stands one step higher than the last; the dotted path joins their feet. */}
        <div
          className="gq-d-climb relative mt-14 [--label:56px] [--rise:0px] sm:[--rise:28px] lg:[--rise:44px]"
          data-reveal
        >
          <svg
            aria-hidden="true"
            className="gq-d-path absolute right-[10%] left-[10%] hidden h-[calc(var(--rise)*4)] w-[80%] sm:block"
            style={{ bottom: "calc(var(--label) + 12px)" }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100 L100 0"
              stroke="var(--gq-orange)"
              strokeOpacity="0.55"
              strokeWidth="3"
              strokeDasharray="1 12"
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <ol
            className="relative grid grid-cols-5 items-end gap-2 sm:gap-6"
            aria-label="The five tree levels"
          >
            {LEVELS.map((l, i) => (
              <li
                key={l.level}
                className="gq-d-step flex flex-col items-center text-center"
                style={{ paddingBottom: `calc(${i} * var(--rise))`, ...d(500 + i * 260) }}
              >
                <span className="relative block aspect-square w-full">
                  <Image
                    src={STAGE_SRC[l.level]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 260px, 20vw"
                    className="object-contain object-bottom"
                  />
                </span>
                <span className="flex h-[var(--label)] flex-col justify-start pt-2">
                  <span className="text-xs font-semibold sm:text-base">{l.level}</span>
                  <span className="text-xs text-[var(--gq-ink-soft)] tabular-nums sm:text-sm">
                    {l.at.toLocaleString()} Sunlight
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Partners */

function Partners() {
  return (
    <section
      id="partners"
      aria-labelledby="partners-h"
      className="relative scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32"
    >
      <Branch
        kind="side"
        w="clamp(180px, 24vw, 400px)"
        className="-top-4 -right-12 lg:-top-10 lg:-right-24"
      />
      <div className="relative mx-auto grid max-w-[1376px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h2 id="partners-h" className="gq-display text-5xl lg:text-6xl">
            Room for partners too
          </h2>
          <div className="mt-10 space-y-8">
            <div className="flex gap-4">
              <OrangeDot />
              <div>
                <h3 className="text-xl font-semibold">Their own private account</h3>
                <p className="mt-2 max-w-[48ch] text-base text-[var(--gq-ink-soft)]">
                  Partners join with your invite and get an account of their own, in a community
                  where somebody finally asks about them.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <OrangeDot />
              <div>
                <h3 className="text-xl font-semibold">A family space you both choose</h3>
                <p className="mt-2 max-w-[48ch] text-base text-[var(--gq-ink-soft)]">
                  Share an appointment question list, a saved article or a family note. Nothing is
                  shared until you share it.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <Btn href="/signup">Create account</Btn>
          </div>
        </div>
        <div
          className="relative mx-auto aspect-square w-full max-w-[500px] lg:col-span-5 lg:col-start-8"
          data-reveal
        >
          <div aria-hidden className="absolute inset-0 rounded-full bg-[var(--gq-sky)]" />
          <div className="gq-frame absolute inset-[7%]">
            <Image
              src="/assets/brand/landing/partners.webp"
              alt="Two young orange trees on a hill above a lake, their branches reaching toward each other"
              fill
              sizes="(min-width: 1024px) 460px, 90vw"
              quality={90}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Join */

function Join() {
  return (
    <Link
      href="/signup"
      className="gq-band group mt-16 block text-[var(--gq-ink)]"
      style={{ "--band": "var(--gq-band-4)" } as React.CSSProperties}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center px-5 py-16 text-center sm:px-8 lg:py-24">
        <span className="flex items-end gap-[2vw]">
          <span className="gq-script text-[30vw] leading-[0.85] transition-colors duration-500 group-hover:text-[var(--gq-primary)] lg:text-[16vw]">
            Join
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="mb-[3vw] h-[9vw] w-[9vw] transition-transform duration-500 ease-[var(--gq-ease)] group-hover:translate-x-1.5 group-hover:-translate-y-1.5 lg:mb-[2vw] lg:h-[4vw] lg:w-[4vw]"
          >
            <path
              d="M12 36 L36 12 M16 12 H36 V32"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="mt-6 max-w-[34ch] text-xl">
          Invite-only during the beta. Bring the link a member sent you, and we&apos;ll take it from
          there.
        </p>
      </div>
    </Link>
  );
}

export function LandingRiviera() {
  useReveal();
  return (
    <div className="gq gq-d" data-v="d">
      <div aria-hidden className="gq-grain" />
      <SiteNav />
      <Hero />
      <main>
        <Privacy />
        <Statement />
        <Specimens />
        <WhereAreYou />
        <LearnList />
        <Grow />
        <Partners />
        <Join />
      </main>
      <Footer />
    </div>
  );
}
