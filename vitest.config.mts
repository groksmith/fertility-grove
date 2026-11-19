/**
 * Vitest config (Vitest 5 — verify against package.json). From the Next.js kit.
 *
 * `.mts`, not `.ts`: package.json has no `"type": "module"`, so Vite 8 would warn that it loaded an
 * ESM config as CommonJS. Vitest owns `src/**`; Playwright owns `tests/**`. Neither picks up the
 * other's specs.
 */
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// "TZ pinned": every test run uses one timezone, set here rather than as `TZ=… vitest` in
// package.json so it also works on Windows. Workers inherit it. Kept equal to Playwright's
// `timezoneId`, and far from UTC so date-only bugs surface.
process.env.TZ = "America/Los_Angeles";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    // Mirror the tsconfig `@/*` path so tests import the way the app does.
    alias: { "@": fromRoot("./src") },
  },
  test: {
    // Pure logic needs no DOM and runs fastest. A component test opts in with a
    // `// @vitest-environment jsdom` docblock on its first line.
    environment: "node",
    // Import `describe` / `it` / `expect` / `vi` from "vitest" explicitly. With TypeScript 7's
    // `types: []` default, globals would also need "vitest/globals" in tsconfig `types`.
    globals: false,
    // Testing Library's auto-cleanup needs globals; vitest.setup.ts registers it instead.
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["tests/**", "node_modules/**", ".next/**", ".next-check/**", ".next-e2e/**"],
    // clearMocks defaults to true in Vitest 5. Set it to false only if a test asserts on calls
    // recorded in beforeAll or at module top level.
    coverage: {
      provider: "v8",
      // List what counts as app code; untested files count as 0%. Excluded: what isn't unit-tested
      // (barrels, type declarations, mock data, layouts).
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/**/index.ts",
        "src/types/**",
        "src/lib/data/**",
        "src/app/**/layout.tsx",
      ],
      reporter: ["text-summary"],
    },
  },
});
