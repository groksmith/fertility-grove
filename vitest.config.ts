import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit / component test runner. Kept strictly separate from Playwright:
//   • Vitest owns `src/**/*.test.{ts,tsx}` (co-located, fast, no browser).
//   • Playwright owns `tests/**` (real browser E2E) — see playwright.config.ts.
// The two never overlap, so `yarn test` and `yarn test:e2e` can't pick up each other's specs.
//
// Environment: `node` by default (pure-logic suites need no DOM and run fastest). A component test
// opts into jsdom per-file with a `// @vitest-environment jsdom` docblock on line 1.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig `@/*` path alias so tests import the same way the app does.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Never let Vitest wander into the Playwright suite or build output.
    exclude: ["tests/**", "node_modules/**", ".next/**", ".next-check/**"],
    css: false,
    coverage: {
      provider: "v8",
      // Report ALL source files matched by `include` (untested ones count as 0%) so the % reflects the
      // whole app, not just files a test imports. Excludes are things you don't unit-test: barrels,
      // type declarations, mock data and layouts.
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
