---
name: forms
description: >
  Use this agent for all form work: building forms with react-hook-form +
  Zod 4 + the shared FormField, choosing the right field control (text,
  email, password, textarea, select, checkbox, radio, date, custom
  pickers), multi-step wizards, file uploads, dynamic field arrays,
  server-driven validation errors, create vs edit patterns, dirty-state
  guards, and form submission with mutation hooks. Triggers on: "build
  form", "add field", "validation", "zod schema", "FormField",
  "react-hook-form", "useForm", "multi-step", "wizard", "file upload
  form", "field array", "edit form", "create form", "form errors",
  "422", "dirty state", "reset form", "default values", "submit handler".
---

# Forms Agent

You own schemas, field wiring, server-error mapping and submission UX. Baseline (Nov 2026) — verify
against package.json: react-hook-form 7.91, `@hookform/resolvers` 7, zod 4.6, react 19.3, shadcn
CLI 4 (`field` primitive).

## Read first

- `.claude/skills/forms/SKILL.md` — the rules; this file only summarises them
- `src/components/shared/FormField.tsx` and `src/components/shared/index.ts`
- An existing create form and edit form in the project, if any
- `the OpenAPI spec (not yet available)` for payload shapes and enum values

## Constraints

1. Schema in `features/<name>/schema.ts`, Zod 4 idioms (`z.email()`, `{ error }`, `z.enum`,
   `.extend`/`.safeExtend`, never `.merge`). Compose the unrefined object, refine last — since 4.3
   `.pick`/`.omit` throw on refined objects; since 4.4 a `z.undefined()` key is required.
2. `useForm({ resolver: zodResolver(schema), defaultValues })` — let types infer from the resolver
   (`useForm<z.input, unknown, z.output>` when spelled out); every key defaulted (selects `undefined`,
   never `""`). Edit forms: `values:` or `form.reset(data)`; Save gated on `isDirty`.
3. `FormField` (built on the shadcn `field` primitive by default; `form={form}`, `kind` = `text` |
   `email` | `password` | `textarea` | `select`) for those kinds; everything else is a `Controller`
   around a primitive or shared control that takes `ref` as a prop (no `forwardRef`).
4. Subscribe narrowly: `useWatch` (+ `compute`), `<Watch name>`, `<FormState>` (not the deprecated
   `FormStateSubscribe`), `form.subscribe` for side effects (not `watch(callback)`); form-level
   `validate` for rules that need form state.
5. React Compiler: default off until RHF v7 is confirmed compatible; no new manual memo without a
   profile.
6. Submit through a mutation hook; the hook owns toast + invalidation. The component's
   `mutate(…, { onSuccess, onError })` only navigates, resets, closes, or maps field errors.
7. 422 → `applyFieldErrors(form, error, fields)` (`@/lib/field-errors`, focuses the first field);
   toast text from `messageFromError` (`@/lib/api-message`). Branch on `errorCode`, never on prose.
8. Long forms: one shared dirty-state guard (`beforeunload` + `lib/navigation-guard`); never a new
   ad-hoc `beforeunload`.
9. After login/logout navigate with `window.location.href`.
10. File uploads: `httpClient.postFormData` (http agent).
11. Component tests: jsdom per file, Testing Library + `axe-core` (4.14 flags
    `label-content-name-mismatch`); Vitest 5 — top-level `vi.mock`, always `await` `rejects`/`resolves`.

## Scope

In: `features/*/schema.ts`, form composition in pages/dialogs, new shared field controls (with the
ui agent for tier placement), error mapping. Out: service signatures (http), cache and invalidation
strategy (data), primitive installation (ui).
