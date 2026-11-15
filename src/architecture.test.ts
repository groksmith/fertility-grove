import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The dependency rules in .claude/CLAUDE.md ("Dependency flow"), enforced. Every import in a source
// file (tests excluded — a test may reach anywhere it needs to) is resolved to the layer it lands in
// and checked against what that file's own layer may depend on. A failure names the file, the import
// and the rule, so the fix is to move the code, not to add an exception here.

const SRC = path.resolve(__dirname);

type Layer =
  | "app"
  | "components/common"
  | "components/shared"
  | "components/art"
  | "lib"
  | "config"
  | "hooks"
  | "types"
  | "root";

// What each layer may import, besides itself.
const ALLOWED: Record<Layer, readonly Layer[]> = {
  app: [
    "components/common",
    "components/shared",
    "components/art",
    "lib",
    "config",
    "hooks",
    "types",
  ],
  // App shell and app-level composites: may read the store, never a route.
  "components/common": ["components/shared", "components/art", "lib", "config", "hooks", "types"],
  // Reusable building blocks with no domain state (see DOMAIN_STATE below).
  "components/shared": ["components/art", "lib", "config", "hooks", "types"],
  // The brand's painted art: leaf components, imported by path.
  "components/art": ["lib", "config", "types"],
  hooks: ["lib", "config", "types"],
  lib: ["config", "types"],
  config: ["types"],
  types: [],
  // Framework entry points at the src root.
  root: ["lib", "config", "types"],
};

// The prototype's stand-in for a backend: the store (state, actions, selectors) and the API facade
// over it. Pharos keeps this in `features/`; here it is `lib/store` + `lib/api` until the API lands.
const DOMAIN_STATE = ["lib/store", "lib/api"];
const isDomainState = (target: string) =>
  DOMAIN_STATE.some((p) => target === p || target.startsWith(`${p}/`));

// Pure modules: rules and mock data never read or write state, so they stay unit-testable and can
// move server-side unchanged.
const PURE = ["lib/rules", "lib/data"];

function layerOf(relative: string): Layer {
  const [top, second] = relative.split("/");
  if (top === "components") return `components/${second}` as Layer;
  if (!relative.includes("/")) return "root";
  return top as Layer;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.(test|bench)\.tsx?$/.test(entry.name)) return [];
    if (entry.name.endsWith(".d.ts")) return [];
    return [full];
  });
}

const IMPORT =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(IMPORT)].map((m) => (m[1] ?? m[2] ?? m[3]) as string);
}

/** The `src/`-relative target of an import, or null for a package. */
function resolveTarget(file: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return specifier.slice(2);
  if (specifier.startsWith("."))
    return path.relative(SRC, path.resolve(path.dirname(file), specifier));
  return null;
}

function violations(): string[] {
  const found: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const relative = path.relative(SRC, file);
    const from = layerOf(relative);
    for (const specifier of importsOf(file)) {
      const target = resolveTarget(file, specifier);
      if (target === null) continue;
      const to = layerOf(target);
      const where = `${relative} → ${specifier}`;

      if (
        to === "components/shared" &&
        from !== "components/shared" &&
        target !== "components/shared"
      ) {
        found.push(`${where}: import shared components through the barrel (@/components/shared)`);
      }
      if (from === "components/shared" && isDomainState(target)) {
        found.push(`${where}: shared components may not read the store — move it to common`);
      }
      if (PURE.some((p) => relative.startsWith(`${p}/`)) && isDomainState(target)) {
        found.push(`${where}: rules and data stay pure — no store or API`);
      }
      if (to === from) continue;
      if (!ALLOWED[from].includes(to)) {
        found.push(`${where}: ${from} may not import ${to}`);
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
    expect(files.length).toBeGreaterThan(80);
    expect(files.some((f) => importsOf(f).includes("@/lib/store"))).toBe(true);
    expect(files.some((f) => importsOf(f).includes("@/components/shared"))).toBe(true);
  });
});
