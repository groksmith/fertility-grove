/**
 * GUARD: dependency flow between layers ("Dependency flow" in CLAUDE.md).
 *
 * Every import in a source file under src/ (tests excluded — a test may reach anywhere it needs to
 * mock) is resolved to the layer it lands in and checked against what the importing file's layer may
 * depend on. A failure names the file, the import and the rule; the fix is to MOVE the code (e.g. a
 * component that needs a feature hook belongs in components/common, not components/shared), not to
 * widen the table below.
 *
 * Adjust: ALLOWED (your layer table), SHARED_FEATURES, FEATURE_DEEP_ALLOWED, MIN_SOURCE_FILES and
 * PROBE_IMPORT. A top-level folder under src/ that is not in ALLOWED fails the test with a message
 * asking you to add it — deliberately, so a new layer is a decision, not an accident.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { cwd } from "node:process";

import { describe, expect, it } from "vitest";

// ── Configuration ──────────────────────────────────────────────────────────────────────────────

/** Vitest runs from the project root; src/ is resolved from there so the file can live anywhere. */
const SRC = path.resolve(cwd(), "src");

/** Path alias for src/ used in imports (tsconfig "paths"). */
const ALIAS = "@/";

/**
 * What each layer may import, besides itself. `components/<x>` folders are layers of their own;
 * files directly under src/ (proxy.ts, instrumentation.ts) are "root".
 */
const ALLOWED: Record<string, readonly string[]> = {
  app: [
    "features",
    "components/ui",
    "components/shared",
    "components/common",
    "components/icons",
    "components/art",
    "lib",
    "config",
    "hooks",
    "types",
    "styles",
  ],
  features: ["lib", "config", "types"],
  // App shell and app-level composites: may use features and the store, never a route.
  "components/common": [
    "features",
    "components/ui",
    "components/shared",
    "components/icons",
    "components/art",
    "lib",
    "config",
    "hooks",
    "types",
  ],
  // Reusable composites with no domain state (no features, no mock server — see below).
  "components/shared": [
    "components/ui",
    "components/icons",
    "components/art",
    "lib",
    "config",
    "hooks",
    "types",
  ],
  // The app's own primitives (this project has no shadcn).
  "components/ui": ["lib", "hooks", "types"],
  "components/icons": ["lib"],
  // The brand's painted art: leaf components, imported by path.
  "components/art": ["lib", "config", "types"],
  hooks: ["lib", "config", "types"],
  lib: ["config", "types"],
  config: ["types"],
  types: [],
  styles: [],
  // Framework entry points at the src root.
  root: ["lib", "config", "types"],
};

/**
 * The mock server (`lib/mock-server`) stands in for the backend. Screens read it through
 * `useStore`; nothing below the composites tier may touch it, and the pure PRD rules never do
 * (its `seed/` content is allowed — it is static data).
 */
const NO_MOCK_SERVER = ["components/shared", "components/ui", "components/icons", "hooks"];
const PURE = ["lib/rules"];
const isMockServerState = (target: string) =>
  target === "lib/mock-server" ||
  (target.startsWith("lib/mock-server/") && !target.startsWith("lib/mock-server/seed"));

/** Features any other feature may import (session and identity). */
const SHARED_FEATURES = new Set(["auth"]);

/**
 * Reaching past a feature's barrel is allowed only for these server-safe leaf modules, which server
 * layouts need because the barrel also exports client hooks.
 */
const FEATURE_DEEP_ALLOWED = new Set(["server", "keys", "state"]);

/** Vacuous-pass guard: the scan must see at least this many files … */
const MIN_SOURCE_FILES = 150;
/** … and at least one file importing this (set to null to skip). */
const PROBE_IMPORT: string | null = "@/lib/mock-server";

// ── Implementation ─────────────────────────────────────────────────────────────────────────────

interface Location {
  layer: string;
  feature?: string;
}

function layerOf(relative: string): Location {
  const [top, second] = relative.split(/[\\/]/);
  if (top === "components") return { layer: `components/${second}` };
  if (top === "features") return { layer: "features", feature: second };
  if (!/[\\/]/.test(relative)) return { layer: "root" };
  return { layer: top ?? "root" };
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.(test|spec|bench)\.tsx?$/.test(entry.name)) return [];
    if (entry.name.endsWith(".d.ts")) return [];
    return [full];
  });
}

const IMPORT =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(IMPORT)].map((m) => (m[1] ?? m[2]) as string);
}

/** The src-relative target of an import, or null for a package. */
function resolveTarget(file: string, specifier: string): string | null {
  if (specifier.startsWith(ALIAS)) return specifier.slice(ALIAS.length);
  if (specifier.startsWith(".")) {
    return path.relative(SRC, path.resolve(path.dirname(file), specifier));
  }
  return null;
}

function violations(): string[] {
  const found: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const relative = path.relative(SRC, file);
    const from = layerOf(relative);
    const allowed = ALLOWED[from.layer];
    if (!allowed) {
      found.push(`${relative}: unknown layer "${from.layer}" — add it to ALLOWED`);
      continue;
    }
    for (const specifier of importsOf(file)) {
      const target = resolveTarget(file, specifier);
      if (target === null) continue;
      const to = layerOf(target);
      const where = `${relative} → ${specifier}`;

      if (to.layer === "features" && to.feature !== from.feature) {
        const deep = target.split(/[\\/]/).slice(2).join("/");
        if (deep && !FEATURE_DEEP_ALLOWED.has(deep)) {
          found.push(
            `${where}: import a feature through its barrel (${ALIAS}features/${to.feature})`,
          );
        }
      }

      if (
        to.layer === "components/shared" &&
        from.layer !== "components/shared" &&
        target !== "components/shared"
      ) {
        found.push(
          `${where}: import shared components through the barrel (${ALIAS}components/shared)`,
        );
      }
      if (NO_MOCK_SERVER.includes(from.layer) && isMockServerState(target)) {
        found.push(`${where}: ${from.layer} may not read the mock server — move it to common`);
      }
      if (PURE.some((p) => relative.startsWith(`${p}/`)) && isMockServerState(target)) {
        found.push(`${where}: PRD rules stay pure — no mock server state`);
      }

      if (to.layer === from.layer) {
        if (
          from.layer === "features" &&
          to.feature !== from.feature &&
          !SHARED_FEATURES.has(to.feature ?? "")
        ) {
          found.push(`${where}: features may not import other features`);
        }
        continue;
      }
      if (!allowed.includes(to.layer)) {
        found.push(`${where}: ${from.layer} may not import ${to.layer}`);
      }
    }
  }
  return found;
}

describe("architecture — dependency flow", () => {
  it("every import respects its layer's allowed dependencies", () => {
    expect(violations()).toEqual([]);
  });

  it("actually inspects the codebase (guards against a vacuous pass)", () => {
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThanOrEqual(MIN_SOURCE_FILES);
    if (PROBE_IMPORT) {
      expect(files.some((f) => importsOf(f).includes(PROBE_IMPORT))).toBe(true);
    }
  });
});
