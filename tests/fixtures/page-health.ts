import type { Page } from "@playwright/test";

/**
 * Collects what makes a page "broken" without failing on the first one, so a spec can report every
 * problem a route has at once: console errors (which include CSP violations), uncaught exceptions,
 * and same-origin requests that fail or answer 4xx/5xx (a missing image under public/assets/).
 */
export function watchPageHealth(page: Page) {
  const problems: string[] = [];
  const origin = () => new URL(page.url()).origin;

  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`exception: ${error.message}`));
  page.on("requestfailed", (request) => {
    // Navigating away aborts in-flight media and prefetches; that is not a broken asset.
    if (request.failure()?.errorText.includes("ERR_ABORTED")) return;
    problems.push(`failed: ${request.url()} (${request.failure()?.errorText})`);
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && url.startsWith(origin())) {
      problems.push(`${response.status()}: ${url}`);
    }
  });

  return { problems };
}
