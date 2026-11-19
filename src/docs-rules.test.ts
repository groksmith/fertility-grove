/**
 * GUARD: one working document per audience (see the handoff-docs skill).
 *
 * - The FE task list exists only while something is being implemented: each task is removed when
 *   done (never ticked and left), and the file is removed when empty. Never a folder of per-task
 *   notes — those go stale while code still cites them.
 * - Product-owner questions are read by someone non-technical, so they carry no keys: no
 *   requirement ids, backend ask numbers, status codes, error codes, endpoints or backticked code.
 *   Only the text after the first `---` line is checked; the header above it explains the rules.
 * - Backend (`B<n>`) and ops (`O<n>`) asks are never numbered twice.
 *
 * Each check is skipped while its file does not exist. Adjust: DOCS_DIR, the file names, and
 * TECHNICAL_KEYS (add your spec's id formats).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

import { describe, expect, it } from "vitest";

// ── Configuration ──────────────────────────────────────────────────────────────────────────────

const DOCS_DIR = join(cwd(), "docs");
const FE_TASKS = "fe-tasks.md";
const PO_QUESTIONS = "po-questions.md";
const BACKEND_TASKS = "backend-tasks.md";

/** Technical keys that must not appear in a PO question. */
const TECHNICAL_KEYS: RegExp[] = [
  /\b(?:FR|NFR|OQ)-[A-Z0-9-]+/g, // requirement / open-question ids — add your spec's formats
  /§\s?\d+(?:\.\d+)*/g, // PRD section references (§19, §27.2)
  /\b[BO]\d+\b/g, // backend / ops ask numbers
  /(?<![$\d.,])\b[45]\d\d\b/g, // HTTP status codes (not "$500")
  /\b[A-Z]+(?:_[A-Z]+)+\b/g, // error codes like ORDER_ALREADY_SHIPPED
  /\b(?:GET|POST|PUT|PATCH|DELETE) \//g, // endpoints
  /\/api\//g,
  /`[^`]+`/g, // code, field and file names
];

// ── Implementation ─────────────────────────────────────────────────────────────────────────────

const path = (name: string) => join(DOCS_DIR, name);
const read = (name: string) => readFileSync(path(name), "utf8");

describe("handoff docs", () => {
  it("keeps FE tasks in one temporary file, never a folder of notes", () => {
    expect(existsSync(path(FE_TASKS.replace(/\.md$/, "")))).toBe(false);
  });

  it.skipIf(!existsSync(path(FE_TASKS)))("leaves no finished or empty FE task list behind", () => {
    const text = read(FE_TASKS);
    expect(text.match(/^\s*- \[x\]/gim) ?? [], "remove done tasks instead of ticking them").toEqual(
      [],
    );
    expect(/^\s*- \[ \]/m.test(text), `delete docs/${FE_TASKS} once it is empty`).toBe(true);
  });

  it.skipIf(!existsSync(path(PO_QUESTIONS)))("writes PO questions without technical keys", () => {
    const questions = read(PO_QUESTIONS).split(/^---$/m).slice(1).join("\n");
    const found = TECHNICAL_KEYS.flatMap((key) => questions.match(key) ?? []);
    expect(
      found,
      `rewrite these in everyday words; technical detail goes to ${BACKEND_TASKS}`,
    ).toEqual([]);
  });

  it.skipIf(!existsSync(path(BACKEND_TASKS)))("never reuses a backend or ops ask number", () => {
    const ids = [...read(BACKEND_TASKS).matchAll(/^## ~*([BO]\d+)\b/gm)].map((m) => m[1]);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });
});
