// Step 3: the component library, built into the Components board.
// Usage: FG_CHANNEL=<id> node components.mjs <boardId> [section...]
import { C, T, F, Row, Col, Img, icon, build } from "./lib.mjs";

const [board, ...only] = process.argv.slice(2);
const want = (s) => only.length === 0 || only.includes(s);

const section = (title, note, kids) =>
  Col({ name: title, w: "fill", gap: 28 }, [T(title, "section", { size: 40, textStyle: undefined, free: true }), note && T(note, "body", { color: C.inkSoft, width: 880 }), ...kids]);
const group = (label, kids, gap = 20) => Col({ name: label, gap: 12 }, [T(label, "h4"), Row({ name: "row", gap, align: "start", wrap: false }, kids)]);
const comp = (name, props, kids) => F({ type: "component", name, ...props }, kids);

// ---------------------------------------------------------------- Form controls
const field = (state) => {
  const error = state === "Error";
  const focus = state === "Focused";
  return comp(`Field / Text / ${state}`, { layout: "column", gap: 8, width: 360, w: "fixed", h: "hug" }, [
    T("Email", "small", { style: "SemiBold", name: "label", color: C.ink }),
    Row(
      {
        name: "input",
        width: 360,
        height: 48,
        w: "fill",
        h: "fixed",
        padding: [0, 14],
        fill: C.white,
        stroke: error ? C.danger : focus ? C.accent : C.lineStrong,
        radius: 10,
        shadow: focus ? { x: 0, y: 0, blur: 0, spread: 3, color: C.line } : undefined,
      },
      [T(state === "Default" ? "you@example.com" : "annie.m@grove", "body", { name: "value", color: state === "Default" ? C.mutedGrey : C.ink })],
    ),
    error
      ? T("Enter an email like name@example.com.", "small", { name: "error", color: C.danger })
      : T("We'll send a link to confirm it's you.", "small", { name: "hint", color: C.muted }),
  ]);
};

const search = comp("Search / Pill", { layout: "row", gap: 8, align: "center", width: 300, height: 40, w: "fixed", h: "fixed", padding: [0, 14], fill: C.raised, radius: 999 }, [
  icon("search", 16, C.muted),
  T("Find people by @handle", "small", { name: "placeholder", color: C.muted }),
]);

const toggle = (on) =>
  comp(`Toggle / ${on ? "On" : "Off"}`, { layout: "row", gap: 24, align: "start", width: 420, w: "fixed", h: "hug" }, [
    Col({ name: "text", gap: 2, w: "fill" }, [
      T("Suggest me to members on my path", "body", { style: "SemiBold", name: "label" }),
      T("Turned off, you won't appear in People on your path.", "small", { name: "description", color: C.muted, width: 320 }),
    ]),
    F({ name: "switch", width: 48, height: 28, fill: on ? C.accent : C.greyTrack, radius: 999 }, [
      F({ name: "knob", width: 22, height: 22, x: on ? 23 : 3, y: 3, fill: C.white, radius: 999, shadow: { x: 0, y: 1, blur: 3, alpha: 0.25 } }),
    ]),
  ]);

const checkbox = (on) =>
  comp(`Checkbox / ${on ? "Checked" : "Unchecked"}`, { layout: "row", gap: 10, align: "center", w: "hug", h: "hug" }, [
    F({ name: "box", width: 20, height: 20, radius: 5, fill: on ? C.accent : C.white, stroke: on ? C.accent : "#5C5C5C", strokeWeight: 2, layout: "row", justify: "center", align: "center" }, [on && icon("check", 14, C.white, 3)]),
    T("I am 18 or older", "body", { name: "label" }),
  ]);

const choice = (on) =>
  comp(`Choice / ${on ? "Selected" : "Default"}`, { layout: "row", gap: 12, align: "center", width: 320, height: 52, w: "fixed", h: "fixed", padding: [0, 16], radius: 14, fill: on ? C.raised : C.white, stroke: on ? C.accent : C.lineStrong, strokeWeight: on ? 2 : 1 }, [
    F({ name: "radio", width: 20, height: 20, radius: 999, fill: C.white, stroke: on ? C.accent : "#5C5C5C", strokeWeight: 2, layout: "row", justify: "center", align: "center" }, [on && F({ name: "dot", width: 10, height: 10, radius: 999, fill: C.accent })]),
    T("Show my handle instead", "body", { name: "label" }),
  ]);

// ---------------------------------------------------------------- Chips, badges, tabs
const typeChip = (label, bg, ink, ring) =>
  comp(`Chip / Post type / ${label}`, { layout: "row", align: "center", height: 24, h: "fixed", w: "hug", padding: [0, 10], radius: 999, fill: bg, stroke: ring }, [T(label, "chip", { name: "label", color: ink })]);
const groupLabel = (label, bg, ink, ring) =>
  comp(`Chip / Group type / ${label}`, { layout: "row", align: "center", height: 24, h: "fixed", w: "hug", padding: [0, 10], radius: 999, fill: bg, stroke: ring }, [T(label, "chip", { name: "label", color: ink })]);
const tag = comp("Chip / Tag", { layout: "row", align: "center", height: 24, h: "fixed", w: "hug", padding: [0, 10], radius: 999, fill: C.raised }, [T("IVF", "chip", { name: "label", color: C.inkSoft })]);
const filterChip = (on) =>
  comp(`Chip / Filter / ${on ? "On" : "Off"}`, { layout: "row", align: "center", height: 36, h: "fixed", w: "hug", padding: [0, 14], radius: 999, fill: on ? C.accent : C.white, stroke: on ? undefined : C.lineStrong }, [
    T(on ? "Newest" : "Top this week", "small", { style: "SemiBold", name: "label", color: on ? C.white : C.ink }),
  ]);
const badge = comp("Badge / Count", { layout: "row", justify: "center", align: "center", width: 20, height: 20, w: "hug", h: "fixed", padding: [0, 6], radius: 999, fill: C.orange }, [T("2", "chip", { name: "count", color: C.ink, style: "Bold" })]);
const tabs = comp("Tabs", { layout: "row", gap: 24, w: "hug", h: "hug", stroke: undefined }, [
  Col({ name: "tab on", gap: 0 }, [F({ name: "pad", layout: "row", align: "center", height: 44, h: "fixed", w: "hug" }, [T("For you", "body", { style: "SemiBold", name: "label" })]), F({ name: "indicator", width: 64, height: 2, w: "fill", fill: C.ink })]),
  Col({ name: "tab", gap: 0 }, [F({ name: "pad", layout: "row", align: "center", height: 44, h: "fixed", w: "hug" }, [T("Following", "body", { style: "SemiBold", name: "label", color: C.muted })]), F({ name: "indicator", width: 64, height: 2, w: "fill" })]),
]);

// ---------------------------------------------------------------- Avatars
const AVATARS = ["orange", "olive", "fern", "swallow", "mountain", "wave", "pinecone", "moon", "oak", "owl", "fox", "sunflower"];
const TINTS = ["#E0F6EB", "#FFE7DE", "#FFFBE8", "#DFF3FF", "#FFE8F3", "#F1E7F1"];
// The painted gouache set (components/ui/identity.tsx), each drawn at its own zoom
// inside a 9% inset, as the app does.
const ZOOM = { orange: 0.86, olive: 0.93, fern: 1.12, swallow: 1.11, mountain: 1.03, wave: 0.88, pinecone: 0.9, moon: 0.96, oak: 0.97, owl: 0.99, fox: 1.04, sunflower: 1 };
const avatarArt = (key, size) => {
  const s = Math.round(size * 0.82 * (ZOOM[key] || 1));
  const o = Math.round((size - s) / 2);
  return Img(`brand/grove-avatars-gouache/${key}.webp`, s, s, { name: "art", x: o, y: o, scaleMode: "FIT" });
};
const avatar = (key, i, size = 48) =>
  comp(`Avatar / Grove / ${key}`, { width: size, height: size, radius: 999, fill: TINTS[i % TINTS.length], clip: true }, [avatarArt(key, size)]);
const initial = (size) =>
  comp(`Avatar / Initial / ${size}`, { width: size, height: size, radius: 999, fill: C.tintPink, layout: "row", justify: "center", align: "center" }, [T("A", "body", { name: "letter", size: Math.round(size * 0.4), style: "Bold", color: C.coralInk, free: true })]);

// ---------------------------------------------------------------- Navigation
const LOGO_RATIO = 1295 / 473;
const logo = (h) => Img("brand/logo.png", Math.round(h * LOGO_RATIO), h, { name: "logo", scaleMode: "FIT" });
const mark = (s) => Img("brand/orange.png", s, Math.round(s * (322 / 297)), { name: "mark", scaleMode: "FIT" });

const NAV = [
  ["newspaper", "Feed"], ["layout-dashboard", "Dashboard"], ["users", "Groups"], ["flower-2", "Success stories"], ["book-open", "Learn"],
  ["sprout", "Mentors"], ["message-circle", "Messages", "2"], ["bell", "Notifications", "3"],
];
const YOURS = [["bookmark", "Saved"], ["users-round", "Family space"], ["settings", "Settings"], ["circle-help", "Help"]];

const navRow = (ic, label, state = "Default", count) =>
  Row({ name: `row ${label}`, width: 224, height: 36, w: "fill", h: "fixed", gap: 10, padding: [0, 10], radius: 10,
    fill: state === "Active" ? C.white : state === "Hover" ? C.line : null, stroke: state === "Active" ? C.line : undefined }, [
    icon(ic, 17, state === "Default" ? C.inkSoft : C.ink, 1.7),
    T(label, "small", { name: "label", color: state === "Default" ? C.inkSoft : C.ink, style: state === "Active" ? "SemiBold" : "Regular", grow: true, w: "fill" }),
    count && F({ name: "badge", layout: "row", justify: "center", align: "center", width: 20, height: 20, w: "hug", h: "fixed", padding: [0, 6], radius: 999, fill: C.orange }, [T(count, "chip", { color: C.ink, style: "Bold", name: "count" })]),
  ]);
const navRowComp = (state) => comp(`Sidebar / Row / ${state}`, { layout: "column", width: 224, w: "fixed", h: "hug" }, [navRow("users", "Groups", state)]);

const sidebar = comp("Sidebar / Desktop", { layout: "column", width: 248, height: 900, w: "fixed", h: "fixed", padding: [20, 12, 16, 12], gap: 0, fill: C.surface, stroke: C.line }, [
  Col({ name: "brand", padding: [0, 8], gap: 8 }, [logo(46), T("Women's Community", "caption", { color: C.muted, name: "scope" })]),
  F({ name: "space", width: 10, height: 20 }),
  Row({ name: "search", width: 224, height: 40, w: "fill", h: "fixed", gap: 8, padding: [0, 14], fill: C.raised, radius: 999 }, [icon("search", 16, C.muted), T("Find people by @handle", "small", { color: C.muted, name: "placeholder" })]),
  F({ name: "space", width: 10, height: 16 }),
  Col({ name: "main nav", gap: 2, w: "fill" }, NAV.map(([i, l, n], k) => navRow(i, l, k === 0 ? "Active" : "Default", n))),
  F({ name: "space", width: 10, height: 24 }),
  T("Yours", "caption", { color: C.muted, name: "Yours" }),
  F({ name: "space", width: 10, height: 6 }),
  Col({ name: "yours nav", gap: 2, w: "fill" }, YOURS.map(([i, l]) => navRow(i, l))),
  F({ name: "spacer", width: 10, height: 10, grow: true }),
  Row({ name: "account", w: "fill", gap: 12, padding: 8, radius: 14 }, [
    F({ name: "avatar", width: 36, height: 36, radius: 999, fill: C.tintPink, layout: "row", justify: "center", align: "center" }, [T("A", "body", { style: "Bold", color: C.coralInk, free: true })]),
    Col({ name: "who", gap: 0, grow: true, w: "fill" }, [T("@annie_grows", "small", { style: "SemiBold" }), T("Tree · 271 Sunlight", "caption", { color: C.muted })]),
    icon("chevrons-up-down", 16, C.muted),
  ]),
]);

const rail = comp("Sidebar / Icon rail (iPad landscape)", { layout: "column", width: 76, height: 900, w: "fixed", h: "fixed", padding: [20, 8, 16, 8], gap: 4, align: "center", fill: C.surface, stroke: C.line }, [
  mark(36),
  F({ name: "space", width: 10, height: 16 }),
  F({ name: "search", width: 44, height: 44, radius: 999, fill: C.raised, layout: "row", justify: "center", align: "center" }, [icon("search", 19, C.muted)]),
  F({ name: "space", width: 10, height: 12 }),
  ...NAV.map(([i, l, n], k) =>
    F({ name: `rail ${l}`, width: 56, height: 44, radius: 10, fill: k === 0 ? C.white : null, stroke: k === 0 ? C.line : undefined, layout: "row", justify: "center", align: "center" }, [
      icon(i, 19, k === 0 ? C.ink : C.inkSoft, 1.7),
      n && F({ name: "badge", absolute: true, x: 36, y: 2, width: 16, height: 16, radius: 999, fill: C.orange, layout: "row", justify: "center", align: "center" }, [T(n, "chip", { size: 10, color: C.ink, style: "Bold" })]),
    ])),
]);

const topBar = comp("Phone / Top bar", { layout: "row", width: 390, height: 52, w: "fixed", h: "fixed", padding: [0, 8, 0, 16], justify: "between", fill: "#FFFFFFCC", stroke: C.line }, [
  logo(34),
  Row({ name: "actions", gap: 0 }, [
    F({ name: "bell", width: 44, height: 44, layout: "row", justify: "center", align: "center" }, [icon("bell", 21, C.ink, 1.8), F({ name: "dot", absolute: true, x: 26, y: 10, width: 10, height: 10, radius: 999, fill: C.orange, stroke: C.white, strokeWeight: 2 })]),
    F({ name: "menu", width: 44, height: 44, layout: "row", justify: "center", align: "center" }, [icon("menu", 22, C.ink, 1.8)]),
  ]),
]);

const TABS = [["newspaper", "Feed"], ["users", "Groups"], ["message-circle", "Messages", "2"], ["layout-dashboard", "Dashboard"]];
const tabBar = comp("Phone / Tab bar", { layout: "row", width: 390, height: 94, w: "fixed", h: "fixed", padding: [0, 0, 34, 0], fill: "#FFFFFFCC", stroke: C.line }, TABS.map(([i, l, n], k) =>
  F({ name: `tab ${l}`, width: 97, height: 60, grow: true, layout: "column", justify: "center", align: "center", gap: 2 }, [
    F({ name: "pill", width: 56, height: 32, radius: 999, fill: k === 0 ? C.raised : null, layout: "row", justify: "center", align: "center" }, [icon(i, 21, k === 0 ? C.ink : C.muted, k === 0 ? 2.2 : 1.7)]),
    T(l, "caption", { size: 12, style: k === 0 ? "Bold" : "Medium", color: k === 0 ? C.ink : C.muted, name: "label" }),
    n && F({ name: "badge", absolute: true, x: 56, y: 6, width: 18, height: 18, radius: 999, fill: C.orange, layout: "row", justify: "center", align: "center" }, [T(n, "chip", { color: C.ink, style: "Bold" })]),
  ])));

/* The Guide's mark, as GuideMark in AppShell draws it: the brand's orange
   (31px, at 5,3 in a 40px box), a white sparkle top left for its shine and a
   small orange one bottom right. */
const guideMark = () => F({ name: "Guide mark", width: 40, height: 40 }, [
  Img("brand/orange.png", 31, Math.round(31 * (322 / 297)), { name: "orange", x: 5, y: 3, scaleMode: "FIT" }),
  {
    type: "svg", name: "sparkles", width: 40, height: 40, x: 0, y: 0,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path fill="#FFFFFF" d="M9 7c.8 4.6 2.2 6 7 7-4.8 1-6.2 2.4-7 7-.8-4.6-2.2-6-7-7 4.8-1 6.2-2.4 7-7Z"/><path fill="#F89414" d="M35 30c.4 2.1.9 2.6 3 3-2.1.4-2.6.9-3 3-.4-2.1-.9-2.6-3-3 2.1-.4 2.6-.9 3-3Z"/></svg>`,
  },
]);
const FAB_SHADOW = { x: 0, y: 12, blur: 28, spread: -10, alpha: 0.5 };
// p-2 round the mark; the label has 4px before it and 12px after, the AI tag 8px from the words.
const guideFab = comp("Grove Guide / Desktop", { layout: "row", align: "center", height: 56, h: "fixed", w: "hug", padding: [8, 8, 8, 8], gap: 0, radius: 999, fill: C.accent, shadow: FAB_SHADOW }, [
  guideMark(),
  Row({ name: "label", gap: 8, padding: [0, 12, 0, 4] }, [
    T("Grove Guide", "body", { size: 15, style: "SemiBold", color: C.white, name: "text" }),
    Row({ name: "AI tag", height: 18, h: "fixed", padding: [0, 6], radius: 999, fill: "#FFFFFF1A" }, [T("AI", "chip", { size: 12, color: C.orange, style: "Bold", letterSpacing: 2.5 })]),
  ]),
]);
// Phones show the mark alone; the label also folds away like this while reading.
const guideFabPhone = comp("Grove Guide / Phone", { width: 56, height: 56, radius: 999, fill: C.accent, layout: "row", justify: "center", align: "center", shadow: FAB_SHADOW }, [guideMark()]);

// ---------------------------------------------------------------- Cards
const avatarImg = (key, size, tint) => F({ name: "avatar", width: size, height: size, radius: 999, fill: tint, clip: true }, [avatarArt(key, size)]);
const pill = (ic, text) => Row({ name: `pill ${text || ic}`, height: 36, h: "fixed", gap: 6, padding: [0, 12], radius: 999, fill: C.raised }, [icon(ic, 17, C.inkSoft), text && T(text, "small", { style: "SemiBold", name: "value" })]);

const postCard = comp("Card / Post", { layout: "column", width: 640, w: "fixed", h: "hug", padding: 24, gap: 14, radius: 20, fill: C.white, stroke: C.line }, [
  Row({ name: "header", w: "fill", gap: 12, align: "start" }, [
    avatarImg("oak", 40, "#DFF3FF"),
    Col({ name: "who", gap: 0, grow: true, w: "fill" }, [
      Row({ name: "name row", gap: 6 }, [T("@hannah_endo", "small", { style: "SemiBold", name: "author" }), T("· 30m", "small", { color: C.muted, name: "time" })]),
      T("Endometriosis", "caption", { color: C.muted, name: "group" }),
    ]),
    icon("ellipsis", 20, C.muted),
  ]),
  Row({ name: "chips", gap: 8 }, [F({ name: "type", layout: "row", align: "center", height: 24, h: "fixed", w: "hug", padding: [0, 10], radius: 999, fill: C.tintPink, stroke: C.pink }, [T("Support needed", "chip", { color: C.inkSoft, name: "type" })])]),
  T("Flare on transfer day", "h3", { name: "title" }),
  T("Of course it's today. Pain meds approved by my clinic, heating pad on, trying to stay calm. Just need some people who get it.", "body", { color: C.inkSoft, width: 592, name: "body" }),
  Row({ name: "footer", w: "fill", gap: 8 }, [pill("arrow-big-up", "18"), pill("message-square", "2"), pill("bookmark"), F({ name: "spacer", width: 10, height: 10, grow: true }), T("● Personal experience", "caption", { color: C.muted, name: "source" })]),
]);

const groupRow = comp("Row / Group", { layout: "row", width: 720, w: "fixed", h: "hug", gap: 16, padding: [16, 0], align: "center" }, [
  F({ name: "cover", width: 56, height: 56, radius: 10, fill: C.white, stroke: C.line, strokeAlign: "INSIDE", clip: true }, [Img("brand/groups/g-endo.webp", 56, 56, { name: "art" })]),
  Col({ name: "text", gap: 2, grow: true, w: "fill" }, [
    Row({ name: "title row", gap: 8 }, [T("Endometriosis", "h4", { name: "name" }), F({ name: "type", layout: "row", align: "center", height: 24, h: "fixed", w: "hug", padding: [0, 10], radius: 999, fill: C.tintPink, stroke: C.coral }, [T("Diagnosis", "chip", { color: C.coralInk })])]),
    T("Matched on endometriosis", "caption", { style: "SemiBold", color: C.greenInk, name: "why" }),
    T("Surgery, pain, flares, and trying to conceive with endo.", "small", { color: C.inkSoft, name: "description" }),
    T("1,284 members · 46 posts this week", "caption", { color: C.muted, name: "meta" }),
  ]),
  Row({ name: "join", height: 36, h: "fixed", padding: [0, 14], radius: 999, fill: C.raised, gap: 6 }, [icon("check", 15, C.ink, 2), T("Joined", "small", { style: "SemiBold", name: "label" })]),
]);

const settingsRow = (active) => comp(`Row / Settings / ${active ? "Selected" : "Default"}`, { layout: "row", width: 300, height: 56, w: "fixed", h: "fixed", gap: 12, padding: [0, 12], radius: 14, fill: active ? C.white : null, stroke: active ? C.lineStrong : undefined }, [
  F({ name: "icon tile", width: 36, height: 36, radius: 10, fill: active ? C.accent : C.raised, layout: "row", justify: "center", align: "center" }, [icon("lock", 18, active ? C.white : C.inkSoft, 1.8)]),
  Col({ name: "text", gap: 0, grow: true, w: "fill" }, [T("Privacy and messaging", "body", { style: "SemiBold", name: "label" }), T("Messages from people you follow", "caption", { color: C.muted, name: "status" })]),
  icon("chevron-right", 18, active ? C.ink : C.muted),
]);

const articleCard = comp("Card / Article", { layout: "column", width: 380, w: "fixed", h: "hug", radius: 20, fill: C.white, stroke: C.line, clip: true }, [
  Img("brand/learn/endometriosis-topic.webp", 380, 214, { name: "cover", w: "fill" }),
  Col({ name: "body", w: "fill", padding: 20, gap: 4 }, [
    T("Matched on endometriosis", "caption", { style: "SemiBold", color: C.greenInk, name: "why" }),
    T("Endometriosis and fertility", "h4", { size: 17, name: "title" }),
    T("What endometriosis is, how it can affect getting pregnant, and the treatment paths people usually talk through with their doctor.", "small", { color: C.inkSoft, width: 340, name: "summary" }),
    F({ name: "space", width: 10, height: 8 }),
    T("6 min read · Reviewed September 12, 2026", "caption", { color: C.muted, name: "meta" }),
  ]),
]);

// ---------------------------------------------------------------- Overlays
const menuItem = (ic, label, danger) => Row({ name: `item ${label}`, width: 208, height: 40, w: "fill", h: "fixed", gap: 10, padding: [0, 12], radius: 8 }, [icon(ic, 16, danger ? C.danger : C.ink), T(label, "small", { style: "Medium", color: danger ? C.danger : C.ink, name: "label" })]);
const menu = comp("Menu / Account", { layout: "column", width: 224, w: "fixed", h: "hug", padding: 6, radius: 14, fill: C.white, stroke: C.line, shadow: { x: 0, y: 12, blur: 32, spread: -8, alpha: 0.28 } }, [
  menuItem("layout-dashboard", "Dashboard"), menuItem("settings", "Settings"), menuItem("circle-help", "Help"),
  F({ name: "divider", width: 212, height: 1, w: "fill", fill: C.line }),
  menuItem("log-out", "Sign out", true),
]);
const dialog = (name, title, body, primary, primaryFill) => comp(name, { layout: "column", width: 520, w: "fixed", h: "hug", padding: 28, gap: 8, radius: 20, fill: C.white, shadow: { x: 0, y: 24, blur: 60, spread: -12, alpha: 0.35 } }, [
  T(title, "pageTitlePhone", { name: "title" }),
  T(body, "body", { color: C.inkSoft, width: 464, name: "body" }),
  F({ name: "space", width: 10, height: 16 }),
  Row({ name: "actions", gap: 8 }, primary.map(([label, kind]) =>
    Row({ name: `button ${label}`, height: 44, h: "fixed", padding: [0, 20], radius: 999, fill: kind === "primary" ? (primaryFill || C.accent) : kind === "secondary" ? C.white : null, stroke: kind === "secondary" ? C.lineStrong : undefined }, [T(label, "body", { style: "SemiBold", color: kind === "primary" ? C.white : C.ink, name: "label" })]))),
]);

// Guest browsing (PRD v1.2 §10): what a guest sees when they try to take part.
const signUpPrompt = comp("Dialog / Sign-up prompt (guests)", { layout: "column", width: 520, w: "fixed", h: "hug", padding: 28, gap: 8, radius: 20, fill: C.white, shadow: { x: 0, y: 24, blur: 60, spread: -12, alpha: 0.35 } }, [
  T("Join Fertility Grove to take part", "pageTitlePhone", { name: "title" }),
  T("Fertility Grove is invite-only during the beta. Ask a member for an invite link, or leave your email and we'll tell you when it opens.", "body", { color: C.inkSoft, width: 464, name: "body" }),
  F({ name: "space", width: 10, height: 12 }),
  Col({ name: "email", gap: 8, w: "fill" }, [
    T("Your email", "small", { style: "SemiBold", name: "label" }),
    F({ name: "input", width: 464, height: 48, w: "fill", radius: 10, fill: C.white, stroke: C.lineStrong }),
  ]),
  F({ name: "space", width: 10, height: 8 }),
  Row({ name: "button Let me know", height: 44, h: "fixed", padding: [0, 20], radius: 999, fill: C.accent }, [T("Let me know", "body", { style: "SemiBold", color: C.white, name: "label" })]),
  F({ name: "space", width: 10, height: 12 }),
  Row({ name: "sign in", gap: 4 }, [T("Already a member?", "small", { color: C.muted }), T("Sign in", "small", { style: "SemiBold", name: "link" })]),
]);

// Write a post / Edit post: Show to visitors is on, so sharing is held on.
const switchOn = (locked) => F({ name: locked ? "switch (locked on)" : "switch", width: 48, height: 28, fill: locked ? "#22222280" : C.accent, radius: 999 }, [
  F({ name: "knob", width: 20, height: 20, x: 24, y: 4, fill: C.white, radius: 999 }),
]);
const visRow = (label, desc, locked) => Row({ name: label, gap: 24, align: "start", w: "fill" }, [
  Col({ name: "text", gap: 2, w: "fill", grow: true }, [
    T(label, "body", { style: "SemiBold", color: locked ? C.muted : C.ink, name: "label" }),
    T(desc, "small", { color: C.muted, width: 420, name: "description" }),
  ]),
  switchOn(locked),
]);
const postVisibility = comp("Post visibility / Show to visitors on", { layout: "column", gap: 24, width: 520, w: "fixed", h: "hug" }, [
  visRow("Allow sharing outside Fertility Grove", "Stays on while Show to visitors is on. Comments are never shown outside.", true),
  Col({ name: "visitors", gap: 12, w: "fill" }, [
    visRow("Show to visitors", "Anyone can find and read this post, including people without an account, and search engines can list it. Comments stay private. If you turn this off later, search engines may keep a copy for a while.", false),
    Row({ name: "warning (Support needed, Just venting)", w: "fill", padding: [12, 16], radius: 10, fill: C.tintYellow }, [T("This will be readable by anyone on the internet.", "small", { color: C.yellowInk, name: "text" })]),
  ]),
]);

// Dashboard Posts and Replies tabs: a post a moderator removed, seen by its author only.
const removedPost = comp("Card / Post removed by a moderator", { layout: "column", width: 640, w: "fixed", h: "hug", padding: 24, gap: 8, radius: 20, fill: C.white, stroke: C.line }, [
  T("In IVF · 2d ago", "small", { color: C.muted, name: "meta" }),
  Row({ name: "type", height: 24, h: "fixed", padding: [0, 10], radius: 999, fill: C.tintYellow }, [T("Seeking input", "chip", { color: C.yellowInk, style: "SemiBold" })]),
  T("Clinic abroad offering IVF packages at half the price", "body", { size: 18, style: "SemiBold", name: "title" }),
  T("A clinic messaged me on Instagram with a package deal and a discount code if I book this week. Has anyone used them?", "body", { color: C.inkSoft, width: 592, name: "excerpt" }),
  F({ name: "space", width: 10, height: 8 }),
  F({ name: "divider", width: 592, height: 1, w: "fill", fill: C.line }),
  Row({ name: "removed", w: "fill", gap: 12, padding: [8, 0, 0, 0] }, [
    T("Removed by a moderator · Only you can see this", "small", { style: "SemiBold", color: C.coralInk, name: "label", grow: true, w: "fill" }),
    Row({ name: "button Appeal", height: 36, h: "fixed", padding: [0, 16], radius: 999, fill: C.white, stroke: C.lineStrong }, [T("Appeal", "small", { style: "SemiBold", name: "label" })]),
    Row({ name: "button Delete", height: 36, h: "fixed", padding: [0, 16], radius: 999 }, [T("Delete", "small", { style: "SemiBold", name: "label" })]),
  ]),
]);

const toast = comp("Toast", { layout: "row", align: "center", height: 48, h: "fixed", w: "hug", padding: [0, 20], radius: 999, fill: C.accent, shadow: { x: 0, y: 12, blur: 28, spread: -10, alpha: 0.5 } }, [T("Avatar saved. Change it any time on your profile.", "small", { style: "SemiBold", color: C.white, name: "message" })]);

const sections = {
  forms: () =>
    section("Form controls", "Labels sit above fields; hints and errors sit below and are tied to the field. Inputs are 48px with a 10px radius; focus is a near-black border with a soft ring. Switches and checkboxes get a 44px tap area.", [
      group("Text field", [field("Default"), field("Focused"), field("Error")]),
      group("Search", [search]),
      group("Switch", [toggle(true), toggle(false)], 40),
      group("Post visibility (Write a post, Edit post)", [postVisibility]),
      group("Checkbox and choice", [checkbox(true), checkbox(false), choice(true), choice(false)], 24),
    ]),
  chips: () =>
    section("Chips, badges and tabs", "Post-type chips carry their identity tint; text on a tint always reaches 4.5:1. Counts are Brand Orange with ink text, and only mark queues that need action.", [
      group("Post type", [
        typeChip("Question", C.tintBlue, C.blueInk),
        typeChip("Seeking input", C.tintYellow, C.yellowInk),
        typeChip("Support needed", C.tintPink, C.inkSoft, C.pink),
        typeChip("Just venting", C.tintPurple, C.purpleInk),
        typeChip("Just sharing", C.tintGreen, C.greenInk),
      ], 10),
      group("Group type and tag", [groupLabel("Diagnosis", C.tintPink, C.coralInk, C.coral), groupLabel("Stage", C.tintBlue, C.blueInk, C.blue), groupLabel("Topic", C.tintYellow, C.yellowInk, "#FFD339"), tag], 10),
      group("Filter", [filterChip(true), filterChip(false)], 8),
      group("Count and tabs", [badge, tabs], 40),
    ]),
  nav: () =>
    section("Navigation", "Desktop (1280 and up) has the labelled sidebar; iPad landscape (1024 to 1279) the 76px icon rail; phones and iPad portrait a translucent top bar and four-tab bar with a menu sheet. Grove Guide floats bottom right everywhere except the Guide and a conversation.", [
      group("Sidebar row states", [navRowComp("Default"), navRowComp("Hover"), navRowComp("Active")], 24),
      group("Sidebar, icon rail, phone bars", [sidebar, rail, Col({ name: "phone bars", gap: 24 }, [topBar, tabBar])], 40),
      group("Grove Guide (AI)", [guideFab, guideFabPhone], 24),
    ]),
  cards: () =>
    section("Cards and rows", "White cards with a #E6E6E6 hairline and a 20px radius; no shadow at rest. Rows in lists sit on the page and separate with spacing or a hairline.", [
      group("Post", [postCard]),
      group("Group row", [groupRow]),
      group("Settings row and article", [settingsRow(false), settingsRow(true), articleCard], 24),
      group("Removed post (Dashboard, author only)", [removedPost]),
    ]),
  overlays: () =>
    section("Menus, dialogs and toasts", "Menus open from their trigger with the menu shadow; dialogs are centred on desktop and slide up as a sheet on phones; toasts rise from the bottom centre.", [
      group("Menu", [menu]),
      group("Dialogs", [
        dialog("Dialog / Sign out", "Sign out of Fertility Grove?", "You can sign back in any time with your email or Google.", [["Sign out", "primary"], ["Cancel", "ghost"]], C.danger),
        dialog("Dialog / Unsaved changes", "You have unsaved changes", "If you leave now, what you've changed on this page won't be kept.", [["Save and leave", "primary"], ["Leave without saving", "secondary"], ["Keep editing", "ghost"]]),
      ], 32),
      group("Guest sign-up prompt (public pages)", [signUpPrompt]),
      group("Toast", [toast]),
    ]),
  avatars: () =>
    section("Avatars", "Twelve painted grove characters a member can wear instead of a photo, each on their own pale hue. None presumes how a journey ends. Members who haven't picked one show their initial.", [
      group("Grove avatars (48)", AVATARS.map((k, i) => avatar(k, i)), 12),
      group("Initial", [initial(28), initial(40), initial(56)], 16),
    ]),
};

const nodes = Object.entries(sections).filter(([k]) => want(k)).map(([, f]) => f());
const res = await build(nodes, { parentId: board });
console.log(JSON.stringify(res.roots));
