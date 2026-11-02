// Step 5e: app screens straight from the running app. Opens each route in
// headless Chrome as the demo member at Desktop 1440, Tablet 768 and Phone 390,
// reads the rendered page with dom-extract.js and builds it in Figma as frames,
// text, images and icons at their exact positions.
// Usage: FG_CHANNEL=fertility-grove node dom-to-figma.mjs <pageId> <screens.json> [name...]
//   screens.json: [["App", "Home", "/home"], ...]. Rows stack on a fixed pitch
//   (in order of the list) so one screen can be rebuilt in place.
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Img, PUB, build, send as fig } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXTRACT = readFileSync(join(HERE, "dom-extract.js"), "utf8");
const WASH = join(HERE, "..", "assets", "wash-faded.png");
const BASE = process.env.FG_APP || "http://localhost:3003";
const [page, listFile, ...only] = process.argv.slice(2);
const SCREENS = JSON.parse(readFileSync(listFile, "utf8"));
const SIZES = [
  { key: "Desktop 1440", w: 1440, h: 900 },
  { key: "Tablet 768", w: 768, h: 1024 },
  { key: "Phone 390", w: 390, h: 844 },
];
const PITCH = Number(process.env.FG_PITCH || 4000);

// ------------------------------------------------------------ Chrome
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${mkdtempSync(join(tmpdir(), "d2f-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const p = j.find((t) => t.type === "page");
    if (p) ws = new WebSocket(p.webSocketDebuggerUrl);
  } catch {}
  await sleep(200);
}
if (ws.readyState !== 1) await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const cdp = (method, params = {}) => new Promise((r) => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => {
  const m = await cdp("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true });
  if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || "evaluate failed");
  return m.result?.result?.value;
};

// Motion off, every image loaded, reveal states settled.
const SETTLE = `(async () => {
  const st = document.createElement("style");
  st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
  document.head.appendChild(st);
  document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
  document.querySelectorAll("[data-reveal]").forEach((e) => (e.dataset.in = ""));
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
  await document.fonts.ready;
  return true;
})()`;

async function capture(path, size) {
  const mobile = size.w < 700;
  await cdp("Emulation.setDeviceMetricsOverride", { width: size.w, height: size.h, deviceScaleFactor: 1, mobile });
  await cdp("Page.navigate", { url: BASE + path });
  await sleep(4000);
  await ev(SETTLE);
  const full = await ev("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)");
  // The window as tall as the page: fixed bars sit at the page's ends.
  await cdp("Emulation.setDeviceMetricsOverride", { width: size.w, height: Math.max(size.h, Math.min(full, 12000)), deviceScaleFactor: 1, mobile });
  await sleep(700);
  await ev(SETTLE);
  return ev(EXTRACT);
}

// ------------------------------------------------------------ to Figma
/** Image paths to local files (scaled by Img), dropping layers we can't load. */
function resolve(n) {
  if (n.image) {
    let file = n.image.startsWith("/") ? join(PUB, decodeURI(n.image)) : null;
    if (n.image.endsWith("/wash.webp")) file = WASH;
    if (!file || !existsSync(file)) return null;
    const { flip, mask, image, ...rest } = n;
    const img = Img(file, n.width, n.height, rest);
    return img;
  }
  if (n.children) n.children = n.children.map(resolve).filter(Boolean);
  return n;
}

/** Split a frame's children into calls of roughly `limit` bytes each. */
function batches(children, limit = 6e6) {
  const out = [];
  let cur = [];
  let size = 0;
  for (const c of children) {
    const s = JSON.stringify(c).length + (c.image ? 4e5 : 0) * countImages(c);
    if (cur.length && size + s > limit) {
      out.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(c);
    size += s;
  }
  if (cur.length) out.push(cur);
  return out;
}
const countImages = (n) => (n.image ? 1 : 0) + (n.children || []).reduce((a, c) => a + countImages(c), 0);

await fig("set_current_page", { pageId: page });
const log = [];
for (const [row, [area, name, path]] of SCREENS.entries()) {
  if (only.length && !only.includes(name)) continue;
  let x = 0;
  for (const size of SIZES) {
    const tree = await capture(path, size);
    const board = { type: "frame", name: `${area} / ${name} / ${size.key}`, width: tree.width, height: tree.height, fill: tree.fill, clip: true, x, y: row * PITCH, children: [] };
    const res = await build([board]);
    const id = res.roots[0].id;
    const kids = tree.children.map(resolve).filter(Boolean);
    for (const part of batches(kids)) await build(part, { parentId: id });
    log.push(`${name} / ${size.key}: ${id} ${tree.width}x${tree.height}`);
    console.log(log.at(-1));
    x += size.w + 120;
  }
}
ws.close();
chrome.kill();
