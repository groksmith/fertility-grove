// Global Vitest setup — runs before every test file in both the `node` and `jsdom` environments.
//
// `globals: false` (vitest.config.mts) turns off Testing Library's auto-cleanup, so it is registered
// here: mounted components never leak between component tests.
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom implements no navigation, so an un-prevented anchor click or `window.location` assignment
// makes it emit an async `Error: Not implemented: navigation (except hash changes)` via console.error.
// That is jsdom noise, not a test signal, and (being async) it smears across unrelated tests' stderr.
// Swallow only that exact message; everything else still reaches the console.
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
