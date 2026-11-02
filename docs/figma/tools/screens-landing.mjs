// Step 5c: the landing page (components/landing/Landing.tsx) at Desktop 1440,
// Tablet 768 and Phone 390. Sections stack in one auto-layout column; the
// painted wash, hanging branches and the nav sit on top as absolute layers.
// Usage: FG_CHANNEL=fertility-grove node screens-landing.mjs <pageId> [y] [size...]
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { C, T, F, Row, Col, Img, icon, build, send } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSET = (f) => join(HERE, "..", "assets", f);
const [page, startY = "0", ...only] = process.argv.slice(2);

const SIZES = [
  { key: "Desktop 1440", w: 1440 },
  { key: "Tablet 768", w: 768 },
  { key: "Phone 390", w: 390 },
];

const TINT = { purple: "#F1E7F1", pink: "#FFE7DE", blue: "#DFF3FF", pinkBg: "#FFE8F3", neutral: "#F5F5F5", green: "#E0F6EB" };
const TREE = { Seed: "tree-seed", Bush: "tree-bush", Tree: "tree-tree", "Blossom Tree": "tree-blossom", "Orange Tree": "tree-orange" };
const STAGE = { Seed: "stage-seed", Bush: "stage-bush", Tree: "stage-tree", "Blossom Tree": "stage-blossom", "Orange Tree": "stage-orange" };
const tree = (lv, s, p = {}) => Img(`brand/art/${TREE[lv]}.webp`, s, s, { name: lv, scaleMode: "FIT", ...p });
const orange = (w, p = {}) => Img("brand/orange.png", w, Math.round((w * 322) / 297), { name: "Orange", scaleMode: "FIT", ...p });
const logo = (h) => Img("brand/logo.png", Math.round(h * (1295 / 473)), h, { name: "Logo", scaleMode: "FIT" });
const gap = (h) => F({ name: "space", width: 10, height: h });

// Spots (art/Scenes.tsx): pieces on one ground line; x and w are % of width.
const SPOTS = {
  shelter: [["Orange Tree", 4, 62], ["Seed", 58, 36]],
  canopy: [["Tree", 2, 44], ["Orange Tree", 26, 52], ["Blossom Tree", 56, 44]],
  blossom: [["Blossom Tree", 18, 64]],
  roots: [["Tree", 6, 52], ["Blossom Tree", 42, 52]],
};
function spot(kind, size) {
  const h = Math.round((size * 3) / 4);
  if (kind === "lantern") {
    const ow = Math.round(h * 0.62);
    return Row({ name: "Spot lantern", width: size, height: h, w: "fixed", h: "fixed", justify: "center", align: "end" }, [orange(ow)]);
  }
  if (kind === "tree") return tree("Orange Tree", size);
  return F({ name: `Spot ${kind}`, width: size, height: h }, SPOTS[kind].map(([lv, x, w]) => {
    const s = Math.round((size * w) / 100);
    return tree(lv, s, { x: Math.round((size * x) / 100), y: h - s });
  }));
}

const pillBtn = (label, { dark = true, h = 48, px = 28, size = 16 } = {}) =>
  Row({ name: `Button ${label}`, height: h, h: "fixed", padding: [0, px], justify: "center", radius: 999, fill: dark ? C.accent : C.white, stroke: dark ? undefined : C.lineStrong }, [
    T(label, "body", { size, style: "SemiBold", color: dark ? C.white : C.ink, free: true }),
  ]);
const serif = (text, size, p = {}) => T(text, "section", { size, lineHeight: 1, free: true, ...p });

// ------------------------------------------------------------ sections
function nav(v) {
  const pad = v.phone ? 20 : 32;
  const right = v.desk
    ? [pillBtn("Sign in", { dark: false, h: 40, px: 16, size: 15 }), pillBtn("Create account", { h: 40, px: 20, size: 15 })]
    : [
        Row({ name: "Sign in", height: 40, h: "fixed", padding: [0, 16] }, [T("Sign in", "body", { style: "SemiBold" })]),
        !v.phone && pillBtn("Create account", { h: 40, px: 20, size: 15 }),
        Row({ name: "Menu", width: 44, height: 44, w: "fixed", h: "fixed", justify: "center" }, [icon("menu", 22, C.ink, 2)]),
      ];
  if (v.desk) right[0] = Row({ name: "Sign in", height: 40, h: "fixed", padding: [0, 16] }, [T("Sign in", "body", { style: "SemiBold" })]);
  return Row({ name: "Site nav", width: v.w, height: 80, w: "fixed", h: "fixed", justify: "between", padding: [0, pad], absolute: true, x: 0, y: 0 }, [
    Row({ name: "Left", width: v.desk ? 320 : undefined, w: v.desk ? "fixed" : "hug" }, [logo(42)]),
    v.desk && Row({ name: "Links", gap: 4 }, ["How it works", "Library", "Your tree", "Partners", "Help"].map((l) =>
      Row({ name: l, height: 40, h: "fixed", padding: [0, 16], radius: 999 }, [T(l, "body", { style: "SemiBold", color: C.inkSoft })]))),
    Row({ name: "Right", width: v.desk ? 320 : undefined, w: v.desk ? "fixed" : "hug", justify: "end", gap: 8 }, right),
  ]);
}

function hero(v) {
  const titleSize = v.desk ? 52 : v.phone ? 28 : 44;
  const textW = v.desk ? 408 : v.phone ? v.inner : 540;
  const copy = Col({ name: "Copy", width: textW, w: "fixed", align: "center" }, [
    T("The first purpose built platform for the fertility community.", "hero", { size: titleSize, lineHeight: 1.04, tracking: -1, free: true, textAlign: "center", width: v.desk ? 372 : v.phone ? 310 : 480, name: "Headline" }),
    gap(20),
    T("A private community for people going through infertility, and their partners.", "bodyL", { size: 20, lineHeight: 1.6, color: C.muted, textAlign: "center", width: v.phone ? textW : Math.min(textW, 520), free: true }),
    gap(36),
    Row({ name: "Actions", gap: 12 }, [pillBtn("Create account"), pillBtn("Sign in", { dark: false })]),
    gap(16),
    T("Invite-only during the beta. Ask a member for their invite link.", "small", { color: C.muted, textAlign: "center", width: textW, w: "fill" }),
  ]);
  const heroTree = (s) => Img(ASSET("hero-tree.png"), s, s, { name: "Growing tree (film, last frame)", scaleMode: "FIT" });
  const washH = v.desk ? 900 : v.phone ? 432 : 780;
  const body = v.desk
    ? Row({ name: "Hero grid", width: v.inner, w: "fixed", height: 820, h: "fixed", gap: 24, justify: "center" }, [heroTree(460), copy, heroTree(460)])
    : Col({ name: "Hero stack", w: "fill", align: "center", padding: [40, v.pad, 64, v.pad] }, [heroTree(Math.min(300, Math.round(v.inner * 0.64))), copy]);
  return Col({ name: "Hero", w: "fill", align: "center", clip: true, fill: C.white }, [
    Img(ASSET("wash-faded.png"), v.w, washH, { name: "Wash", scaleMode: "FILL", absolute: true, x: 0, y: 0 }),
    gap(80),
    body,
    nav(v),
  ]);
}

function privacy(v) {
  const items = [
    ["You post under a handle, not your name", "q-handle"],
    ["No ad trackers, ever", "q-trackers"],
    ["Your health data is never sold", "q-sold"],
    ["Download or delete everything, any time", "q-download"],
  ];
  const art = v.desk ? 104 : 80;
  const cols = v.desk ? 4 : v.phone ? 1 : 2;
  const listW = v.desk ? v.inner - 48 - 170 : v.inner;
  const itemW = (listW - (cols - 1) * 32) / cols;
  const item = ([t, a]) =>
    Row({ name: t, width: itemW, w: "fixed", gap: 16 }, [
      Img(`brand/cozy/${a}.webp`, art, art, { name: a, scaleMode: "FIT" }),
      T(t, "body", { size: 16, lineHeight: 1.35, width: itemW - art - 16, free: true }),
    ]);
  const rows = [];
  for (let i = 0; i < items.length; i += cols) rows.push(Row({ name: "row", gap: 32 }, items.slice(i, i + cols).map(item)));
  const heading = T("Private by default", "h3", { name: "Heading" });
  return Row({ name: "Private by default", w: "fill", justify: "center", fill: C.raised, padding: [v.desk ? 64 : 48, v.pad] }, [
    v.desk
      ? Row({ name: "inner", width: v.inner, w: "fixed", gap: 48 }, [heading, Col({ name: "Promises", gap: 16 }, rows)])
      : Col({ name: "inner", width: v.inner, w: "fixed", gap: 24 }, [heading, Col({ name: "Promises", gap: 16 }, rows)]),
  ]);
}

function statement(v) {
  const size = v.desk ? 36 : v.phone ? 22 : 28;
  const words = "Tell us where you are once. Meet people on your | forest | path, answers a clinician | pcos | reviewed, and someone who's been there | orange | .";
  const thumbs = { forest: "photos/forest.jpg", pcos: "brand/learn/pcos.webp", orange: "photos/orange-tree.jpg" };
  const parts = words.split(" | ").flatMap((chunk) =>
    thumbs[chunk]
      ? [Img(thumbs[chunk], Math.round(size * 0.9), Math.round(size * 0.9), { name: `thumb ${chunk}`, radius: 999 })]
      : chunk.split(" ").map((w) => T(w, "h2", { size, lineHeight: 1.25, tracking: -1, free: true, name: w })),
  );
  const width = v.desk ? 790 : v.phone ? v.inner : 660;
  const el = v.desk ? { x: v.w - 420 + 144, y: -32, w: 420 } : { x: v.w - 180 + 48, y: -16, w: 180 };
  return Col({ name: "Statement", w: "fill", align: "center", clip: true, padding: [v.desk ? 144 : 96, v.pad] }, [
    Img("brand/cozy/e-branch-side.webp", el.w, Math.round((el.w * 885) / 1600), { name: "Branch", scaleMode: "FIT", absolute: true, x: el.x, y: el.y }),
    Row({ name: "Words", width, w: "fixed", wrap: true, gap: Math.round(size * 0.26), rowGap: 0, justify: v.phone ? "start" : "center" }, parts),
  ]);
}

function sixWays(v) {
  const S = [
    ["Mentors who've been there", "Experienced members mentor for free. No application, just time in the grove.", "shelter", TINT.purple, true],
    ["Matched groups", "Join up to five groups chosen for your diagnosis and stage, each with the reason why.", "canopy", TINT.pink],
    ["The Grove Guide", "Ask anything. It answers only from reviewed articles and shows its sources.", "lantern", TINT.blue],
    ["Success stories, kept apart", "Hope when you want it. Pregnancy news stays in its own space.", "blossom", TINT.pinkBg, true],
    ["A family space", "Share a question list or a note with your partner, only when you choose.", "roots", TINT.neutral],
    ["Your tree", "Grow from Seed to Orange Tree each time someone finds you helpful.", "tree", TINT.green],
  ];
  const gridW = v.desk ? 1024 : v.inner;
  const colW = v.desk ? (gridW - 30) / 4 : (gridW - 10) / 2;
  const card = ([name, fact, art, bg, wide]) => {
    const w = wide ? colW * 2 + 10 : colW;
    const h = Math.round(wide ? (w * 5) / 8 : (w * 5) / 4);
    const artSize = v.phone ? (wide ? 180 : 120) : wide ? 260 : 170;
    return Col({ name, width: w, w: "fixed", gap: 0 }, [
      Col({ name: "Art", width: w, height: h, w: "fixed", h: "fixed", justify: "center", align: "center", padding: [24, 16, 0, 16], radius: 20, fill: bg, clip: true }, [spot(art, artSize)]),
      gap(12),
      T(name, "h3", { size: v.phone ? 17 : 20, free: v.phone, width: w, w: "fill" }),
      gap(4),
      T(fact, "body", { size: v.phone ? 14 : 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: w, w: "fill" }),
    ]);
  };
  const rows = (v.desk ? [[0, 1, 2], [3, 4, 5]] : [[0], [1, 2], [3], [4, 5]]).map((r) => Row({ name: "row", gap: 10, align: "start" }, r.map((i) => card(S[i]))));
  const intro = Col({ name: "Intro", width: v.desk ? 320 : v.inner, w: "fixed", gap: 16 }, [
    serif("Six ways in", v.desk ? 56 : 44),
    T("Groups, answers, mentors and your partner, so this isn't one more thing to juggle.", "body", { size: 16, color: C.inkSoft, width: Math.min(v.desk ? 300 : 340, v.inner), free: true }),
  ]);
  const grid = Col({ name: "Cards", gap: 16 }, rows);
  return Row({ name: "Six ways in", w: "fill", justify: "center", padding: [0, v.pad, v.desk ? 144 : 96, v.pad] }, [
    v.desk ? Row({ name: "inner", width: v.inner, w: "fixed", gap: 32, align: "start" }, [intro, grid]) : Col({ name: "inner", width: v.inner, w: "fixed", gap: 32 }, [intro, grid]),
  ]);
}

function whereAreYou(v) {
  const stages = ["Trying to conceive", "Waiting on tests", "In treatment", "Taking a break", "I'm a partner", "Pregnant after infertility"];
  const tab = (s, k) =>
    Row({ name: s, w: v.desk ? "fill" : "hug", padding: [10, 16], radius: 999, fill: k === 0 ? C.accent : undefined }, [
      T(s, "h3", { size: v.desk ? 22 : 18, color: k === 0 ? C.white : C.inkSoft, free: true }),
    ]);
  const left = Col({ name: "Stages", width: v.desk ? 451 : v.inner, w: "fixed", gap: 16 }, [
    T("Where are you right now?", "h2", { size: v.desk ? 36 : 28, lineHeight: 1.15, free: true, width: v.desk ? 451 : v.inner }),
    v.desk ? Col({ name: "Tabs", w: "fill", gap: 4 }, stages.map(tab)) : Row({ name: "Tabs", width: v.inner, w: "fixed", wrap: true, gap: 8, rowGap: 8 }, stages.map(tab)),
  ]);
  const D = v.desk ? 497 : Math.min(520, v.inner);
  const inset = Math.round(D * 0.09);
  const o = 64;
  const disc = F({ name: "Disc", width: D, height: D }, [
    { type: "ellipse", width: D, height: D, fill: TINT.green, name: "Tint", x: 0, y: 0 },
    Img("photos/forest.jpg", D - inset * 2, D - inset * 2, { name: "A path through a pine forest", radius: 999, x: inset, y: inset }),
    orange(o, { x: Math.round(D * 0.96) - o, y: Math.round(D * 0.94) - Math.round((o * 322) / 297) }),
  ]);
  const dot = (t) => Row({ name: t, gap: 10 }, [{ type: "ellipse", width: 10, height: 10, fill: C.orange, name: "dot" }, T(t, "body", { size: 16 })]);
  const card = Col({ name: "You'd start in", width: v.desk ? 316 : v.inner, w: "fixed", padding: 24, gap: 0, radius: 20, fill: C.white }, [
    T("You'd start in", "body", { size: 16, style: "SemiBold", free: true }),
    gap(8),
    Col({ name: "Groups", gap: 6 }, ["Waiting on a diagnosis", "Unexplained infertility", "Work and treatment"].map(dot)),
    gap(20),
    T("First read", "body", { size: 16, style: "SemiBold", free: true }),
    T("Unexplained infertility", "body", { size: 16, color: C.inkSoft, free: true }),
  ]);
  return Row({ name: "Where are you right now", w: "fill", justify: "center", fill: C.raised, padding: [v.desk ? 112 : 80, v.pad] }, [
    v.desk
      ? Row({ name: "inner", width: v.inner, w: "fixed", gap: 56 }, [left, disc, card])
      : Col({ name: "inner", width: v.inner, w: "fixed", gap: 40, align: "center" }, [disc, left, card]),
  ]);
}

const ARTICLES = [
  ["endometriosis", "Endometriosis", "Endometriosis and fertility", "What endometriosis is, how it can affect getting pregnant, and the treatment paths people usually talk through with their doctor.", "6 min read · Reviewed September 12, 2026", C.inkSoft],
  ["pcos", "PCOS", "PCOS and getting pregnant", "How polycystic ovary syndrome affects ovulation, and the first-line steps doctors usually suggest.", "5 min read · Reviewed August 28, 2026", C.yellowInk],
  ["diminished-ovarian-reserve", "Diminished ovarian reserve", "Diminished ovarian reserve", "What a low AMH or antral follicle count means, what it doesn't mean, and the decisions people often face next.", "6 min read · Reviewed October 2, 2026", C.blueInk],
  ["male-factor", "Male factor infertility", "Male factor infertility", "What a semen analysis measures, common causes of male factor infertility, and what usually happens next.", "5 min read · Reviewed September 30, 2026", C.greenInk],
  ["recurrent-pregnancy-loss", "Recurrent pregnancy loss", "Recurrent pregnancy loss", "What testing after repeated losses usually includes, and why many people go on to have a successful pregnancy.", "6 min read · Reviewed September 5, 2026", C.inkSoft],
  ["unexplained-infertility", "Unexplained infertility", "Unexplained infertility", "What it means when every test is normal, and the usual steps from timed cycles to IVF.", "5 min read · Reviewed October 9, 2026", C.purpleInk],
];

function library(v) {
  const cols = v.desk ? 3 : v.phone ? 1 : 2;
  const cw = (v.inner - (cols - 1) * 24) / cols;
  const card = ([slug, dx, title, summary, meta, ink]) =>
    Col({ name: title, width: cw, w: "fixed", gap: 0 }, [
      Img(`brand/learn/${slug}.webp`, cw, Math.round((cw * 9) / 16), { name: "Cover", radius: 20 }),
      gap(20),
      T(dx, "small", { style: "SemiBold", color: ink }),
      gap(4),
      T(title, "h3", { lineHeight: 1.35, width: cw }),
      gap(8),
      T(summary, "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: cw }),
      gap(12),
      T(meta, "small", { color: C.muted }),
    ]);
  const rows = [];
  for (let i = 0; i < ARTICLES.length; i += cols) rows.push(Row({ name: "row", gap: 24, align: "start" }, ARTICLES.slice(i, i + cols).map(card)));
  return Row({ name: "Clinician-reviewed library", w: "fill", justify: "center", padding: [v.desk ? 144 : 96, v.pad] }, [
    Col({ name: "inner", width: v.inner, w: "fixed", gap: 0 }, [
      Row({ name: "Heading row", w: "fill", justify: "between", align: "end", gap: 16 }, [
        serif("Clinician-reviewed library", v.desk ? 56 : 44, { width: v.phone ? 260 : undefined }),
        T("6 articles", "body", { size: 16, color: C.muted, free: true }),
      ]),
      gap(12),
      T("One for each of six diagnoses, each reviewed by a clinician before it's published. Read the summaries now; the full articles open when you join.", "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: Math.min(v.inner, 600) }),
      gap(48),
      Col({ name: "Articles", gap: 48 }, rows),
    ]),
  ]);
}

function grow(v) {
  const levels = [["Seed", "0"], ["Bush", "50"], ["Tree", "250"], ["Blossom Tree", "750"], ["Orange Tree", "2,000"]];
  const g = v.phone ? 8 : 24;
  const cw = (v.inner - 4 * g) / 5;
  const small = v.phone;
  const head = serif("Grow by helping", v.desk ? 56 : 44, { width: v.desk ? 440 : v.inner });
  const para = T("The grove rewards being useful, not being loud. Each time someone finds your reply helpful, your tree gets Sunlight. At Blossom Tree you can start mentoring others.", "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: Math.min(v.inner, 430) });
  return Row({ name: "Grow by helping", w: "fill", justify: "center", fill: C.raised, padding: [v.desk ? 128 : 96, v.pad] }, [
    Col({ name: "inner", width: v.inner, w: "fixed", gap: 48 }, [
      v.desk ? Row({ name: "Intro", w: "fill", gap: 152, align: "start" }, [head, para]) : Col({ name: "Intro", w: "fill", gap: 24 }, [head, para]),
      Row({ name: "Levels", w: "fill", gap: g, align: "start" }, levels.map(([lv, at]) =>
        Col({ name: lv, width: cw, w: "fixed", align: "center", gap: 0 }, [
          Img(`brand/art/${STAGE[lv]}.webp`, cw, cw, { name: lv, scaleMode: "FIT" }),
          gap(8),
          T(lv, "body", { size: small ? 13 : 16, style: "SemiBold", textAlign: "center", width: cw, free: true }),
          T(`${at} Sunlight`, "small", { size: small ? 13 : 14, color: C.muted, textAlign: "center", width: cw, free: true }),
        ]))),
    ]),
  ]);
}

function partners(v) {
  const D = v.desk ? 520 : Math.min(520, v.inner);
  const colW = v.desk ? (v.inner - 80) / 2 : v.inner;
  const twoUp = !v.phone;
  const tw = twoUp ? (colW - 32) / 2 : colW;
  const block = (h, p) => Col({ name: h, width: tw, w: "fixed", gap: 8 }, [T(h, "h3", { width: tw }), T(p, "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: tw })]);
  const blocks = [
    block("Their own private account", "Partners join with your invite and get an account of their own, in a community where somebody finally asks about them."),
    block("A family space you both choose", "Share an appointment question list, a saved article or a family note. Nothing is shared until you share it."),
  ];
  const text = Col({ name: "Text", width: colW, w: "fixed", gap: 0 }, [
    serif("Room for partners too", v.desk ? 56 : 44, { width: colW }),
    gap(32),
    twoUp ? Row({ name: "Points", gap: 32, align: "start" }, blocks) : Col({ name: "Points", gap: 32 }, blocks),
    gap(36),
    pillBtn("Create account"),
  ]);
  const photo = Row({ name: "Photo column", width: colW, w: "fixed", justify: "center" }, [Img("photos/together.jpg", D, D, { name: "Two people on a rock above a mountain lake", radius: 999 })]);
  const el = v.desk ? { w: 250, x: v.w - 40 - 250, y: -96 } : { w: 120, x: v.w - 8 - 120, y: -80 };
  return Row({ name: "Room for partners too", w: "fill", justify: "center", clip: true, padding: [v.desk ? 144 : 96, v.pad] }, [
    Img("brand/cozy/e-blossom-hang.webp", el.w, Math.round((el.w * 2220) / 1472), { name: "Blossom", scaleMode: "FIT", absolute: true, x: el.x, y: el.y }),
    v.desk ? Row({ name: "inner", width: v.inner, w: "fixed", gap: 80 }, [photo, text]) : Col({ name: "inner", width: v.inner, w: "fixed", gap: 40 }, [photo, text]),
  ]);
}

function joinBand(v) {
  const vw = v.w / 100;
  const size = Math.round((v.desk ? 20 : 30) * vw);
  const arrow = Math.round((v.desk ? 6 : 9) * vw);
  const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><path d="M12 36 L36 12 M16 12 H36 V32" stroke="#090814" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const word = Row({ name: "Join", gap: Math.round(3 * vw), align: "end", padding: [Math.round(size * 0.22), 0, 0, 0] }, [
    T("Join", "section", { size, lineHeight: 0.72, tracking: -3, free: true }),
    Col({ name: "arrow", padding: [0, 0, Math.round(2 * vw), 0] }, [{ type: "svg", svg: arrowSvg, width: arrow, height: arrow, name: "Arrow" }]),
  ]);
  const lede = T("Invite-only during the beta. Bring the link a member sent you, and we'll take it from there.", "bodyL", { size: 20, lineHeight: 1.35, free: true, width: v.phone ? v.inner : 390 });
  const el = v.desk ? { w: 280, x: 40, y: -80 } : { w: 90, x: v.w - 12 - 90, y: -72 };
  return F({ name: "Join", layout: v.desk ? "row" : "column", w: "fill", h: v.desk ? "fixed" : "hug", height: v.desk ? 468 : undefined, justify: "between", align: v.desk ? "end" : "start", gap: 40, fill: TINT.pink, clip: true, padding: [40, v.pad] }, [
    Img("brand/cozy/e-branch-hang.webp", el.w, Math.round((el.w * 2005) / 1600), { name: "Branch", scaleMode: "FIT", absolute: true, x: el.x, y: el.y }),
    lede,
    word,
  ]);
}

function footer(v) {
  const list = (items) => Col({ name: "links", gap: 8 }, items.map((t) => T(t, "body", { size: 16, free: true })));
  const crisisW = v.desk ? 432 : v.phone ? v.inner : (v.inner - 40) / 2;
  const blocks = [
    ["Logo", v.desk ? 314 : null, logo(44)],
    ["Product", v.desk ? 196 : null, list(["Learn", "Partners", "Help"])],
    ["Legal", v.desk ? 314 : null, list(["Terms", "Privacy Policy", "Consumer Health Data Privacy Policy"])],
    ["Crisis", crisisW, Col({ name: "crisis", width: crisisW, w: "fixed", gap: 4 }, [
      T("If you're struggling right now, call or text 988.", "body", { size: 16, style: "SemiBold", free: true, width: crisisW }),
      T("The Suicide & Crisis Lifeline is free, confidential and open all day and night. In an emergency, call 911.", "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: crisisW }),
      gap(8),
      pillBtn("Call 988", { h: 44, px: 20 }),
    ])],
  ];
  const half = (v.inner - 40) / 2;
  const cell = ([name, w, kid]) => Col({ name, width: w || (v.phone ? v.inner : half), w: "fixed" }, [kid]);
  const grid = v.desk
    ? Row({ name: "Columns", gap: 40, align: "start" }, blocks.map(cell))
    : v.phone
      ? Col({ name: "Columns", gap: 40 }, blocks.map(cell))
      : Col({ name: "Columns", gap: 40 }, [Row({ name: "row", gap: 40, align: "start" }, blocks.slice(0, 2).map(cell)), Row({ name: "row", gap: 40, align: "start" }, blocks.slice(2).map(cell))]);
  return Row({ name: "Footer", w: "fill", justify: "center", fill: C.raised, padding: [56, v.pad, 32, v.pad] }, [
    Col({ name: "inner", width: v.inner, w: "fixed", gap: 0 }, [
      grid,
      gap(56),
      T("Fertility Grove © 2026. US only. Botanical plate: Citrus limonum by Rungiah, text by Robert Wight (1851), public domain via Wikimedia Commons.", "small", { color: C.muted, free: true, width: Math.min(v.inner, 760) }),
    ]),
  ]);
}

// ------------------------------------------------------------ build
await send("set_current_page", { pageId: page });
let x = 0;
const y = Number(startY);
const out = [];
for (const size of SIZES) {
  if (only.length && !only.some((o) => size.key.startsWith(o))) {
    x += size.w + 120;
    continue;
  }
  const desk = size.w >= 1280;
  const phone = size.w < 640;
  const pad = phone ? 20 : 32;
  const v = { w: size.w, desk, phone, pad, inner: size.w - pad * 2 };
  // The board first, then one section per call so no single message is huge.
  const shell = F({ name: `Public / Landing / ${size.key}`, width: size.w, w: "fixed", h: "hug", layout: "column", fill: C.white, clip: true, x, y });
  const res = await build([shell]);
  const id = res.roots[0].id;
  for (const make of [hero, privacy, statement, sixWays, whereAreYou, library, grow, partners, joinBand, footer]) {
    await build([make(v)], { parentId: id });
  }
  const info = await send("get_node_info", { nodeId: id });
  const box = info.absoluteBoundingBox || {};
  out.push(`Landing / ${size.key}: ${id} ${box.width}x${box.height}`);
  x += size.w + 120;
}
console.log(out.join("\n"));
