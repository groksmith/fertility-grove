// Helpers for building Fertility Grove screens in Figma through the TalkToFigma
// relay. Specs are plain objects (see build_nodes in the plugin); send() ships
// one command and resolves with the plugin's result.
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const PUB = join(ROOT, "public");

// Brand colours (docs/figma/foundations.json).
export const C = {
  ink: "#090814", inkSoft: "#3D3D3D", muted: "#666666", mutedGrey: "#5C5C5C",
  white: "#FFFFFF", surface: "#F8F8F8", raised: "#F3F3F3", line: "#E6E6E6", lineStrong: "#D8D8D8",
  accent: "#222222", orange: "#F89414", orangeDeep: "#E97D03", leaf: "#6C9E3B",
  danger: "#C0392B", dangerSoft: "#FFE7DE",
  greenInk: "#0A7A3B", tintGreen: "#E0F6EB", tintBlue: "#DFF3FF", tintPink: "#FFE7DE", tintYellow: "#FFFBE8", tintPurple: "#F1E7F1",
  blueInk: "#326A97", blue: "#85C5F9", coral: "#F48265", coralInk: "#C24A28", yellowInk: "#8A6D12", purpleInk: "#7546A4", pink: "#F97AB3", pinkBg: "#FFE8F3", pinkInk: "#C94C88",
  greyTrack: "#D6D6D6",
};

// Text in a named style (Figma text styles created from styles.json).
const STYLE = {
  hero: ["Display / Hero", "Instrument Serif", "Regular", 56, 1.04],
  section: ["Display / Section", "Instrument Serif", "Regular", 56, 1],
  pageTitle: ["Display / Page title", "Instrument Serif", "Regular", 32, 1.1],
  pageTitlePhone: ["Display / Page title phone", "Instrument Serif", "Regular", 28, 1.1],
  h2: ["Heading / Section", "Instrument Sans", "SemiBold", 24, 1.25],
  h3: ["Heading / Card", "Instrument Sans", "SemiBold", 20, 1.3],
  h4: ["Heading / Small", "Instrument Sans", "SemiBold", 16, 1.4],
  bodyL: ["Body / Large", "Instrument Sans", "Regular", 17, 1.6],
  body: ["Body", "Instrument Sans", "Regular", 15, 1.6],
  small: ["Body / Small", "Instrument Sans", "Regular", 14, 1.5],
  caption: ["Caption", "Instrument Sans", "Regular", 13, 1.45],
  chip: ["Label / Chip", "Instrument Sans", "SemiBold", 12, 1.3],
};

/** Text. `as` names a text style; extra props override (size, style, color...). */
export function T(text, as = "body", props = {}) {
  const [textStyle, font, style, size, lineHeight] = STYLE[as] || STYLE.body;
  // A text style overrides weight and size, so only attach it when they match.
  const custom = props.free || (props.style && props.style !== style) || (props.size && props.size !== size) || (props.font && props.font !== font);
  const { free, ...rest } = props;
  return { type: "text", text, font, style, size, lineHeight, textStyle: custom ? undefined : textStyle, color: C.ink, ...rest };
}

/** Frame. kids are children. */
export function F(props = {}, kids = []) {
  return { type: "frame", ...props, children: kids.filter(Boolean) };
}
export const Row = (props, kids) => F({ layout: "row", align: "center", w: "hug", h: "hug", ...props }, kids);
export const Col = (props, kids) => F({ layout: "column", w: "hug", h: "hug", ...props }, kids);

/** Image from public/ (or an absolute path). */
const PNG_CACHE = join(tmpdir(), "fg-figma-png");
/** Figma takes PNG/JPG/GIF; WebP is converted (macOS sips) and every image is
 *  scaled to twice its largest drawn side, so a page of art stays light enough
 *  for the plugin. Results are cached by path and size. */
function asPng(abs, side) {
  const big = side ? Math.min(2400, Math.ceil(side * 2)) : 0;
  if (!abs.endsWith(".webp") && !big) return abs;
  mkdirSync(PNG_CACHE, { recursive: true });
  const ext = abs.endsWith(".jpg") || abs.endsWith(".jpeg") ? ".jpg" : ".png";
  const out = join(PNG_CACHE, abs.replace(/[/]/g, "_").replace(/\.(webp|png|jpe?g)$/, "") + (big ? `@${big}` : "") + ext);
  if (!existsSync(out)) {
    const args = ["-s", "format", ext === ".jpg" ? "jpeg" : "png"];
    const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", abs], { encoding: "utf8" }).match(/\d+/g).slice(-2).map(Number);
    if (big && Math.max(...dims) > big) args.push("-Z", String(big));
    execFileSync("sips", [...args, abs, "--out", out], { stdio: "ignore" });
  }
  return out;
}
export function Img(path, width, height, props = {}) {
  const abs = asPng(path.startsWith("/") ? path : join(PUB, path.replace(/^\//, "")), Math.max(width, height));
  return { type: "rect", width, height, image: abs, scaleMode: props.scaleMode || "FILL", fill: null, ...props };
}

// Lucide icons, drawn exactly as the app does.
const iconCache = {};
export function icon(name, size = 20, color = C.ink, strokeWidth = 1.75) {
  if (!iconCache[name]) {
    const f = join(ROOT, "node_modules/lucide-react/dist/esm/icons", `${name}.mjs`);
    if (!existsSync(f)) throw new Error("No lucide icon: " + name);
    let src = readFileSync(f, "utf8");
    // Aliases re-export another icon file.
    const alias = src.match(/export \{ default \} from '\.\/([a-z0-9-]+)\.mjs'/);
    if (alias) src = readFileSync(join(ROOT, "node_modules/lucide-react/dist/esm/icons", `${alias[1]}.mjs`), "utf8");
    // The icon's node list sits between "node:" and the end of __iconData.
    let body = src.slice(src.indexOf("node:") + 5, src.indexOf("\n};"));
    body = body.replace(/,\s*aliases:\s*\[[^\]]*\]\s*$/, "").trim().replace(/,$/, "");
    // eslint-disable-next-line no-new-func
    iconCache[name] = Function(`return ${body}`)();
  }
  const els = iconCache[name]
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${els}</svg>`;
  return { type: "svg", svg, width: size, height: size, name: `icon/${name}` };
}

/** Send one command to the plugin over the relay. */
export function send(command, params, { channel = process.env.FG_CHANNEL, timeout = 240000 } = {}) {
  const inline = (n) => {
    if (n && typeof n === "object") {
      if (typeof n.image === "string") {
        n.imageBase64 = readFileSync(n.image).toString("base64");
        delete n.image;
      }
      if (Array.isArray(n.children)) n.children.forEach(inline);
    }
  };
  (params.nodes || []).forEach(inline);
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("ws://localhost:3055");
    const id = randomUUID();
    const timer = setTimeout(() => reject(new Error("timeout")), timeout);
    ws.addEventListener("open", () => ws.send(JSON.stringify({ type: "join", channel, id: "j" + id })));
    ws.addEventListener("message", (e) => {
      const d = JSON.parse(e.data);
      if (d.type === "system" && d.message?.result?.startsWith?.("Connected to channel")) {
        ws.send(JSON.stringify({ id, type: "message", channel, message: { id, command, params: { ...params, commandId: id } } }));
        return;
      }
      const m = d.message;
      if (m && m.id === id && ("result" in m || "error" in m)) {
        clearTimeout(timer);
        ws.close();
        if (m.error) reject(new Error(typeof m.error === "string" ? m.error : JSON.stringify(m.error)));
        else resolve(m.result);
      }
    });
    ws.addEventListener("error", (e) => reject(new Error("socket error " + (e.message || ""))));
  });
}

export const build = (nodes, opts = {}) => send("build_nodes", { nodes, ...opts });
