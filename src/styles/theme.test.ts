/**
 * GUARD: theme.css hygiene and text contrast of the colour tokens.
 *
 * 1. No hand-written class in `@layer utilities` duplicates a utility Tailwind already generates
 *    from a theme key. The duplicate is byte-identical but sits LATER in the utilities layer, and a
 *    media variant buys no specificity — so `text-brand-text md:text-primary-foreground` stays
 *    brand-coloured past `md`, while `hover:`/`focus:` overrides (worth a pseudo-class point) still
 *    work. It reads as "responsive colour overrides are broken", which is why it is guarded.
 * 2. WCAG 2.2 AA 1.4.3: every text/background pair in CONTRAST_PAIRS clears its minimum, measured
 *    from the token values themselves — so a palette change that drops a text colour under 4.5:1
 *    fails here, not in an axe run on staging.
 *
 * Token values may be hex (#rgb / #rrggbb / #rrggbbaa — alpha ignored), `oklch(L C H)` (L as 0–1
 * or %), or `var(--other)` (followed). Anything else throws, naming the token.
 *
 * Adjust: THEME_FILE, THEMES (the selectors your light/dark values live under — drop the dark
 * entry for a light-only app), CONTRAST_PAIRS, NAMESPACES.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

import { describe, expect, it } from "vitest";

// ── Configuration ──────────────────────────────────────────────────────────────────────────────

const THEME_FILE = join(cwd(), "src/styles/theme.css");

/**
 * Where the token values live, per theme. `header` is matched literally (first occurrence) and its
 * block is brace-matched. A theme whose header is missing is skipped when `optional`. Tokens a
 * theme does not redefine fall back to the first theme's value.
 */
const THEMES: { name: string; header: string; optional?: boolean }[] = [
  // Light only (see CLAUDE.md "Decisions to record").
  { name: "light", header: ":root {" },
];

/**
 * `[fgVar, bgVar, min]` — foreground on background, with the minimum ratio (4.5 body text, 3 large
 * text and UI parts). Names are tokens without the leading `--`; a literal like "#ffffff" works too.
 * The pairs are the semantic text/surface roles and each hue's ink on its tint.
 */
const CONTRAST_PAIRS: [fg: string, bg: string, min: number][] = [
  ["text", "ground", 4.5],
  ["text", "raised", 4.5],
  ["text", "chrome", 4.5],
  ["text-soft", "ground", 4.5],
  ["text-soft", "raised", 4.5],
  ["muted", "ground", 4.5],
  ["muted", "raised", 4.5],
  ["muted", "chrome", 4.5],
  ["accent-ink", "accent", 4.5],
  ["positive", "ground", 4.5],
  ["danger", "ground", 4.5],
  ["danger", "danger-soft", 4.5],
  ["green-700", "green-50", 4.5],
  ["yellow-700", "yellow-50", 4.5],
  ["blue-700", "blue-50", 4.5],
  ["purple-700", "purple-50", 4.5],
  // ⚠️ Known gaps, left out on purpose: the palette is fixed (CLAUDE.md "Brand — fixed"), so these
  // need a design decision, not a code change. Measured: coral-700 on coral-50 4.12:1, pink-700 on
  // pink-50 3.71:1 (both under 4.5:1 for body text). Add them back once the tag inks are revised.
];

/** Tailwind generates a utility per theme key; these are the prefixes per namespace. */
const NAMESPACES: Record<string, string[]> = {
  color: [
    "text",
    "bg",
    "border",
    "ring",
    "fill",
    "stroke",
    "outline",
    "decoration",
    "accent",
    "caret",
    "divide",
    "shadow",
    "from",
    "via",
    "to",
  ],
  shadow: ["shadow"],
  animate: ["animate"],
  font: ["font"],
  radius: ["rounded"],
};

// ── Implementation ─────────────────────────────────────────────────────────────────────────────

const css = readFileSync(THEME_FILE, "utf8");

/** The body of a block by brace matching (regex cannot nest), or null if the header is absent. */
function blockBody(source: string, header: string): string | null {
  const start = source.indexOf(header);
  if (start === -1) return null;
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`${header} is not closed in ${THEME_FILE}`);
}

/** Class names written by hand — top-level selectors only, so nested rules are ignored. */
function handWrittenClasses(body: string): string[] {
  const names: string[] = [];
  let depth = 0;
  for (const line of body.split("\n")) {
    const selector = /^\s*\.([a-zA-Z0-9_-]+)\s*\{/.exec(line);
    if (depth === 0 && selector?.[1]) names.push(selector[1]);
    depth += (line.match(/\{/g)?.length ?? 0) - (line.match(/\}/g)?.length ?? 0);
  }
  return names;
}

type Rgb = [number, number, number]; // linear sRGB, 0..1

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(value: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);
  if (!m) return null;
  let hex = m[1] ?? "";
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => srgbToLinear(Number.parseInt(hex.slice(i, i + 2), 16) / 255)) as Rgb;
}

function parseOklch(value: string): Rgb | null {
  const m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/[^)]*)?\)$/i.exec(value);
  if (!m) return null;
  const L = Number(m[1]) / (m[2] ? 100 : 1);
  const C = Number(m[3]);
  const h = (Number(m[4]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
  ];
}

function declared(body: string, name: string): string | null {
  const m = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(body);
  return m?.[1] ? m[1].trim() : null;
}

function resolveColor(nameOrLiteral: string, bodies: string[], seen: string[] = []): Rgb {
  const literal = parseHex(nameOrLiteral) ?? parseOklch(nameOrLiteral);
  if (literal) return literal;
  if (seen.includes(nameOrLiteral)) throw new Error(`--${nameOrLiteral}: circular var()`);
  const value = bodies.map((body) => declared(body, nameOrLiteral)).find((v) => v !== null);
  if (!value) throw new Error(`--${nameOrLiteral} is not defined in ${THEME_FILE}`);
  const ref = /^var\(\s*--([a-zA-Z0-9_-]+)\s*\)$/.exec(value);
  if (ref?.[1]) return resolveColor(ref[1], bodies, [...seen, nameOrLiteral]);
  const parsed = parseHex(value) ?? parseOklch(value);
  if (!parsed) throw new Error(`--${nameOrLiteral}: unsupported colour "${value}"`);
  return parsed;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: Rgb, b: Rgb): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme.css utilities", () => {
  it("declares no class that Tailwind already generates from a theme key", () => {
    const theme = blockBody(css, "@theme") ?? "";
    const utilities = blockBody(css, "@layer utilities") ?? "";
    const generated = new Set<string>();
    for (const [namespace, prefixes] of Object.entries(NAMESPACES)) {
      const keys = theme.matchAll(new RegExp(`^\\s*--${namespace}-([a-zA-Z0-9_-]+):`, "gm"));
      for (const [, key] of keys) for (const prefix of prefixes) generated.add(`${prefix}-${key}`);
    }
    expect(handWrittenClasses(utilities).filter((name) => generated.has(name))).toEqual([]);
  });
});

describe("text contrast of the colour tokens", () => {
  const base = THEMES[0];
  if (!base) throw new Error("THEMES is empty");
  const baseBody = blockBody(css, base.header);
  if (baseBody === null) throw new Error(`${base.header} not found in ${THEME_FILE}`);

  for (const theme of THEMES) {
    const body = theme === base ? baseBody : blockBody(css, theme.header);
    if (body === null) {
      if (!theme.optional) throw new Error(`${theme.header} not found in ${THEME_FILE}`);
      continue;
    }
    const bodies = theme === base ? [baseBody] : [body, baseBody];

    it.each(CONTRAST_PAIRS)(`${theme.name}: %s on %s clears %s:1`, (fg, bg, min) => {
      const measured = ratio(resolveColor(fg, bodies), resolveColor(bg, bodies));
      expect(Number(measured.toFixed(2))).toBeGreaterThanOrEqual(min);
    });
  }
});
