"use client";

/* The landing page in the client's gouache direction (Nov 2026 brief). Same
   sections, order and copy as the live landing (components/landing/Landing.tsx,
   kept 1:1), and the same brand colours and faces: only approved tokens,
   Instrument Serif and Instrument Sans. What changes is the painting around
   them: pastel bands from the brand tints with dry-brushed edges, citrus
   botanical garland dividers and hanging sprigs, an italic accent,
   soft rounded cards with soft shadows, and calm motion (slow fades only).

   Three versions (`v`) share this file; gouache.css holds their tokens.
     a  Riviera        the brand's grove, round pictures on tinted discs
     b  Travel poster  a painted Riviera grove as the hero, round matted prints
     c  Storybook      the grove, a garland sprig under each heading like a chapter ornament
   Every picture is in the brand's one watercolour hand: the brand's own art,
   plus a garland and the poster painted from it as reference. */

import { useAmbient } from "@/components/art/Cozy";
import { STAGE_SRC, TreeArt } from "@/components/art/Tree";
import { Logo, LogoOrange } from "@/components/shared";
import { ARTICLES, articleCover } from "@/lib/data/articles";
import { GROUPS } from "@/lib/data/groups";
import { hueInk } from "@/lib/hue";
import { LEVELS } from "@/lib/rules/sunlight";
import { useStore } from "@/lib/store";
import { Menu as MenuIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Grove } from "../Grove";
import { GuideScene } from "../GuideScene";

export type GouacheVersion = "a" | "b" | "c";

const ART = "/assets/brand/gouache";

/* ------------------------------------------------------------- Motion */

export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const el of document.querySelectorAll("[data-reveal]")) io.observe(el);
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
}

/** The brand's growth film, played once in each near tree of the grove. */
function GrowingTree({
  ref,
  className = "",
}: { ref: React.Ref<HTMLVideoElement>; className?: string }) {
  return (
    <video
      ref={ref}
      className={className}
      poster="/assets/brand/tree-grow-first.webp"
      muted
      playsInline
      preload="auto"
      aria-hidden
    >
      <source src="/assets/brand/tree-grow-alpha.mov" type='video/quicktime; codecs="hvc1"' />
      <source src="/assets/brand/tree-grow-alpha.webm" type="video/webm" />
    </video>
  );
}

function useGrowTogether() {
  const left = useRef<HTMLVideoElement>(null);
  const right = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const v of [left.current, right.current]) {
        if (v) v.poster = "/assets/brand/tree-grow-last.webp";
      }
      return;
    }
    const films = [left.current, right.current].filter(
      (v): v is HTMLVideoElement => !!v && v.offsetParent !== null,
    );
    const start = () => {
      if (!films.every((v) => v.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA)) return;
      for (const v of films) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      }
    };
    for (const v of films) v.addEventListener("canplaythrough", start, { once: true });
    start();
    return () => {
      for (const v of films) v.removeEventListener("canplaythrough", start);
    };
  }, []);
  return [left, right] as const;
}

/* -------------------------------------------------------------- Pieces */

export function Btn({
  href,
  children,
  quiet,
  small,
}: { href: string; children: React.ReactNode; quiet?: boolean; small?: boolean }) {
  return (
    <Link
      href={href}
      className={`gq-btn ${quiet ? "gq-btn-quiet" : "gq-btn-primary"} ${small ? "gq-btn-sm" : ""}`}
    >
      {children}
    </Link>
  );
}

/* The brand's own painted branches (public/assets/brand/cozy), in the same
   watercolour hand as the trees and pictures, hanging in from an edge and
   swaying slowly while on screen. */
const BRANCH = {
  hang: { src: "/assets/brand/cozy/e-branch-hang.webp", w: 1600, h: 2005, origin: "origin-top" },
  blossom: {
    src: "/assets/brand/cozy/e-blossom-hang.webp",
    w: 1472,
    h: 2220,
    origin: "origin-top",
  },
  side: {
    src: "/assets/brand/cozy/e-branch-side.webp",
    w: 1600,
    h: 885,
    origin: "origin-[100%_20%]",
  },
};

export function Branch({
  kind,
  className,
  w,
}: { kind: keyof typeof BRANCH; className: string; w: string }) {
  const ref = useAmbient<HTMLSpanElement>();
  const b = BRANCH[kind];
  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute block ${className}`}
      style={{ width: w }}
    >
      <span className={`ambient gq-sway block ${b.origin}`}>
        <Image
          src={b.src}
          alt=""
          width={b.w}
          height={b.h}
          sizes={w.includes("%") ? "200px" : w}
          className="h-auto w-full"
        />
      </span>
    </span>
  );
}

/** Storybook (c): a small sprig of the garland under a section heading, like a chapter ornament. */
function Ornament({ v, center }: { v: GouacheVersion; center?: boolean }) {
  if (v !== "c") return null;
  return (
    <span aria-hidden className={`mt-4 block w-[150px] ${center ? "mx-auto" : ""}`}>
      <Image
        src={`${ART}/orange-garland.webp`}
        alt=""
        width={2000}
        height={589}
        sizes="150px"
        className="h-auto w-full"
      />
    </span>
  );
}

/** The orange garland: a painted divider between sections, in the brand's hand. */
export function Garland({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none mx-auto w-full max-w-[760px] px-5 ${className}`}
      data-reveal
    >
      <Image
        src={`${ART}/orange-garland.webp`}
        alt=""
        width={2000}
        height={589}
        sizes="(min-width: 800px) 760px, 100vw"
        className="h-auto w-full"
      />
    </div>
  );
}

export function OrangeDot() {
  return (
    <span
      aria-hidden
      className="mt-[0.5em] inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--gq-orange)]"
    />
  );
}

export const PRIVACY: { text: string; art: string }[] = [
  {
    text: "You post under a handle, not your name",
    art: "/assets/brand/landing/privacy-handle.webp",
  },
  { text: "No ad trackers, ever", art: "/assets/brand/landing/privacy-trackers.webp" },
  { text: "Your health data is never sold", art: "/assets/brand/landing/privacy-sold.webp" },
  {
    text: "Download or delete everything, any time",
    art: "/assets/brand/landing/privacy-download.webp",
  },
];

/* ------------------------------------------------------------- Navbar */

const NAV = [
  { id: "groups", label: "How it works" },
  { id: "learn", label: "Library" },
  { id: "grow", label: "Your tree" },
  { id: "partners", label: "Partners" },
];

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function SiteNav() {
  const signedIn = useStore((s) => s.signedIn && s.step >= 9);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen.length) setActive(seen[0].target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    for (const x of els) io.observe(x);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  const solid = scrolled || open;
  const link =
    "inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors duration-300";
  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute top-0 h-px w-px" />
      <nav
        aria-label="Site"
        className={`sticky top-0 z-50 -mb-20 transition-[background-color,box-shadow] duration-500 ${
          solid
            ? "bg-[var(--gq-ground)]/90 shadow-[0_1px_0_var(--gq-line)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-6 px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link
            href="/"
            aria-label="Fertility Grove home"
            className="shrink-0 justify-self-start"
            onClick={() => setOpen(false)}
          >
            <Logo height={42} priority />
          </Link>
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? "location" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(n.id);
                  }}
                  className={`${link} ${active === n.id ? "bg-[var(--gq-paper)] text-[var(--gq-ink)] shadow-[0_0_0_1px_var(--gq-line)]" : "text-[var(--gq-ink-soft)] hover:text-[var(--gq-ink)]"}`}
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/community"
                className={`${link} text-[var(--gq-ink-soft)] hover:text-[var(--gq-ink)]`}
              >
                Read posts
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                className={`${link} text-[var(--gq-ink-soft)] hover:text-[var(--gq-ink)]`}
              >
                Help
              </Link>
            </li>
          </ul>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:justify-self-end">
            {signedIn ? (
              <Btn href="/feed" small>
                Your grove
              </Btn>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${link} text-[var(--gq-ink)] hover:bg-[var(--gq-paper)]/70`}
                >
                  Sign in
                </Link>
                <span className="hidden sm:inline-flex">
                  <Btn href="/signup" small>
                    Create account
                  </Btn>
                </span>
              </>
            )}
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid h-11 w-11 place-items-center rounded-full text-[var(--gq-ink)] hover:bg-[var(--gq-paper)]/70 lg:hidden"
            >
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div
            id="site-menu"
            className="gq-fade-in border-t border-[var(--gq-line)] bg-[var(--gq-ground)] px-5 pt-3 pb-6 sm:px-8 lg:hidden"
          >
            <ul className="flex flex-col">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      goTo(n.id);
                    }}
                    className="flex h-12 items-center text-lg font-semibold"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/community" className="flex h-12 items-center text-lg font-semibold">
                  Read posts
                </Link>
              </li>
              <li>
                <Link href="/help" className="flex h-12 items-center text-lg font-semibold">
                  Help
                </Link>
              </li>
            </ul>
            {!signedIn && (
              <Link href="/signup" className="gq-btn gq-btn-primary mt-3 w-full">
                Create account
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

/* ------------------------------------------------------------- Hero */

function HeroCopy() {
  return (
    <div className="gq-fade-in text-center">
      <p className={"gq-script gq-hero-kicker text-[var(--gq-ink-soft)] text-3xl sm:text-4xl"}>
        Welcome to the grove
      </p>
      <h1 className="gq-display gq-hero-h1 mx-auto mt-3 max-w-[24ch] lg:max-w-[28ch] text-4xl leading-[1.05] sm:text-5xl sm:leading-[1.04] xl:text-6xl xl:leading-[1.02]">
        The first purpose built platform for the fertility community.
      </h1>
      <p className="mx-auto mt-5 max-w-[46ch] text-lg text-[var(--gq-ink-soft)] sm:text-xl">
        A private community for people going through infertility, and their partners.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Btn href="/signup">Create account</Btn>
        <Btn href="/login" quiet>
          Sign in
        </Btn>
      </div>
      <p className="mt-4 text-sm text-[var(--gq-ink-soft)]">
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
  );
}

function Hero({ v }: { v: GouacheVersion }) {
  const [leftTree, rightTree] = useGrowTogether();
  const poster = v === "b";
  return (
    <header className="relative overflow-hidden">
      <div
        className="relative h-[var(--hero-h)]"
        style={{ "--hero-h": "max(700px, 100svh)", "--edge": "0px" } as React.CSSProperties}
      >
        {poster ? (
          // The travel poster: one painted Riviera grove, the sky left open for the words.
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <Image
              src={`${ART}/grove-poster.webp`}
              alt=""
              fill
              priority
              sizes="100vw"
              quality={90}
              className="gq-breathe object-cover object-[50%_88%]"
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <Grove
              films={[
                <GrowingTree
                  key="l"
                  ref={leftTree}
                  className="h-full w-full object-cover object-bottom"
                />,
                <GrowingTree
                  key="r"
                  ref={rightTree}
                  className="h-full w-full object-cover object-bottom"
                />,
              ]}
            />
          </div>
        )}

        {v === "a" && (
          <Branch
            kind="hang"
            w="clamp(90px, 10vw, 170px)"
            className="-top-6 left-[17%] hidden lg:block"
          />
        )}
        {v === "c" && (
          <>
            <Branch
              kind="hang"
              w="clamp(80px, 9vw, 150px)"
              className="-top-6 left-[16%] hidden lg:block"
            />
            <Branch
              kind="blossom"
              w="clamp(70px, 7vw, 120px)"
              className="-top-8 right-[19%] hidden lg:block"
            />
          </>
        )}

        <div
          className={`absolute inset-x-0 top-20 z-10 flex items-center justify-center px-5 sm:px-8 ${poster ? "bottom-[46%]" : "bottom-[45%]"}`}
        >
          <HeroCopy />
        </div>
      </div>

      {/* Private by default: a flat painted band, nothing behind the promises. */}
      <div className="gq-band" style={{ "--band": "var(--gq-band-1)" } as React.CSSProperties}>
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12 lg:py-16">
          <div>
            {v === "b" && <p className="gq-eyebrow mb-2">Our promise</p>}
            <h2 className="gq-display text-3xl">Private by default</h2>
            <Ornament v={v} />
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-4 text-base sm:grid-cols-2 lg:grid-cols-4">
            {PRIVACY.map(({ text, art }, i) => (
              <li
                key={text}
                className="flex items-center gap-4"
                data-reveal
                style={{ transitionDelay: `${i * 140}ms` }}
              >
                <span
                  aria-hidden
                  className="relative block h-20 w-20 shrink-0 lg:h-[104px] lg:w-[104px]"
                >
                  <Image
                    src={art}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 104px, 80px"
                    quality={90}
                    className="object-contain"
                  />
                </span>
                <span className="font-semibold text-balance">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------- Statement */

export function Thumb({ src, alt, bg }: { src: string; alt: string; bg?: string }) {
  return (
    <span
      className="relative mx-[0.12em] inline-block h-[0.9em] w-[0.9em] overflow-hidden rounded-full align-[-0.1em] shadow-[var(--gq-shadow)]"
      style={bg ? { background: bg } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="60px"
        className={bg ? "object-contain p-[8%]" : "object-cover"}
      />
    </span>
  );
}

function Statement({ v }: { v: GouacheVersion }) {
  const word = "whitespace-nowrap";
  const mark = "-ml-[0.1em]";
  const line = "block md:whitespace-nowrap";
  return (
    <section
      aria-label="What you get"
      className="relative px-5 pt-32 pb-24 sm:px-8 lg:pt-48 lg:pb-32"
    >
      {v !== "b" && (
        <Branch
          kind="side"
          w="clamp(180px, 26vw, 420px)"
          className="-top-4 -right-12 lg:-top-8 lg:-right-24"
        />
      )}
      {v === "b" && <p className="gq-eyebrow relative mb-6 text-center">What you get</p>}
      <p className="gq-display gq-statement relative text-center text-[clamp(30px,8.4vw,44px)] leading-[1.18]">
        <span data-reveal className={line}>
          Tell us where you are once.
        </span>
        <span data-reveal className={`${line} mt-4 lg:mt-6`} style={{ transitionDelay: "200ms" }}>
          Meet people on your{" "}
          <span className={word}>
            path{" "}
            <Thumb
              src="/assets/brand/landing/stage-trying.webp"
              alt="A path through an orange grove"
            />
            <span className={mark}>,</span>
          </span>{" "}
          answers a clinician{" "}
          <span className={word}>
            reviewed <Thumb src={articleCover("male-factor")} alt="A microscope from the library" />
            <span className={mark}>,</span>
          </span>
        </span>
        <span data-reveal className={`${line} mt-4 lg:mt-6`} style={{ transitionDelay: "400ms" }}>
          and someone who&apos;s been{" "}
          <span className={word}>
            there{" "}
            <Thumb
              src="/assets/brand/art/tree-orange.webp"
              alt="An orange tree in fruit"
              bg="var(--gq-sage)"
            />
            <span className={mark}>.</span>
          </span>
        </span>
      </p>
      <Garland className="relative mt-24 lg:mt-32" />
    </section>
  );
}

/* ------------------------------------------------------------- Six ways in */

export const SPECIMENS: {
  name: string;
  fact: string;
  art: string;
  bg: string;
  wide?: boolean;
  bleed?: boolean;
}[] = [
  {
    name: "Mentors who've been there",
    fact: "Experienced members mentor for free. No application, just time in the grove.",
    art: "/assets/brand/landing/way-mentors-bench.webp",
    bg: "var(--gq-card-1)",
    wide: true,
    bleed: true,
  },
  {
    name: "Matched groups",
    fact: "Join up to five groups chosen for your diagnosis and stage, each with the reason why.",
    art: "/assets/brand/landing/way-groups.webp",
    bg: "var(--gq-card-2)",
  },
  {
    name: "The Grove Guide",
    fact: "Ask anything. It answers only from reviewed articles and shows its sources.",
    art: "guide",
    bg: "var(--gq-card-3)",
  },
  {
    name: "Success stories, kept apart",
    fact: "Hope when you want it. Pregnancy news stays in its own space.",
    art: "/assets/brand/landing/way-stories.webp",
    bg: "var(--gq-card-4)",
    wide: true,
  },
  {
    name: "A family space",
    fact: "Share a question list or a note with your partner, only when you choose.",
    art: "/assets/brand/landing/way-family.webp",
    bg: "var(--gq-card-5)",
  },
  {
    name: "Your tree",
    fact: "Grow from Seed to Orange Tree each time someone finds you helpful.",
    art: "tree",
    bg: "var(--gq-card-6)",
  },
];

function Specimens({ v }: { v: GouacheVersion }) {
  return (
    <section
      id="groups"
      aria-labelledby="spec-h"
      className="mx-auto grid max-w-[1440px] scroll-mt-24 grid-cols-1 gap-8 px-5 pb-24 sm:px-8 lg:grid-cols-12 lg:pb-36"
    >
      <div className="lg:col-span-3" data-reveal>
        {v === "b" && <p className="gq-eyebrow mb-3">How it works</p>}
        <h2 id="spec-h" className="gq-display text-5xl lg:text-6xl">
          Six ways in
        </h2>
        <Ornament v={v} />
        <p className="mt-4 max-w-[30ch] text-base text-[var(--gq-ink-soft)]">
          Groups, answers, mentors and your partner, so this isn&apos;t one more thing to juggle.
        </p>
      </div>
      {/* biome-ignore lint/a11y/noRedundantRoles lint/a11y/useSemanticElements: role="list" restores list semantics that Safari/VoiceOver drop under list-style: none; do not remove */}
      <ul className="grid grid-cols-2 gap-4 lg:col-span-9 lg:grid-cols-4 lg:gap-6" role="list">
        {SPECIMENS.map((s, i) => (
          <li
            key={s.name}
            data-reveal
            style={{ transitionDelay: `${i * 120}ms` }}
            className={s.wide ? "col-span-2" : ""}
          >
            <div
              className={`gq-card relative grid place-items-center overflow-hidden px-4 pt-6 ${s.wide ? "aspect-[8/5]" : "aspect-[4/5]"}`}
              style={{ background: s.bg }}
            >
              {s.art === "tree" ? (
                <TreeArt level="Orange Tree" size={170} />
              ) : s.art === "guide" ? (
                <GuideScene delay={i * 120} />
              ) : s.bleed ? (
                <span className="absolute inset-x-0 bottom-[5%] block aspect-[1400/906]">
                  <Image
                    src={s.art}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    quality={90}
                    className="object-contain"
                  />
                </span>
              ) : (
                <span
                  className={`relative block ${s.wide ? "h-[74%] w-[60%]" : "h-[66%] w-[84%]"}`}
                >
                  <Image
                    src={s.art}
                    alt=""
                    fill
                    sizes={
                      s.wide ? "(min-width: 1024px) 320px, 60vw" : "(min-width: 1024px) 200px, 40vw"
                    }
                    quality={90}
                    className="object-contain"
                  />
                </span>
              )}
            </div>
            <h3 className="mt-4 text-xl font-semibold">{s.name}</h3>
            <p className="mt-1 text-base text-[var(--gq-ink-soft)]">{s.fact}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- Where are you */

export const STAGES = [
  {
    stage: "Trying to conceive",
    line: "Months of trying, and wondering what's next.",
    photo: "/assets/brand/landing/stage-trying.webp",
    alt: "A sunlit path winding up through an orange grove",
    disc: "var(--gq-sage)",
    groups: ["g-waiting", "g-unexplained", "g-work"],
    article: "unexplained-infertility",
  },
  {
    stage: "Waiting on tests",
    line: "Appointments booked, answers not back yet.",
    photo: "/assets/brand/landing/stage-waiting.webp",
    alt: "A garden bench under an orange tree, beside a path to a closed gate",
    disc: "var(--gq-sky)",
    groups: ["g-waiting", "g-pcos", "g-mf"],
    article: "pcos",
  },
  {
    stage: "In treatment",
    line: "IUI, IVF or surgery, and everything in between.",
    photo: "/assets/brand/landing/stage-treatment.webp",
    alt: "An orange branch in white blossom, a small green fruit just forming",
    disc: "var(--gq-blush)",
    groups: ["g-ivf", "g-iui", "g-endo"],
    article: "endometriosis",
  },
  {
    stage: "Taking a break",
    line: "Stepping back for a while, without stepping away.",
    photo: "/assets/brand/landing/stage-break.webp",
    alt: "A hammock in dappled shade at the edge of a still lake",
    disc: "var(--gq-butter)",
    groups: ["g-break", "g-rpl", "g-unexplained"],
    article: "recurrent-pregnancy-loss",
  },
  {
    stage: "I'm a partner",
    line: "Supporting someone you love, and needing support too.",
    photo: "/assets/brand/landing/stage-partner.webp",
    alt: "Two chairs side by side facing a lake under an orange tree",
    disc: "var(--gq-blush)",
    groups: ["g-partners", "g-mf", "g-donor"],
    article: "male-factor",
  },
];

function WhereAreYou({ v }: { v: GouacheVersion }) {
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
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)] lg:gap-14 lg:py-28">
        <div className="order-2 lg:order-1">
          {v === "b" && <p className="gq-eyebrow mb-3">Your path</p>}
          <h2 id="where-h" className="gq-display text-4xl lg:text-5xl">
            Where are you right now?
          </h2>
          <Ornament v={v} />
          <div
            role="tablist"
            aria-label="Journey stage"
            aria-orientation="vertical"
            className="mt-6 flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1.5"
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
                className={`flex shrink-0 flex-col items-start rounded-[20px] px-4 py-3 text-left transition-[background-color,box-shadow,color] duration-500 lg:w-full ${
                  k === i
                    ? "bg-[var(--gq-primary)] text-[var(--gq-on-primary)] shadow-[var(--gq-shadow-btn)]"
                    : "text-[var(--gq-ink-soft)] hover:bg-[var(--gq-paper)]/70 hover:text-[var(--gq-ink)]"
                }`}
              >
                <span className="text-lg font-semibold lg:text-xl">{s.stage}</span>
                <span
                  className={`mt-0.5 text-sm lg:text-base ${k === i ? "opacity-85" : "hidden lg:block"}`}
                >
                  {s.line}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={"relative order-1 mx-auto w-full max-w-[480px] lg:order-2 aspect-square"}>
          {v !== "b" && (
            <div
              className="absolute inset-0 rounded-full transition-colors duration-700"
              style={{ background: cur.disc }}
            />
          )}
          <div className={`gq-frame absolute ${v === "b" ? "inset-[4%]" : "inset-[9%]"}`}>
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
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  quality={90}
                  className="object-cover"
                  priority={k === 0}
                />
              </div>
            ))}
          </div>
          <span className="absolute right-[2%] bottom-[4%]">
            <LogoOrange size={60} />
          </span>
        </div>

        <div aria-live="polite" className="gq-card order-3 bg-[var(--gq-paper)] p-6 text-base">
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
    </section>
  );
}

/* ------------------------------------------------------------- Library */

function LearnList({ v }: { v: GouacheVersion }) {
  return (
    <section
      id="learn"
      aria-labelledby="learn-h"
      className="mx-auto max-w-[1440px] scroll-mt-20 px-5 py-24 sm:px-8 lg:py-36"
    >
      <div className="flex items-baseline justify-between gap-4" data-reveal>
        <div>
          {v === "b" && <p className="gq-eyebrow mb-3">The library</p>}
          <h2 id="learn-h" className="gq-display text-5xl lg:text-6xl">
            Clinician-reviewed library
          </h2>
          <Ornament v={v} />
        </div>
        <span className="shrink-0 text-base whitespace-nowrap text-[var(--gq-ink-soft)]">
          6 articles
        </span>
      </div>
      <p className="mt-4 max-w-[60ch] text-base text-[var(--gq-ink-soft)]" data-reveal>
        One for each of six diagnoses, each reviewed by a clinician before it&apos;s published. Read
        the summaries now; the full articles open when you join.
      </p>
      <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a, i) => (
          <li key={a.slug} data-reveal style={{ transitionDelay: `${(i % 3) * 140}ms` }}>
            <span aria-hidden className="gq-card relative block aspect-[16/9] overflow-hidden">
              <Image
                src={articleCover(a.slug)}
                alt=""
                fill
                sizes="(min-width: 1024px) 440px, (min-width: 640px) 50vw, 100vw"
                quality={90}
                className="object-cover"
              />
            </span>
            <p className="mt-6 text-sm font-semibold" style={{ color: hueInk(a.hue) }}>
              {a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis}
            </p>
            <h3 className="mt-1 text-xl font-semibold">{a.title}</h3>
            <p className="mt-2 text-base text-[var(--gq-ink-soft)]">{a.summary}</p>
            <p className="mt-3 text-sm text-[var(--gq-ink-soft)] tabular-nums">
              {a.readMinutes} min read · Reviewed {a.lastReviewed}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- Grow */

function Grow({ v }: { v: GouacheVersion }) {
  return (
    <section
      id="grow"
      aria-labelledby="grow-h"
      className="gq-band my-16 scroll-mt-20"
      style={{ "--band": "var(--gq-band-3)" } as React.CSSProperties}
    >
      <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-reveal>
          <div className="lg:col-span-4">
            {v === "b" && <p className="gq-eyebrow mb-3">Your tree</p>}
            <h2 id="grow-h" className="gq-display text-5xl lg:text-6xl">
              Grow by helping
            </h2>
            <Ornament v={v} />
          </div>
          <p className="max-w-[46ch] text-base text-[var(--gq-ink-soft)] lg:col-span-5 lg:col-start-6">
            The grove rewards being useful, not being loud. Each time someone finds your reply
            helpful, your tree gets Sunlight. At Blossom Tree you can start mentoring others.
          </p>
        </div>
        <ol
          className="mt-12 grid grid-cols-5 items-start gap-2 sm:gap-6"
          aria-label="The five tree levels"
        >
          {LEVELS.map((l, i) => (
            <li
              key={l.level}
              data-reveal
              style={{ transitionDelay: `${i * 160}ms` }}
              className="flex flex-col items-center text-center"
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
              <span className="mt-2 text-xs font-semibold sm:text-base">{l.level}</span>
              <span className="text-xs text-[var(--gq-ink-soft)] tabular-nums sm:text-sm">
                {l.at.toLocaleString()} Sunlight
              </span>
            </li>
          ))}
        </ol>
        {v === "c" && (
          <p className="gq-script mt-10 text-center text-4xl text-[var(--gq-ink-soft)]" data-reveal>
            every kind reply is a little sunlight
          </p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Partners */

function Partners({ v }: { v: GouacheVersion }) {
  return (
    <section
      id="partners"
      aria-labelledby="partners-h"
      className="relative scroll-mt-20 px-5 py-24 sm:px-8 lg:py-36"
    >
      <div className="relative mx-auto grid max-w-[1376px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative mx-auto aspect-square w-full max-w-[480px]" data-reveal>
          <div className={`gq-frame absolute ${v === "b" ? "inset-[4%]" : "inset-0"}`}>
            <Image
              src="/assets/brand/landing/partners.webp"
              alt="Two young orange trees on a hill above a lake, their branches reaching toward each other"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              quality={90}
              className="object-cover"
            />
          </div>
        </div>
        <div>
          {v === "b" && (
            <p className="gq-eyebrow mb-3" data-reveal>
              For partners
            </p>
          )}
          <div data-reveal>
            <h2 id="partners-h" className="gq-display text-5xl lg:text-6xl">
              Room for partners too
            </h2>
            <Ornament v={v} />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2" data-reveal>
            <div>
              <h3 className="text-xl font-semibold">Their own private account</h3>
              <p className="mt-2 text-base text-[var(--gq-ink-soft)]">
                Partners join with your invite and get an account of their own, in a community where
                somebody finally asks about them.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">A family space you both choose</h3>
              <p className="mt-2 text-base text-[var(--gq-ink-soft)]">
                Share an appointment question list, a saved article or a family note. Nothing is
                shared until you share it.
              </p>
            </div>
          </div>
          <div className="mt-10" data-reveal>
            <Btn href="/signup">Create account</Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Join + footer */

function Join({ v }: { v: GouacheVersion }) {
  return (
    <Link
      href="/signup"
      className="gq-band group mt-16 block text-[var(--gq-ink)]"
      style={{ "--band": "var(--gq-band-4)" } as React.CSSProperties}
    >
      <div className="relative mx-auto flex max-w-[1440px] flex-col justify-between gap-10 px-5 py-12 sm:px-8 lg:min-h-[52svh] lg:flex-row lg:items-end">
        <p className="max-w-[28ch] text-xl">
          Invite-only during the beta. Bring the link a member sent you, and we&apos;ll take it from
          there.
        </p>
        <span className={"flex items-end gap-[3vw] "}>
          <span
            className={`${v === "a" ? "gq-script text-[30vw] leading-[0.8] lg:text-[20vw]" : "gq-display text-[30vw] leading-[0.72] lg:text-[20vw]"} transition-colors duration-500 group-hover:text-[var(--gq-primary)]`}
          >
            Join
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="mb-[2vw] h-[9vw] w-[9vw] transition-transform duration-500 ease-[var(--gq-ease)] group-hover:translate-x-1.5 group-hover:-translate-y-1.5 lg:h-[5vw] lg:w-[5vw]"
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
      </div>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-[var(--gq-ground-2)] pt-16">
      <Garland className="mb-8 max-w-[560px] opacity-90" />
      <div className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Logo height={44} />
          </div>
          <nav aria-label="Product" className="lg:col-span-2">
            <ul className="space-y-2 text-base">
              <li>
                <Link href="#learn" className="hover:underline">
                  Learn
                </Link>
              </li>
              <li>
                <Link href="#partners" className="hover:underline">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:underline">
                  Help
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Legal" className="lg:col-span-3">
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/terms" className="hover:underline">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy#health-data" className="hover:underline">
                  Consumer Health Data Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
          <div className="lg:col-span-4">
            <p className="text-base font-semibold">
              If you&apos;re struggling right now, call or text 988.
            </p>
            <p className="mt-1 text-base text-[var(--gq-ink-soft)]">
              The Suicide & Crisis Lifeline is free, confidential and open all day and night. In an
              emergency, call 911.
            </p>
            <a href="tel:988" className="gq-btn gq-btn-primary gq-btn-sm mt-4">
              Call 988
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-8 text-sm text-[var(--gq-ink-soft)]">
          <p className="max-w-[90ch]">
            Fertility Grove © 2026. US only. Botanical plate: <em>Citrus limonum</em> by Rungiah,
            text by Robert Wight (1851), public domain via Wikimedia Commons.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingGouache({ v }: { v: GouacheVersion }) {
  useReveal();
  return (
    <div className="gq" data-v={v}>
      <div aria-hidden className="gq-grain" />
      <SiteNav />
      <Hero v={v} />
      <main>
        <Statement v={v} />
        <Specimens v={v} />
        <WhereAreYou v={v} />
        <LearnList v={v} />
        <Grow v={v} />
        <Partners v={v} />
        <Join v={v} />
      </main>
      <Footer />
    </div>
  );
}
