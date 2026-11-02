// Step 5b: Public reading pages (Help, Terms, Privacy, Shared post, Demo
// personas) at Desktop 1440, Tablet 768 and Phone 390. The landing page has
// its own script (screens-landing.mjs).
// Usage: FG_CHANNEL=fertility-grove node screens-public.mjs <pageId> <startY> [screen...]
import { C, T, F, Row, Col, Img, icon, build, send } from "./lib.mjs";

const [page, startY = "0", ...only] = process.argv.slice(2);

const SIZES = [
  { key: "Desktop 1440", w: 1440, h: 900 },
  { key: "Tablet 768", w: 768, h: 1024 },
  { key: "Phone 390", w: 390, h: 844 },
];

const TREE = { Seed: "tree-seed", Bush: "tree-bush", Tree: "tree-tree", "Blossom Tree": "tree-blossom", "Orange Tree": "tree-orange" };
const tree = (level, size, props = {}) => Img(`brand/art/${TREE[level]}.webp`, size, size, { name: level, scaleMode: "FIT", ...props });

// Spot art: trees standing on one ground line (art/Scenes.tsx).
const SPOTS = {
  seeds: [["Seed", 10, 44], ["Seed", 46, 44]],
  roots: [["Tree", 6, 52], ["Blossom Tree", 42, 52]],
  lens: [["Bush", 22, 56]],
};
const spot = (kind, size) => {
  const h = Math.round((size * 3) / 4);
  return F({ name: `Spot ${kind}`, width: size, height: h }, SPOTS[kind].map(([lv, x, w]) => {
    const s = Math.round((size * w) / 100);
    return tree(lv, s, { x: Math.round((size * x) / 100), y: h - s });
  }));
};

const pill = (label, { fill = C.accent, color = C.white, ic, stroke } = {}) =>
  Row({ name: `Button ${label}`, height: 44, h: "fixed", padding: [0, 20], gap: 8, radius: 999, fill, stroke }, [ic && icon(ic, 16, color, 2), T(label, "body", { style: "SemiBold", color, name: "label" })]);

const fieldBox = (label, { h = 44, counter } = {}) =>
  Col({ name: `Field ${label}`, w: "fill", gap: 8 }, [
    Row({ name: "label row", w: "fill", justify: "between" }, [T(label, "small", { style: "SemiBold" }), counter && T(counter, "caption", { color: C.muted })]),
    F({ name: "input", width: 100, height: h, w: "fill", radius: 10, fill: C.white, stroke: C.lineStrong }),
  ]);

// Header + centred reading column (AuthFrame ReadingFrame).
function reading(size, { title, lede, nav = ["Help", "Sign in"], mainMax = 760, titleWidth }, kids) {
  const phone = size.w < 640;
  const pad = phone ? 16 : 32;
  const mainW = Math.min(mainMax, size.w);
  const cw = mainW - pad * 2;
  return {
    cw,
    phone,
    node: [
      Row({ name: "Header", width: Math.min(1100, size.w), w: "fixed", height: 64, h: "fixed", justify: "between", padding: [0, pad] }, [
        Img("brand/logo.png", Math.round(40 * (1295 / 473)), 40, { name: "Logo", scaleMode: "FIT" }),
        Row({ name: "Nav", gap: 20 }, nav.map((n) => T(n, "small", { style: "SemiBold", color: C.inkSoft }))),
      ]),
      Col({ name: "Main", width: mainW, w: "fixed", padding: [phone ? 32 : 56, pad, 80, pad], gap: 0 }, [
        T(title, "hero", { size: phone ? 40 : 56, lineHeight: 1.05, free: true, name: "Title", width: titleWidth || cw, w: "fill" }),
        lede && F({ name: "space", width: 10, height: 12 }),
        lede && T(lede, "bodyL", { color: C.inkSoft, width: Math.min(cw, 620), name: "Lede" }),
        F({ name: "space", width: 10, height: 40 }),
        ...kids(cw, phone),
      ]),
    ],
  };
}

const h2 = (t) => T(t, "h2", { name: "Heading", width: 300, w: "fill" });

// ------------------------------------------------------------ the screens
const SCREENS = {
  Help: (size) =>
    reading(size, { title: "Help", lede: "Short answers to the questions people ask most, and a way to reach a real person on our team." }, (cw, phone) => [
      Col({ name: "Crisis card", w: "fill", padding: 20, gap: 0, radius: 20, fill: C.accent }, [
        T("If you're thinking about ending your life or are in danger, please reach out now.", "body", { size: 16, style: "SemiBold", color: C.white, lineHeight: 1.35, width: 300, w: "fill", free: true }),
        F({ name: "space", width: 10, height: 4 }),
        T("Call or text 988, the Suicide & Crisis Lifeline. Free, confidential, 24/7.", "small", { color: "#FFFFFFD9", width: 300, w: "fill" }),
        F({ name: "space", width: 10, height: 16 }),
        Row({ name: "Actions", w: "fill", gap: 8, wrap: true, rowGap: 8 }, [
          pill("Call 988", { fill: C.white, color: C.ink, ic: "phone" }),
          pill("Text 988", { fill: "#FFFFFF26", color: C.white, ic: "message-circle-heart" }),
          pill("Chat online", { fill: "#FFFFFF26", color: C.white }),
        ]),
        F({ name: "space", width: 10, height: 12 }),
        T("Phone and text: 988. In an emergency, call 911.", "caption", { color: "#FFFFFFCC" }),
      ]),
      F({ name: "space", width: 10, height: 56 }),
      h2("Common questions"),
      F({ name: "space", width: 10, height: 20 }),
      Col({ name: "FAQ", w: "fill", gap: 8 }, [
        "How do I get an invite?", "Do people see my real name?", "Who can see my diagnosis and treatment?",
        "Can my partner join?", "What are Grove Guide credits?", "How do I delete my account?",
      ].map((q) =>
        Row({ name: "Question", w: "fill", padding: [16, 20], gap: 16, justify: "between", radius: 20, fill: C.white, stroke: C.line }, [
          T(q, "body", { size: 16, style: "SemiBold", free: true, width: 200, grow: true, w: "fill" }),
          Row({ name: "plus", width: 32, height: 32, w: "fixed", h: "fixed", justify: "center", radius: 999, fill: C.raised }, [icon("plus", 16, C.muted, 2)]),
        ])
      )),
      F({ name: "space", width: 10, height: 56 }),
      h2("Contact support"),
      F({ name: "space", width: 10, height: 8 }),
      T("We reply within two working days. We don't monitor this inbox around the clock, so for anything urgent use the resources above.", "body", { color: C.inkSoft, width: 300, w: "fill" }),
      F({ name: "space", width: 10, height: 20 }),
      Col({ name: "Contact form", w: "fill", padding: phone ? 20 : 28, gap: 20, radius: 20, fill: C.white, stroke: C.line }, [
        fieldBox("Your email"),
        fieldBox("How can we help?", { h: 136, counter: "0 / 2,000" }),
        pill("Send message"),
      ]),
    ]),

  Terms: (size) =>
    reading(size, { title: "Terms", lede: "Sample text for the prototype. The final Terms are written with counsel before launch." }, (cw) => [
      Col({ name: "Sections", w: "fill", gap: 32 }, [
        ...[
          ["Who can join", "Fertility Grove is for adults 18 and older in the United States. During the beta you need an invite link."],
          ["What Fertility Grove is not", "We are not a medical provider, a clinic directory or a crisis service. Nothing here, including the Grove Guide, is medical advice. Talk to your own doctor about your care."],
          ["How we treat each other", "Be kind. Share your experience as your experience. No selling, no harassment, and no pregnancy news outside Success stories. Our community guidelines say more."],
          ["Your content", "You own what you post. You give us permission to show it to the members you chose to share it with, and you can delete it at any time."],
          ["Credits", "Grove Guide credit packs are non-refundable. Free credits refill monthly and don't carry over; purchased credits never expire."],
          ["Ending your account", "You can delete your account at any time from Settings. You have 14 days to restore it by signing back in."],
        ].map(([h, p]) =>
          Col({ name: h, w: "fill", gap: 8 }, [T(h, "h3"), T(p, "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: Math.min(cw, 620) })])
        ),
        Row({ name: "Questions", gap: 4 }, [T("Questions?", "body", { color: C.muted }), T("Contact support.", "body", { style: "SemiBold", decoration: "underline", color: C.accent })]),
      ]),
    ]),

  Privacy: (size) =>
    reading(size, { title: "Privacy", lede: "Sample text for the prototype. The final Privacy Policy and Consumer Health Data Privacy Policy are written with counsel before launch." }, (cw, phone) => {
      const cards = [
        ["Handles by default", "You post under a handle unless you choose to show your first name and last initial."],
        ["No ad trackers", "There are no advertising pixels or trackers anywhere in Fertility Grove."],
        ["Health data is never sold", "Your answers about your health are used only to match you with people, groups and information."],
        ["Download or delete everything", "Settings has Download my data and Delete my account. Deletion is final after 14 days."],
      ];
      const cardW = phone ? cw : (cw - 12) / 2;
      const card = ([h, p]) =>
        Col({ name: h, width: cardW, w: phone ? "fill" : "fixed", h: phone ? "hug" : "fill", padding: 20, gap: 6, radius: 20, fill: C.white, stroke: C.line }, [
          T(h, "body", { size: 17, style: "SemiBold", free: true }),
          T(p, "body", { color: C.inkSoft, width: cardW - 40, w: "fill" }),
        ]);
      const grid = phone
        ? Col({ name: "Promises", w: "fill", gap: 12 }, cards.map(card))
        : Col({ name: "Promises", w: "fill", gap: 12 }, [Row({ name: "row", w: "fill", gap: 12, }, cards.slice(0, 2).map(card)), Row({ name: "row", w: "fill", gap: 12, }, cards.slice(2).map(card))]);
      return [
        grid,
        F({ name: "space", width: 10, height: 48 }),
        h2("Consumer Health Data Privacy Policy"),
        F({ name: "space", width: 10, height: 16 }),
        Col({ name: "Policy", w: "fill", gap: 16 }, [
          "When you answer the onboarding questions about your journey stage, diagnosis and path to parenthood, we collect consumer health data. We ask for your separate, explicit consent before we use it.",
          "We use it only to match you with groups, people, mentors and articles, and, if you allow it, to tailor Grove Guide answers. We do not sell it, share it with advertisers or use it to train AI models.",
          "You can withdraw consent at any time in Settings. Withdrawing deletes those answers, and the parts of Fertility Grove that used them show “Not shared” instead.",
          "We follow US health-data law, including the FTC Health Breach Notification Rule and Washington's My Health My Data Act.",
        ].map((p) => T(p, "body", { size: 16, lineHeight: 1.6, color: C.inkSoft, free: true, width: Math.min(cw, 670) }))),
      ];
    }),

  "Shared post": (size) =>
    reading(size, { title: "What 'within range' usually means after a retrieval" }, (cw, phone) => [
      Col({ name: "Post", w: "fill", padding: phone ? 24 : 32, gap: 0, radius: 20, fill: C.white, stroke: C.line }, [
        Row({ name: "Byline", w: "fill", gap: 8, wrap: true, rowGap: 6 }, [
          Row({ name: "Chip Just sharing", height: 24, h: "fixed", padding: [0, 10], radius: 999, fill: C.tintGreen }, [T("Just sharing", "chip", { color: C.greenInk })]),
          Row({ name: "Name", gap: 6 }, [T("Lena O.", "body", { style: "SemiBold" }), tree("Tree", 16), T("· she/her", "small", { color: C.muted })]),
          Row({ name: "Badge", height: 24, h: "fixed", padding: [0, 8], gap: 4, radius: 999, fill: C.tintBlue }, [icon("badge-check", 13, C.blueInk, 2), T("Verified clinician", "chip", { color: C.blueInk })]),
          T("· In IVF", "small", { color: C.muted }),
        ]),
        F({ name: "space", width: 10, height: 20 }),
        T("Clinics compare your result with what's expected for your age and your AMH, not with numbers you see online. Fertilization rates of about 60–80% are common. Ask your clinic what range they expected for you and what they would change next time.", "bodyL", { width: 300, w: "fill", name: "Body" }),
        F({ name: "space", width: 10, height: 24 }),
        Row({ name: "Meta", gap: 16 }, [
          Row({ name: "Score", gap: 4 }, [T("Score", "small", { color: C.muted }), T("40", "small", { style: "Bold" })]),
          Row({ name: "Source", gap: 8 }, [{ type: "ellipse", width: 6, height: 6, fill: C.lineStrong, name: "dot" }, T("Clinician input", "small", { color: C.muted })]),
        ]),
      ]),
      F({ name: "space", width: 10, height: 24 }),
      Col({ name: "Join card", w: "fill", padding: phone ? 24 : 32, gap: 0, radius: 20, fill: "#031E0F" }, [
        T("Join to read the conversation", "hero", { size: 30, lineHeight: 1.15, free: true, color: C.white, width: 300, w: "fill" }),
        F({ name: "space", width: 10, height: 8 }),
        T("Fertility Grove is a private community for people going through infertility, and their partners. Replies stay inside.", "body", { color: "#FFFFFFD9", width: Math.min(cw - 64, 500) }),
        F({ name: "space", width: 10, height: 20 }),
        Row({ name: "Actions", gap: 8 }, [pill("Create account", { fill: C.white, color: C.ink }), pill("Sign in", { fill: null, color: C.white })]),
      ]),
    ]),

  "Demo personas": (size) =>
    reading(size, { title: "Explore the prototype", nav: ["Sign in"], mainMax: 1100, lede: "Choose a starting point. Everything is sample data kept in this browser. Settings has Prototype tools for the rest: confirming email, pausing sign-ups, adding Sunlight and more." }, (cw, phone) => {
      const people = [
        ["A new member", "Start from the beginning: create an account, confirm your email and walk through all eight onboarding screens.", spot("seeds", 132)],
        ["Annie, six weeks in", "Stage III endometriosis, starting IVF. A Tree with 271 Sunlight, three groups, a mentor and an unread message request.", tree("Tree", 110)],
        ["An invited partner", "Open Annie's partner invite, sign up with your own private account and see the partner presets in onboarding.", spot("roots", 132)],
        ["Annie as a mentor", "At Blossom Tree with mentoring on and a request waiting for a reply from a newly diagnosed member.", tree("Blossom Tree", 110)],
      ];
      const cardW = phone ? cw : (cw - 16) / 2;
      const card = ([title, body, art]) =>
        Row({ name: title, width: cardW, w: phone ? "fill" : "fixed", h: phone ? "hug" : "fill", padding: phone ? 20 : 24, gap: 20, radius: 20, fill: C.white, stroke: C.line }, [
          Col({ name: "Art", width: 132, height: 132, w: "fixed", h: "fixed", justify: "center", align: "center", radius: 14, fill: C.raised }, [art]),
          Col({ name: "Text", w: "fill", grow: true, gap: 6 }, [T(title, "h3"), T(body, "body", { color: C.inkSoft, width: 200, w: "fill" })]),
        ]);
      return phone
        ? [Col({ name: "Personas", w: "fill", gap: 16 }, people.map(card))]
        : [Col({ name: "Personas", w: "fill", gap: 16 }, [Row({ name: "row", w: "fill", gap: 16, }, people.slice(0, 2).map(card)), Row({ name: "row", w: "fill", gap: 16, }, people.slice(2).map(card))])];
    }),
};

// Each screen is a row of its three sizes; rows stack down the page.
await send("set_current_page", { pageId: page });
let y = Number(startY);
const out = [];
for (const [name, make] of Object.entries(SCREENS)) {
  if (only.length && !only.includes(name)) continue;
  let x = 0;
  let rowH = 0;
  for (const size of SIZES) {
    const { node } = make(size);
    const board = F({ name: `Public / ${name} / ${size.key}`, width: size.w, w: "fixed", h: "hug", layout: "column", align: "center", fill: C.white, clip: true, x, y }, node);
    const res = await build([board]);
    const root = res.roots[0];
    // Short pages still fill the device height.
    if (root.height < size.h) await send("resize_node", { nodeId: root.id, width: size.w, height: size.h });
    const h = Math.max(root.height, size.h);
    out.push(`${name} / ${size.key}: ${root.id} ${size.w}x${h}`);
    rowH = Math.max(rowH, h);
    x += size.w + 120;
  }
  y += rowH + 200;
}
console.log(out.join("\n"));
console.log("next y:", y);
