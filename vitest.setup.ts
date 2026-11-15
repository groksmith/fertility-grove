// Global Vitest setup — runs before every test file in both the `node` and `jsdom` environments.
//
// jest-dom matchers (`toBeInTheDocument`, `toHaveValue`, …) are registered against Vitest's `expect`
// via the `/vitest` entry. They are harmless in the `node` environment (they only extend the matcher
// registry; a node test simply never calls a DOM matcher). React Testing Library's `cleanup` is
// registered on the global `afterEach` so mounted components never leak between component tests.
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom implements no navigation, so any un-prevented anchor click or `window.location` assignment
// makes it emit an async `Error: Not implemented: navigation (except hash changes)` via console.error.
// Several suites (e.g. the planning unsaved-changes guard) deliberately dispatch clicks on real
// `<a href>` anchors that the code under test must NOT intercept, asserting `defaultPrevented === false`
// — so they can't preventDefault to quiet it. This is unactionable jsdom noise, not a test signal, and
// (being async) it smears across unrelated tests' stderr. Swallow only that exact message; everything
// else still reaches the console.
const realConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = args[0];
  const message = first instanceof Error ? first.message : String(first ?? "");
  if (message.includes("Not implemented: navigation")) return;
  realConsoleError(...(args as Parameters<typeof console.error>));
};

afterEach(() => {
  cleanup();
});
