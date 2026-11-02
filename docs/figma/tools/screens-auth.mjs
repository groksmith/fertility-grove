// Step 5a: Auth screens (sign in, create account, password, confirm, invites)
// at Desktop 1440, Tablet 768 and Phone 390.
// Usage: FG_CHANNEL=fertility-grove node screens-auth.mjs <pageId> [screen...]
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { C, T, F, Row, Col, Img, icon, build, send } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const COMP = JSON.parse(readFileSync(join(HERE, "..", "components.json"), "utf8"));
const WASH = join(HERE, "..", "assets", "wash-faded.png");
const [page, ...only] = process.argv.slice(2);

const SIZES = [
  { key: "Desktop 1440", w: 1440, h: 900 },
  { key: "Tablet 768", w: 768, h: 1024 },
  { key: "Phone 390", w: 390, h: 844 },
];

// ------------------------------------------------------------ shared pieces
const inst = (name, props = {}) => ({ type: "instance", componentId: COMP[name], ...props });
const primary = (label, full = true) => inst("Button / Primary / md", { name: `Button ${label}`, texts: { label }, w: full ? "fill" : undefined });

const G = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;
const google = () =>
  Row({ name: "Continue with Google", height: 44, h: "fixed", w: "fill", justify: "center", gap: 8, radius: 999, fill: C.white, stroke: C.lineStrong }, [
    { type: "svg", svg: G, width: 18, height: 18, name: "Google" },
    T("Continue with Google", "body", { style: "SemiBold" }),
  ]);
const divider = () =>
  Row({ name: "or with email", w: "fill", gap: 12 }, [
    F({ name: "line", width: 10, height: 1, fill: C.lineStrong, grow: true, w: "fill" }),
    T("or with email", "caption", { color: C.muted }),
    F({ name: "line", width: 10, height: 1, fill: C.lineStrong, grow: true, w: "fill" }),
  ]);
const field = (label, { hint, eye } = {}) =>
  Col({ name: `Field ${label}`, w: "fill", gap: 8 }, [
    T(label, "small", { style: "SemiBold", name: "label" }),
    Row({ name: "input", height: 44, h: "fixed", w: "fill", padding: [0, 14], justify: "end", radius: 10, fill: C.white, stroke: C.lineStrong }, [eye && icon("eye", 18, C.muted)]),
    hint && T(hint, "caption", { color: C.muted, name: "hint" }),
  ]);
const link = (text, center = true) => T(text, "small", { style: "SemiBold", decoration: "underline", name: "link", textAlign: center ? "center" : "left", w: center ? "fill" : undefined });
const footerLine = (lead, action) =>
  Row({ name: "footer", gap: 4 }, [T(lead, "small", { color: C.muted, name: "lead" }), T(action, "small", { style: "SemiBold", decoration: "underline" })]);
const lines = (items) => Col({ name: "points", w: "fill", gap: 10 }, items.map((t) => T(t, "small", { color: C.inkSoft, width: 300, w: "fill" })));

// The painted panel: wash, a blossom spray from the top right, the tree at
// its growth stage standing at the bottom.
const panel = (w, h, step) =>
  F({ name: "Grove panel", width: w, height: h, radius: 20, fill: C.white, clip: true, w: "fill", h: "fill" }, [
    Img(WASH, w, h, { name: "wash", x: 0, y: 0, scaleMode: "FILL" }),
    Img("brand/cozy/e-blossom-hang.webp", 260, Math.round((260 * 2220) / 1472), { name: "blossom", x: w - 260 - 32, y: -48, scaleMode: "FIT" }),
    Img(`brand/art/grow-${step}.webp`, w, w, { name: `tree (step ${step})`, x: 0, y: h - w, scaleMode: "FIT" }),
  ]);

const header = (pad) =>
  Row({ name: "Header", w: "fill", height: 56, h: "fixed", justify: "between", padding: [0, pad] }, [
    Img("brand/logo.png", Math.round(40 * (1295 / 473)), 40, { name: "Logo", scaleMode: "FIT" }),
    T("Help", "small", { style: "SemiBold", color: C.inkSoft }),
  ]);

// One auth screen at one size.
function authBoard(s, size) {
  const desktop = size.w >= 1024;
  const pad = size.w >= 640 ? 32 : 16;
  const contentW = desktop ? 440 : size.w >= 640 ? 440 : size.w - pad * 2;
  const titleSize = size.w >= 640 ? 44 : 36;
  const formCol = Col({ name: "Form", width: contentW, w: "fixed", gap: 0 }, [
    T(s.title, "pageTitle", { size: titleSize, lineHeight: 1.05, free: true, name: "Title", width: contentW }),
    s.lede && F({ name: "space", width: 10, height: 12 }),
    s.lede && T(s.lede, "body", { size: 16, color: C.inkSoft, width: contentW, name: "Lede", free: true }),
    F({ name: "space", width: 10, height: 28 }),
    Col({ name: "Body", w: "fill", gap: 18 }, s.body()),
  ]);
  const column = (w) =>
    Col({ name: "Column", width: w, w: desktop ? "fill" : "fixed", h: "fill", grow: true, padding: [20, 0, 24, 0], gap: 0 }, [
      header(desktop ? 64 : pad),
      !desktop && Row({ name: "Tree band", w: "fill", height: 144, h: "fixed", justify: "center" }, [Img(`brand/art/grow-${s.step}.webp`, 144, 144, { name: "tree", scaleMode: "FIT" })]),
      Col({ name: "Main", w: "fill", h: "fill", grow: true, justify: "center", align: "center", padding: [desktop ? 48 : 32, pad] }, [formCol]),
      s.footer && Col({ name: "Footer", w: "fill", align: "center", padding: [0, pad] }, [Col({ name: "inner", width: contentW, w: "fixed" }, [footerLine(...s.footer)])]),
    ]);
  const name = `Auth / ${s.name} / ${size.key}`;
  if (desktop) {
    const asideW = Math.round((size.w * 0.9) / 1.9);
    return F({ name, width: size.w, height: size.h, layout: "row", fill: C.white, clip: true, h: "fixed", w: "fixed" }, [
      column(size.w - asideW),
      Col({ name: "Aside", width: asideW, w: "fixed", h: "fill", padding: 16 }, [panel(asideW - 32, size.h - 32, s.step)]),
    ]);
  }
  return F({ name, width: size.w, height: s.minH?.[size.key] || size.h, layout: "column", fill: C.white, clip: true, w: "fixed", h: "fixed" }, [column(size.w)]);
}

// ------------------------------------------------------------ the screens
const SCREENS = {
  "Sign in": {
    step: 7,
    minH: { "Phone 390": 909 },
    title: "Welcome back",
    lede: "Sign in to your grove.",
    body: () => [
      google(), divider(), field("Email"), field("Password", { eye: true }),
      inst("Toggle / Off", { name: "Keep me signed in", w: "fill", texts: { label: "Keep me signed in", description: "For 30 days on this device. Leave off on a shared computer." } }),
      primary("Sign in"), link("Forgot your password?"),
    ],
    footer: ["New here?", "Create an account"],
  },
  "Create account": {
    step: 8,
    minH: { "Phone 390": 916 },
    title: "Create your account",
    lede: "A private community for people going through infertility, and their partners.",
    body: () => [
      google(), divider(), field("Email"), field("Password", { eye: true, hint: "8 to 64 characters. Avoid one you've used elsewhere." }),
      inst("Checkbox / Unchecked", { name: "18 or older", texts: { label: "I am 18 or older" } }),
      inst("Checkbox / Unchecked", { name: "Agree", texts: { label: "I agree to the Terms and Privacy Policy" } }),
      primary("Create account"),
    ],
    footer: ["Already a member?", "Sign in"],
  },
  "Forgot password": {
    step: 2,
    title: "Reset your password",
    lede: "Enter the email you signed up with and we'll send you a link.",
    body: () => [field("Email"), primary("Send reset link"), link("Back to sign in")],
  },
  "Reset password": {
    step: 2,
    title: "Choose a new password",
    body: () => [field("New password", { eye: true, hint: "8 to 64 characters." }), field("Confirm new password", { eye: true }), primary("Save new password")],
  },
  "Confirm email": {
    step: 8,
    title: "Your email is confirmed",
    lede: "Posting, commenting, voting and messaging are now open to you.",
    body: () => [primary("Continue", false)],
  },
  "Beta invite": {
    step: 5,
    title: "You're invited",
    lede: "@grove-beta invited you to the Fertility Grove beta: a private community for people going through infertility, and their partners.",
    body: () => [
      lines(["You post under a handle unless you choose otherwise.", "Your health answers are never sold, and there are no ad trackers.", "You can download or delete everything at any time."]),
      primary("Accept and create account", false),
    ],
    footer: ["Already a member?", "Sign in"],
  },
  "Partner invite": {
    step: 8,
    title: "Annie invited you",
    lede: "Annie would like you to join Fertility Grove as their partner. You'll have your own private account and a community for partners.",
    minH: { "Phone 390": 921 },
    body: () => [
      Col({ name: "Note card", w: "fill", padding: 24, gap: 10, radius: 20, fill: C.white, stroke: C.line }, [
        Row({ name: "seeds", gap: 4 }, [Img("brand/art/tree-seed.webp", 40, 40, { scaleMode: "FIT", name: "seed" }), Img("brand/art/tree-seed.webp", 40, 40, { scaleMode: "FIT", name: "seed" })]),
        T("“I've found people here who get it. I'd love for you to have that too, and for us to keep our appointment questions in one place.”", "body", { width: 300, w: "fill", name: "Note" }),
        T("A note from Annie", "caption", { color: C.muted }),
      ]),
      lines(["Annie never sees your posts, messages or handle.", "You choose what to share in your family space, item by item."]),
      primary("Accept invite", false),
    ],
    footer: ["Already have an account?", "Sign in to accept"],
  },
};

// Lay each screen out as a row of its three sizes; rows stack down the page.
await send("set_current_page", { pageId: page });
let y = 0;
const out = [];
for (const [name, s] of Object.entries(SCREENS)) {
  if (only.length && !only.includes(name)) continue;
  s.name = name;
  let x = 0;
  let rowH = 0;
  for (const size of SIZES) {
    const board = authBoard(s, size);
    board.x = x;
    board.y = y;
    const res = await build([board]);
    out.push(`${name} / ${size.key}: ${res.roots[0].id} ${res.roots[0].width}x${res.roots[0].height}`);
    rowH = Math.max(rowH, res.roots[0].height);
    x += size.w + 120;
  }
  y += rowH + 200;
}
console.log(out.join("\n"));
