// Step 5d: the eight onboarding screens (app/onboarding/[step]) at Desktop
// 1440, Tablet 768 and Phone 390, filled with Annie's answers (the demo
// member, as `?preview=1` shows them).
// Usage: FG_CHANNEL=fertility-grove node screens-onboarding.mjs <pageId> [step...]
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { C, T, F, Row, Col, Img, icon, build, send } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WASH = join(HERE, "..", "assets", "wash-faded.png");
const [page, ...only] = process.argv.slice(2);

const SIZES = [
  { key: "Desktop 1440", w: 1440, h: 900 },
  { key: "Tablet 768", w: 768, h: 1024 },
  { key: "Phone 390", w: 390, h: 844 },
];
const GREY = "#D6D6D6";
const TINT = { coral: "#FFE7DE", blue: "#DFF3FF", purple: "#F1E7F1", pink: "#FFE8F3", green: "#E0F6EB", yellow: "#FFFBE8" };
const TREE = { Seed: "tree-seed", Bush: "tree-bush", Tree: "tree-tree", "Blossom Tree": "tree-blossom", "Orange Tree": "tree-orange" };
/** Text cut to `lines` lines with an ellipsis, as line-clamp does (Figma's
 *  maxLines doesn't re-wrap after a fill resize). */
const clamp = (text, width, size, lines) => {
  const max = Math.floor((width / (size * 0.5)) * lines) - 1;
  return text.length <= max ? text : text.slice(0, text.lastIndexOf(" ", max)) + "…";
};
const gap = (h) => F({ name: "space", width: 10, height: h });
const levelIcon = (lv, s = 16) => Img(`brand/art/${TREE[lv]}.webp`, s, s, { name: `level ${lv}`, scaleMode: "FIT" });

// ------------------------------------------------------------ controls
function btn(label, { kind = "primary", size = "md", ic, disabled } = {}) {
  const h = size === "sm" ? 36 : 44;
  const fill = { primary: C.accent, secondary: C.white, quiet: C.raised, ghost: undefined }[kind];
  const color = kind === "primary" ? C.white : C.ink;
  return Row({ name: `Button ${label}`, height: h, h: "fixed", padding: [0, size === "sm" ? 14 : 20], gap: 6, radius: 999, fill, stroke: kind === "secondary" ? C.lineStrong : undefined, opacity: disabled ? 0.5 : undefined }, [
    ic && icon(ic, 17, color, 2),
    T(label, "body", { size: size === "sm" ? 14 : 15, style: "SemiBold", color, free: true }),
  ]);
}

const box = (on, multi) =>
  Row({ name: multi ? "checkbox" : "radio", width: 20, height: 20, w: "fixed", h: "fixed", justify: "center", radius: multi ? 5 : 999, fill: on ? C.accent : C.white, stroke: on ? C.accent : GREY, strokeWeight: 2 }, [
    on && (multi ? icon("check", 13, C.white, 3) : { type: "ellipse", width: 8, height: 8, fill: C.white, name: "dot" }),
  ]);

/** Option tiles in a grid (ui Choices). */
function choices(v, { legend, options, value = [], multi, hint, cols = 2 }) {
  const n = v.sm ? (cols === 3 && v.desk ? 3 : Math.min(cols, 2)) : 1;
  const tw = (v.content - (n - 1) * 8) / n;
  const tile = (o) => {
    const on = value.includes(o);
    return Row({ name: o, width: tw, w: "fixed", h: "fill", padding: [14, 14], gap: 12, radius: 10, fill: on ? C.raised : C.white, stroke: on ? C.accent : C.lineStrong, strokeWeight: on ? 2 : 1 }, [
      box(on, multi),
      T(o, "body", { lineHeight: 1.375, width: tw - 62, free: true }),
    ]);
  };
  const rows = [];
  for (let i = 0; i < options.length; i += n) rows.push(Row({ name: "row", gap: 8, align: "start" }, options.slice(i, i + n).map(tile)));
  return Col({ name: legend, w: "fill", gap: 0 }, [
    Row({ name: "legend", gap: 0 }, [T(legend, "small", { style: "SemiBold" }), multi && T(" · choose any", "small", { color: C.muted })]),
    hint && gap(4),
    hint && T(hint, "caption", { color: C.muted }),
    gap(hint ? 12 : 8),
    Col({ name: "options", gap: 8 }, rows),
  ]);
}

const card = (name, kids, pad = 20) => Col({ name, w: "fill", padding: pad, gap: 0, radius: 20, fill: C.white, stroke: C.line }, kids);

function toggle(label, on, description) {
  return Row({ name: label, w: "fill", gap: 16, align: "start", justify: "between" }, [
    Col({ name: "text", w: "fill", grow: true, gap: 2 }, [
      T(label, "body", { style: "SemiBold", width: 200, w: "fill", free: true }),
      description && T(description, "small", { color: C.muted, lineHeight: 1.375, width: 200, w: "fill" }),
    ]),
    Row({ name: on ? "switch on" : "switch off", width: 48, height: 28, w: "fixed", h: "fixed", padding: [0, 4], justify: on ? "end" : "start", radius: 999, fill: on ? C.accent : GREY }, [
      { type: "ellipse", width: 20, height: 20, fill: C.white, name: "knob" },
    ]),
  ]);
}

const label = (text, optional) => Row({ name: "label", gap: 4 }, [T(text, "small", { style: "SemiBold" }), optional && T("(optional)", "small", { color: C.muted })]);
function field(text, { value = "", hint, optional, prefix, select, width, h = 44, counter, placeholder } = {}) {
  return Col({ name: `Field ${text}`, width, w: width ? "fixed" : "fill", gap: 8 }, [
    counter ? Row({ name: "label row", w: "fill", justify: "between" }, [label(text, optional), T(counter, "caption", { color: C.muted })]) : label(text, optional),
    Row({ name: "input", w: "fill", height: h, h: "fixed", align: h > 44 ? "start" : "center", padding: [h > 44 ? 12 : 0, 14], gap: 8, radius: 10, fill: C.white, stroke: C.lineStrong, justify: select ? "between" : "start" }, [
      prefix && T(prefix, "body", { color: C.muted }),
      T(value || placeholder || "", "body", { color: value ? C.ink : C.muted, width: 200, w: "fill", grow: true, lineHeight: 1.6 }),
      select && icon("chevron-down", 16, C.muted, 2),
    ]),
    hint && T(hint, "caption", { color: C.muted, width: 200, w: "fill" }),
  ]);
}
const twoUp = (v, a, b) => (v.sm ? Row({ name: "pair", w: "fill", gap: 20, align: "start" }, [a, b]) : Col({ name: "pair", w: "fill", gap: 20 }, [a, b]));

const avatar = (key, size, tint, ring) =>
  F({ name: `avatar ${key}`, width: size, height: size, radius: 999, fill: tint, clip: true, stroke: ring, strokeWeight: ring ? 2 : undefined }, [
    Img(`brand/grove-avatars/${key}.webp`, Math.round(size * 0.82), Math.round(size * 0.82), { name: "art", x: Math.round(size * 0.09), y: Math.round(size * 0.09), scaleMode: "FIT" }),
  ]);
const initial = (letter, size, tint, ink) => Row({ name: "avatar initial", width: size, height: size, w: "fixed", h: "fixed", justify: "center", radius: 999, fill: tint }, [T(letter, "h3", { size: Math.round(size * 0.4), color: ink, free: true })]);

/** Name line (ui Name): handle or real name, tree level, pronouns, badges. */
const nameLine = (name, lv, pronouns, badge, fill) =>
  Row({ name: "Name", gap: 6, wrap: !!fill, rowGap: 2, w: fill ? "fill" : "hug" }, [
    T(name, "body", { style: "SemiBold", free: true }),
    levelIcon(lv),
    pronouns && T(`· ${pronouns}`, "small", { color: C.muted }),
    badge && Row({ name: "badge", height: 24, h: "fixed", padding: [0, 8], gap: 4, radius: 999, fill: TINT.purple }, [icon("sprout", 13, C.purpleInk, 2), T(badge, "chip", { color: C.purpleInk })]),
  ]);
const person = (av, tint, name, lv, pronouns, sub, action, badge) =>
  Row({ name, w: "fill", gap: 12 }, [
    avatar(av, 40, tint),
    Col({ name: "who", w: "fill", grow: true, gap: 2 }, [nameLine(name, lv, pronouns, badge, true), T(sub, "caption", { color: C.muted })]),
    action,
  ]);

// ------------------------------------------------------------ screens
const SCREENS = [
  {
    key: "1 Journey",
    title: "Where are you in your fertility journey?",
    intro: "A few questions so we can match you with the right people, groups and information. Only you see your answers unless you choose to share them.",
    why: "We use this to match you. Only you see it.",
    body: (v) => [
      choices(v, { legend: "Journey stage", multi: true, value: ["Pursuing treatment"], options: ["Actively trying to conceive", "Waiting on tests or a diagnosis", "Recently diagnosed", "Pursuing treatment", "Pregnant after infertility", "Taking a break", "Moving forward without treatment", "I am a partner / spouse", "Just looking for information and support", "Prefer not to share"] }),
      card("Treatment", [
        choices({ ...v, content: v.content - 40 }, { legend: "Which treatment?", multi: true, value: ["IVF"], hint: "Optional.", options: ["IUI", "IVF", "Egg freezing", "Embryo freezing or transfer", "Medication only", "Other"] }),
        gap(24),
        field("Next treatment or cycle date", { optional: true, placeholder: "mm/dd/yyyy", hint: "Only you see this.", width: Math.min(240, v.content - 40) }),
      ]),
      card("Consent", [
        toggle("I agree that Fertility Grove uses my answers about my health to match me with people, groups and information.", true, "Read our Consumer Health Data Privacy Policy. You can withdraw this any time in Settings."),
      ]),
    ],
  },
  {
    key: "2 Diagnosis",
    title: "Has a doctor named anything specific?",
    why: "This helps us find people with the same diagnosis. It stays private unless you choose to show it.",
    skip: true,
    body: (v) => [
      choices(v, { legend: "Diagnosis", multi: true, value: ["Endometriosis"], hint: "Optional. Pick everything a doctor has named.", options: ["PCOS", "Endometriosis", "Premature ovarian insufficiency", "Thyroid disorder", "Male factor infertility", "Uterine fibroids or polyps", "Diminished ovarian reserve", "Recurrent pregnancy loss", "Autoimmune disorder", "Hormonal imbalance", "Tubal factor", "Unexplained", "Not diagnosed yet", "Other"] }),
      choices(v, { legend: "Path to parenthood", multi: true, value: ["Own eggs and sperm"], hint: "Optional.", options: ["Own eggs and sperm", "Donor eggs", "Donor sperm", "Donor embryos", "Surrogacy or gestational carrier", "Not sure yet"] }),
    ],
  },
  {
    key: "3 About you",
    title: "A little about you",
    why: "Your gender, age range and ZIP code are never shown to anyone. Pronouns show only if you add them.",
    body: (v) => [
      choices(v, { legend: "Gender identity", value: ["Female"], hint: "Private. Never shown on your profile.", options: ["Female", "Male", "Non-binary", "Transgender female", "Transgender male", "Genderqueer or gender fluid", "Agender", "Two-spirit", "Intersex", "Prefer to self-describe", "Prefer not to say"] }),
      choices(v, { legend: "Pronouns", value: ["she/her"], cols: 3, hint: "Optional. Shown next to your name if you add them.", options: ["she/her", "he/him", "they/them", "she/they", "he/they", "Prefer to self-describe", "Prefer not to say"] }),
      twoUp(v, field("Age range", { optional: true, value: "30 to 34", select: true, hint: "Never shown." }), field("ZIP code", { value: "94549", hint: "Never shown. Helps us match you with people in your region." })),
    ],
  },
  {
    key: "4 Looking for",
    title: "What are you looking for?",
    why: "This shapes what we suggest first. You can change it any time.",
    body: (v) => [
      choices(v, { legend: "I'm looking for", multi: true, value: ["People in my exact situation", "A mentor who has been through it", "Help preparing for doctor visits"], options: ["People in my exact situation", "A mentor who has been through it", "Trusted information about my diagnosis", "Help preparing for doctor visits", "Support as a partner, or for my partner", "Hope from success stories", "A safe place to vent", "Just exploring for now"] }),
      choices(v, { legend: "How I like to connect", value: ["A mix of everything"], hint: "Optional.", options: ["Reading and learning first", "Talking in groups", "One-to-one conversations", "A mix of everything"] }),
    ],
  },
  {
    key: "5 Community",
    title: "Your community",
    why: "Content and tools are the same in both communities; only the space differs. You can switch later.",
    gapBody: 16,
    body: (v) => {
      const opt = (name, blurb, on, suggested) =>
        Row({ name, w: "fill", padding: 20, gap: 16, align: "start", radius: 20, fill: C.white, stroke: on ? C.accent : undefined, strokeWeight: on ? 2 : undefined }, [
          Col({ name: "radio wrap", padding: [4, 0, 0, 0] }, [box(on, false)]),
          Col({ name: "text", w: "fill", grow: true, gap: 4 }, [
            Row({ name: "title", gap: 8, wrap: true, rowGap: 4 }, [
              T(name, "body", { size: 18, style: "SemiBold", free: true }),
              suggested && Row({ name: "Suggested for you", height: 22, h: "fixed", padding: [0, 10], radius: 999, fill: TINT.green }, [T("Suggested for you", "chip", { color: C.greenInk })]),
            ]),
            T(blurb, "body", { color: C.inkSoft, width: 200, w: "fill" }),
          ]),
        ]);
      return [
        T("Suggested because of the gender identity you chose.", "body", { color: C.inkSoft, width: 200, w: "fill" }),
        Col({ name: "Communities", w: "fill", gap: 12 }, [
          opt("Women's Community", "A space for women navigating diagnosis, treatment, and everything around it.", true, true),
          opt("Partners & Men's Community", "For partners, spouses, and men on the fertility journey. A room where somebody finally asks about you.", false),
        ]),
      ];
    },
  },
  {
    key: "6 Profile",
    title: "Your profile",
    why: "This is how other members see you. You post under your handle unless you choose your real name.",
    body: (v) => {
      const display = (title, body, on) =>
        Col({ name: title, w: "fill", grow: true, padding: 16, gap: 2, radius: 14, fill: C.white, stroke: on ? C.accent : undefined, strokeWeight: on ? 2 : undefined }, [T(title, "body", { style: "SemiBold" }), T(body, "small", { color: C.muted })]);
      const AV = ["orange", "olive", "fern", "swallow", "mountain", "wave", "pinecone", "moon", "oak", "owl", "fox", "sunflower"];
      const swatches = [TINT.green, TINT.coral, TINT.yellow, TINT.blue, TINT.pink, TINT.purple];
      const aboutMe = "33, stage III endo, starting IVF this winter. Here for people who get it and for the questions I'm scared to ask out loud.";
      return [
        twoUp(v, field("First name", { value: "Annie" }), field("Last name", { value: "Marsh", hint: "Only your initial is ever shown." })),
        field("Handle", { value: "annie_grows", prefix: "@", hint: "3 to 30 characters: lowercase letters, numbers and underscores, starting with a letter." }),
        Col({ name: "How your name shows", w: "fill", gap: 8 }, [
          T("How your name shows", "small", { style: "SemiBold" }),
          v.sm
            ? Row({ name: "options", w: "fill", gap: 8 }, [display("Show my handle instead", "Members see @annie_grows.", true), display("Show my real name", "Members see Annie M.", false)])
            : Col({ name: "options", w: "fill", gap: 8 }, [display("Show my handle instead", "Members see @annie_grows.", true), display("Show my real name", "Members see Annie M.", false)]),
        ]),
        Col({ name: "Photo or avatar", w: "fill", gap: 8 }, [
          label("Photo or avatar", true),
          Row({ name: "Avatars", width: Math.min(v.content, 6 * 48 + 5 * 14), w: "fixed", wrap: true, gap: 14, rowGap: 14 }, AV.map((a) => avatar(a, 48, TINT.coral))),
          gap(4),
          Row({ name: "Hues", gap: 10 }, swatches.map((s, i) => ({ type: "ellipse", width: 32, height: 32, fill: s, stroke: i === 1 ? C.mutedGrey : C.line, strokeWeight: i === 1 ? 2 : 1, name: `hue ${i}` }))),
          gap(4),
          btn("Upload from my computer", { kind: "secondary", size: "sm", disabled: true }),
          T("An avatar keeps your handle private and still helps people recognise you.", "caption", { color: C.muted, width: 200, w: "fill" }),
        ]),
        field("About me", { optional: true, counter: "122 / 1,000", value: aboutMe, h: 120 }),
        Col({ name: "How others see you", w: "fill", gap: 8 }, [
          T("How others see you", "small", { style: "SemiBold" }),
          card("Preview", [Row({ name: "who", gap: 12 }, [initial("A", 48, TINT.coral, C.coralInk), nameLine("@annie_grows", "Seed", "she/her")]), gap(12), T(aboutMe, "small", { color: C.inkSoft, lineHeight: 1.6, width: 200, w: "fill" })]),
        ]),
      ];
    },
  },
  {
    key: "7 Connections",
    title: "Connections and notifications",
    why: "You can change any of this later. We will never send more than one activity email a day.",
    skip: true,
    gapBody: 16,
    body: (v) => {
      const p = v.sm ? 24 : 20;
      return [
        Col({ name: "Connections", w: "fill", padding: p, gap: 24, radius: 20, fill: C.white, stroke: C.line }, [
          T("Connections", "h4"),
          toggle("Suggest me to members on my path", true, "People with a similar journey may see you in their matches."),
          Col({ name: "Who can message me", w: "fill", gap: 2 }, [
            T("Who can message me", "body", { style: "SemiBold" }),
            T("Others can still send a message request you can accept or delete.", "small", { color: C.muted, width: 200, w: "fill" }),
            gap(6),
            Row({ name: "select", width: Math.min(280, v.content - 2 * p), w: "fixed", height: 44, h: "fixed", padding: [0, 14], justify: "between", radius: 10, fill: C.white, stroke: C.lineStrong }, [T("Members I follow", "body"), icon("chevron-down", 16, C.muted, 2)]),
          ]),
          toggle("I'd like a mentor", true, "We'll suggest members who have been through it."),
          toggle("Show success stories in my feed", false, "Off means stories stay in their own space."),
          toggle("Show my diagnosis, stage and path on my profile", false, "Off by default. Matching still works when this is off."),
        ]),
        Col({ name: "Email", w: "fill", padding: p, gap: 24, radius: 20, fill: C.white, stroke: C.line }, [
          T("Email", "h4"),
          toggle("Comments and replies on my posts", true, "In your daily update."),
          toggle("New direct messages", true, "In your daily update."),
          toggle("Include follows, levels and matches in my daily update", false),
        ]),
      ];
    },
  },
  {
    key: "8 All set",
    title: "You're all set, Annie!",
    why: "Everything here was picked for where you are. Each suggestion says why.",
    finish: true,
    gapBody: 16,
    body: (v) => {
      const p = v.sm ? 24 : 20;
      const panel = (name, kids) => Col({ name, w: "fill", padding: p, gap: 12, radius: 20, fill: C.white, stroke: C.line }, [T(name, "h4"), ...kids]);
      const group = (id, name, why) =>
        Row({ name, w: "fill", gap: 12 }, [
          Img(`brand/groups/${id}.webp`, 44, 44, { name: "cover", radius: 10 }),
          Col({ name: "text", w: "fill", grow: true, gap: 0 }, [T(name, "body", { style: "SemiBold" }), T(why, "caption", { color: C.muted, maxLines: 1, width: 200, w: "fill" })]),
          btn("Joined", { kind: "quiet", size: "sm" }),
        ]);
      const textW = v.content - 2 * p - 150;
      const article = (title, sub, saved) =>
        Row({ name: title, w: "fill", gap: 12, align: "start" }, [
          Col({ name: "text", w: "fill", grow: true, gap: 2 }, [T(title, "body", { style: "SemiBold", width: 200, w: "fill" }), T(clamp(sub, textW, 13, 2), "caption", { color: C.muted, lineHeight: 1.375, width: 200, w: "fill" })]),
          Row({ name: "actions", gap: 4 }, [btn("Read", { kind: "ghost", size: "sm" }), btn(saved ? "Saved" : "Save", { kind: saved ? "quiet" : "secondary", size: "sm" })]),
        ]);
      const follow = btn("Follow", { kind: "secondary", size: "sm" });
      return [
        Row({ name: "Seed", w: "fill", padding: 20, gap: 16, radius: 20, fill: C.white, stroke: C.line, clip: true }, [
          levelIcon("Seed", 104),
          Col({ name: "text", w: "fill", grow: true, gap: 4 }, [
            T("You've planted your Seed.", "body", { size: 17, style: "SemiBold", free: true }),
            T("Your tree grows with Sunlight, each time another member finds you helpful: Seed, Bush, Tree, Blossom Tree, Orange Tree.", "small", { color: C.inkSoft, lineHeight: 1.6, width: 200, w: "fill" }),
          ]),
        ]),
        panel("Groups for you", [group("g-ivf", "In IVF", "Matched on pursuing treatment and IVF"), group("g-endo", "Endometriosis", "Matched on endometriosis")]),
        panel("People on your path", [
          person("hedgehog", TINT.blue, "@hannah_endo", "Seed", null, "Similar journey", follow),
          person("bee", TINT.purple, "@sam_supports", "Bush", "he/him", "Matched on pursuing treatment", btn("Follow", { kind: "secondary", size: "sm" })),
          person("butterfly", TINT.pink, "@jules_waits", "Bush", "they/them", "Matched on pursuing treatment", btn("Follow", { kind: "secondary", size: "sm" })),
        ]),
        panel("Mentors who have been there", [
          person("blossom", TINT.coral, "Maya R.", "Blossom Tree", "she/her", "Matched on endometriosis", null, "Mentor"),
          Col({ name: "bio", w: "fill", padding: [0, 0, 0, 52], gap: 8 }, [
            T(clamp("Two laparoscopies and three IVF transfers before my daughter. I can talk through surgery recovery, choosing a clinic, and keeping your job going while you're in treatment.", v.content - 2 * p - 52, 14, 2), "small", { color: C.inkSoft, lineHeight: 1.6, width: 200, w: "fill" }),
            btn("View profile", { kind: "ghost", size: "sm" }),
          ]),
        ]),
        panel("Read first", [
          article("Endometriosis and fertility", "Matched on endometriosis. What endometriosis is, how it can affect getting pregnant, and the treatment paths people usually talk through with their doctor.", true),
          article("PCOS and getting pregnant", "A good place to start. How polycystic ovary syndrome affects ovulation, and the first-line steps doctors usually suggest.", false),
          article("Diminished ovarian reserve", "A good place to start. What a low AMH or antral follicle count means, what it doesn't mean, and the decisions people often face next.", false),
        ]),
        Col({ name: "Ask the Grove Guide", w: "fill", padding: p, gap: 0, radius: 20, fill: C.white, stroke: C.line }, [
          Row({ name: "title", gap: 8 }, [icon("sparkles", 17, C.blueInk, 2), T("Ask the Grove Guide", "h4")]),
          gap(4),
          T("Answers come from our clinician-reviewed library.", "small", { color: C.muted }),
          gap(12),
          Col({ name: "starters", w: "fill", gap: 8 }, ["Should I have surgery for endometriosis before IVF?", "How can endometriosis affect egg quality?", "What questions should I ask about an endometrioma?"].map((q) =>
            Row({ name: q, w: "fill", padding: [12, 16], radius: 14, fill: TINT.blue }, [T(q, "body", { style: "Medium", color: C.blueInk, width: 200, w: "fill" })]))),
        ]),
        Col({ name: "Invite your partner", w: "fill", padding: p, gap: 0, radius: 20, fill: C.white, stroke: C.line }, [
          T("Invite your partner", "h4"),
          gap(4),
          T("They get their own private account. You choose what to share with them.", "small", { color: C.muted, lineHeight: 1.6, width: 200, w: "fill" }),
          gap(12),
          v.sm
            ? Row({ name: "invite", w: "fill", gap: 8, align: "end" }, [field("Partner's email"), btn("Send invite", { kind: "secondary" })])
            : Col({ name: "invite", w: "fill", gap: 8 }, [field("Partner's email"), btn("Send invite", { kind: "secondary" })]),
        ]),
      ];
    },
  },
];

// ------------------------------------------------------------ frame
const panelArt = (w, h, step) =>
  F({ name: "Grove panel", width: w, height: h, radius: 20, fill: C.white, clip: true }, [
    Img(WASH, w, h, { name: "wash", x: 0, y: 0, scaleMode: "FILL" }),
    Img(`brand/art/grow-${step}.webp`, w, w, { name: `tree (step ${step})`, x: 0, y: h - w, scaleMode: "FIT" }),
  ]);

function board(s, n, size) {
  const desk = size.w >= 1024;
  const sm = size.w >= 640;
  const pad = desk ? 56 : sm ? 32 : 16;
  const leftW = desk ? Math.round(size.w / 1.78) : size.w;
  const content = Math.min(600, leftW - pad * 2);
  const v = { desk, sm, content };
  const header = Col({ name: "Header", w: "fill", gap: 0 }, [
    Row({ name: "Bar", w: "fill", height: 56, h: "fixed", justify: "between" }, [
      Img("brand/logo.png", Math.round(38 * (1295 / 473)), 38, { name: "Logo", scaleMode: "FIT" }),
      Row({ name: "Links", gap: 16 }, [T("Help", "small", { style: "SemiBold", color: C.inkSoft }), T("Sign out", "small", { style: "SemiBold", color: C.inkSoft })]),
    ]),
    gap(8),
    Row({ name: `Progress (step ${n} of 8)`, w: "fill", gap: 6 }, Array.from({ length: 8 }, (_, i) => F({ name: `bar ${i + 1}`, width: 10, height: 6, w: "fill", grow: true, radius: 999, fill: i < n ? C.accent : C.line }))),
    gap(8),
    T(`Step ${n} of 8`, "caption", { color: C.muted }),
  ]);
  const actions = Row({ name: "Actions", w: "fill", gap: 8, padding: [16, 0, 16, 0] }, [
    n >= 2 && n <= 7 && btn("Back", { kind: "ghost", ic: "arrow-left" }),
    F({ name: "spacer", width: 10, height: 10, w: "fill", grow: true }),
    s.skip && btn("Skip", { kind: "ghost" }),
    btn(s.finish ? "Finish" : "Next"),
  ]);
  const main = Col({ name: "Main", width: content, w: "fixed", padding: [desk ? 48 : 32, 0, 0, 0], gap: 0 }, [
    T(s.title, "hero", { size: sm ? 44 : 36, lineHeight: 1.08, free: true, width: content, name: "Title" }),
    s.intro && gap(12),
    s.intro && T(s.intro, "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: content }),
    gap(12),
    Row({ name: "Why", w: "fill", gap: 8, align: "start" }, [Col({ name: "lock", padding: [2, 0, 0, 0] }, [icon("lock", 15, C.muted, 2)]), T(s.why, "small", { color: C.muted, lineHeight: 1.375, width: 200, w: "fill" })]),
    gap(32),
    Col({ name: "Form", w: "fill", gap: s.gapBody || 28 }, s.body(v)),
    gap(16),
    actions,
  ]);
  const column = Col({ name: "Column", width: leftW, w: "fixed", padding: [12, pad, desk ? 48 : 16, pad], gap: 0, align: "center" }, [
    header,
    !desk && gap(16),
    !desk && Row({ name: "Scene band", width: size.w, w: "fixed", height: 128, h: "fixed", justify: "center", align: "end", clip: true }, [Img(`brand/art/grow-${n}.webp`, 128, 128, { name: `tree (step ${n})`, scaleMode: "FIT" })]),
    main,
  ]);
  const name = `Onboarding / ${s.key} / ${size.key}`;
  if (desk) {
    const asideW = size.w - leftW;
    return F({ name, width: size.w, layout: "row", align: "start", w: "fixed", h: "hug", fill: C.white, clip: true }, [
      column,
      Col({ name: "Aside", width: asideW, w: "fixed", height: size.h, h: "fixed", padding: 16 }, [panelArt(asideW - 32, size.h - 32, n)]),
    ]);
  }
  return F({ name, width: size.w, layout: "column", w: "fixed", h: "hug", fill: C.white, clip: true }, [column]);
}

// Each screen is a row of its three sizes; rows stack down the page.
await send("set_current_page", { pageId: page });
let y = 0;
const out = [];
for (const [i, s] of SCREENS.entries()) {
  const n = i + 1;
  const res0 = [];
  let x = 0;
  let rowH = 0;
  for (const size of SIZES) {
    const b = board(s, n, size);
    b.x = x;
    b.y = y;
    if (!only.length || only.includes(String(n))) {
      const res = await build([b]);
      const root = res.roots[0];
      if (root.height < size.h) await send("resize_node", { nodeId: root.id, width: size.w, height: size.h });
      const h = Math.max(root.height, size.h);
      res0.push(`${s.key} / ${size.key}: ${root.id} ${size.w}x${h}`);
      rowH = Math.max(rowH, h);
    }
    x += size.w + 120;
  }
  out.push(...res0);
  // Rows sit on a fixed 3400px pitch, so one screen can be rebuilt alone.
  y += 3400;
}
console.log(out.join("\n"));
