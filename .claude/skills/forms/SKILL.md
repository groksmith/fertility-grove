---
name: forms
description: Build forms in a Next.js + TypeScript app with react-hook-form 7.9x + Zod 4 + a shared FormField on the shadcn `field` primitive — schema idioms (incl. the Zod 4.3/4.4 refined-schema breaks), inferred resolver input/output types, Controller for custom controls, subscription APIs (useWatch compute, Watch, FormState, subscribe), form-level validate, create/edit patterns, submission through mutation hooks, server 422 → field errors with focus, and a dirty-state guard. Use when building or changing any form, schema, or form error handling.
argument-hint: "[form-name or scenario]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Forms

Baseline (Nov 2026) — verify against package.json: `react-hook-form` 7.91, `@hookform/resolvers` 7
(`zodResolver`), `zod` 4.6, react 19.3, shadcn CLI 4 on `radix-ui`, `sonner` 2.0. No server actions —
submission goes through a mutation hook → service (tanstack + http skills).

| Layer | Tool | Lives in |
|---|---|---|
| Schema | Zod | `src/features/<name>/schema.ts` |
| State | `useForm({ resolver: zodResolver(schema) })` | the page / dialog |
| Fields | `<FormField>` | `src/components/shared/FormField.tsx` (barrel `@/components/shared`) |
| Submit | mutation hook | `src/features/<name>/hooks.ts` |
| Feedback | toast inside the hook; 422s on the fields | `@/lib/field-errors`, `@/lib/api-message` |

Resolvers 5 → 7 changed nothing for `zodResolver` (v6/v7 only broke the effect-ts and typebox
resolvers). Import it from `@hookform/resolvers/zod` and pass a schema from `"zod"`.

---

## 1. Zod 4 schemas

| Write (Zod 4) | Not (deprecated Zod 3 forms) |
|---|---|
| `z.email("Enter a valid email")` | `z.string().email(...)` |
| `z.url()`, `z.uuid()` | `z.string().url()`, `z.string().uuid()` |
| `{ error: "…" }` as the options param | `{ message: "…" }`, `errorMap`, `invalid_type_error` / `required_error` |
| `z.enum(TsEnum)` | `z.nativeEnum(TsEnum)` |
| `z.strictObject({…})` / `z.looseObject({…})` | `.strict()` / `.passthrough()` |
| `.extend({…})` / `.safeExtend({…})` / spread `.shape` | `.merge()` |
| `z.treeifyError(err)` | `err.format()` / `err.flatten()` |
| `.prefault(v)` when you want the v3 `.default()` behaviour | `.default(v)` that doesn't match the output type |
| `ctx.addIssue({ code: "custom", … })` in `superRefine`, or `.check()` | `z.ZodIssueCode.custom` |

A plain string second arg (`.min(1, "Required")`) is still fine. Old Zod 3 forms still run in v4 —
don't churn working schemas, just don't copy them.

### Composing refined schemas (breaking in 4.3 / 4.4)

- **`.pick()` / `.omit()` throw on an object that carries refinements** (4.3). Compose first,
  refine last: build `baseSchema`, derive `stepOne = baseSchema.pick({…})`, then add `.refine` to each.
- **`.extend()` throws when it overwrites keys of a refined object** (4.3) — use `.safeExtend()`,
  which keeps the refinements and rejects conflicting overrides at the type level.
- **`.merge()` throws if the receiver has refinements** (4.4), and is discouraged anyway.
- **A key typed `z.undefined()` is now required** (4.4) — write `.optional()` for "may be absent".

```typescript
import { z } from "zod";

export const ProjectStatus = z.enum(["Draft", "Active", "Archived"]);   // shared enums: src/types/enums.ts
export type ProjectStatus = z.infer<typeof ProjectStatus>;

/** Unrefined base — safe to .pick() / .omit() / .extend(). */
export const projectFields = z.object({
  name: z.string().trim().min(1, "Required").max(200),
  ownerEmail: z.email("Enter a valid email").max(255),
  description: z.string().max(1000).optional(),
  status: ProjectStatus,
  acceptedTerms: z.boolean(),
});

export const createProjectSchema = projectFields.refine((v) => v.acceptedTerms, {
  error: "Please accept to continue",
  path: ["acceptedTerms"],
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;     // what the fields hold
export type CreateProjectPayload = z.output<typeof createProjectSchema>;  // what handleSubmit gets
```

- **Cross-field:** `.refine(fn, { error, path: ["confirmPassword"] })`; several or conditional rules →
  `.superRefine((v, ctx) => ctx.addIssue({ code: "custom", path: ["x"], message }))`. Rules that need
  the form's runtime state rather than its values → form-level `validate` (§3).
- **Enums:** match the backend's wire values exactly. Select options:
  `ProjectStatus.options.map((v) => ({ value: v, label: labelFor(v) }))`.
- **Numbers:** `z.number()` in form schemas, not `z.coerce` (coerce makes the input type `unknown`).
- **Wire ⇄ form transforms** (an ISO date string on the wire, a `Date` in a picker): a Zod codec
  (`z.codec(wire, form, { decode, encode })`) keeps both directions in one place. Otherwise keep
  `YYYY-MM-DD` strings as strings in the form and convert only at the edges.
- **Values the server normalises** (trimmed, sanitised names): mirror the rule client-side if you
  can, and after a save show the *saved* value from the response, never the typed draft.

### Input vs output types

`zodResolver` returns `Resolver<z.input<T>, Context, z.output<T>>`, so **let `useForm` infer from the
resolver** — no generics:

```typescript
const form = useForm({ resolver: zodResolver(createProjectSchema), defaultValues });
// field values: CreateProjectInput · handleSubmit receives: CreateProjectPayload
```

When you must spell it out (a hook that returns the form, a prop type), pass all three:
`useForm<z.input<typeof s>, unknown, z.output<typeof s>>`. Never `useForm<z.infer<typeof s>>` on a
schema whose input and output differ (`.default()`, `.transform()`, codecs). With
`zodResolver(s, undefined, { raw: true })` the submitted value is the **input** type.

---

## 2. Shared `FormField`

Provide one `FormField` in `components/shared/` so every form gets identical spacing, error display
and a11y (label ↔ control, description, message, `aria-invalid` / `aria-describedby`).
**Default — change if your project differs:** build it on the shadcn **`field`** primitive
(`npx shadcn@latest add field --dry-run` first, then add it; read the parts it generates) wrapped
around RHF's `Controller`. A project that already has a FormField on the older `form` primitive keeps
it — don't migrate a working field just for the upgrade. `input-group` (adornments) and `spinner`
(busy submit) are the related primitives; check `components/shared` before adding either.
Reference implementation: kit `templates/src/components/shared/FormField.tsx` (+ its jsdom/axe test)
— one `Controller` per field; select `value={field.value ?? ""}`; `{...field}` spread **before** the
shared props so `field.disabled` can't clobber `disabled`; `aria-describedby` built from a `useId`;
`FieldError errors={[fieldState.error]}`.

```tsx
import { FormField } from "@/components/shared";

<FormField form={form} name="name" label="Name" />                       {/* kind defaults to "text" */}
<FormField form={form} name="ownerEmail" kind="email" label="Owner email" autoComplete="email" />
<FormField form={form} name="password" kind="password" label="Password" autoComplete="new-password" />
<FormField form={form} name="description" kind="textarea" label="Description" rows={4} />
<FormField form={form} name="status" kind="select" label="Status" placeholder="Choose…"
  options={ProjectStatus.options.map((v) => ({ value: v, label: v }))} />
```

- Pass the whole `form` (`UseFormReturn`); the discriminant is `kind`: `text` | `email` | `password`
  | `textarea` | `select`. Keep the list short — add a kind only when 3+ forms need it.
- Shared props: `label`, `description`, `placeholder`, `autoComplete`, `autoFocus`,
  `disabled`, `className`. **No `required` prop** — required-ness lives in the schema.
- RHF 7.88+ ships `<ErrorMessage control name />` itself; FormField renders the message, so use it
  only for errors outside a field (a root/server error line).

### Anything else — `Controller`

Checkbox, radio, switch, date, phone, combobox and custom pickers wrap the primitive or shared
control in `<Controller>` (all controlled: `value` + `onChange`):

```tsx
<Controller
  control={form.control}
  name="acceptedTerms"
  render={({ field, fieldState }) => (
    <div className="flex items-start gap-2.5">
      <Checkbox id="accepted-terms" ref={field.ref} checked={field.value === true}
        onCheckedChange={(v) => field.onChange(v === true)} onBlur={field.onBlur}
        aria-invalid={fieldState.invalid} />
      <Label htmlFor="accepted-terms">I agree to the Terms</Label>
    </div>
  )}
/>
```

Custom shared controls take **`ref` as a prop** (React 19 — no `forwardRef` in new code) and put it on
the focusable element, so `field.ref` lands there and `setError(…, { shouldFocus: true })` works.

---

## 3. Create / edit pattern

```tsx
"use client";

const createProject = useCreateProject();
const form = useForm({
  resolver: zodResolver(createProjectSchema),
  defaultValues: { name: "", ownerEmail: "", description: "", status: undefined, acceptedTerms: false },
});

const onSubmit = form.handleSubmit((values) =>            // values: CreateProjectPayload
  createProject.mutate(values, {
    onSuccess: () => form.reset(),                        // UI side-effects only
    onError: (error) => applyFieldErrors(form, error, ["name", "ownerEmail"] as const),
  }),
);

return (
  <form onSubmit={onSubmit} noValidate className="space-y-5">
    {/* FormFields */}
    <Button type="submit" disabled={createProject.isPending}>Save</Button>
  </form>
);
```

(A FormField built on the older shadcn `form` primitive also needs its `<Form {...form}>` provider
around the `<form>`.)

- `defaultValues` lists **every** key: strings `""`, selects `undefined` (never `""`), booleans
  `false`, arrays `[]`, nullable `null`.
- **Edit forms:** pass `values: data` (resets whenever the query result changes) or `form.reset(data)`
  when it resolves. Gate Save on `isDirty`; after success `form.reset(saved)` so the form is clean
  again. `resetDefaultValues` (7.77+) changes the baseline without touching current input.
- Toast + invalidation live in the hook. The component's `mutate(…, { onSuccess, onError })` only
  navigates, resets, closes a dialog, or maps field errors.
- After login/logout navigate with `window.location.href`, never `router.push` (auth skill).
- Destructive actions confirm through a controlled `<ConfirmDialog>` (`open`, `onOpenChange`,
  `title`, `onConfirm`, `isPending`).
- **Multi-step:** one schema per step derived from the unrefined base (§1), `form.trigger(stepFields)`
  before advancing. Keep finished steps mounted but hidden with `<Activity mode="hidden">` (React 19.2;
  RHF 7.85+ supports it) when their state must survive going back.
- **Field arrays:** `useFieldArray` (or the `<FieldArray>` render-prop component, 7.81+); key rows by
  `field.id`, never by index, and don't rely on `keyName` (v8 renames `id` → `key` and drops it).
- **Cross-field rules that need form state** (submit count, which field changed): form-level
  `validate` on `useForm` (7.72+) — `({ formValues, formState, eventType, name }) => errors | string
  | boolean`, may be async. Pure value rules stay in the schema.

### Re-render discipline — subscribe narrowly

| Need | Use | Not |
|---|---|---|
| A field drives rendering | `useWatch({ control, name })` | `form.watch()` in render |
| A derived value (total, "any checked") | `useWatch({ control, compute: (v) => … })` — re-renders only when the result changes | `watch()` + compute in render |
| A small subtree reacts to a value | `<Watch control={form.control} name="x" render={…} />` | `<Watch names>` (deprecated) |
| A subtree reacts to form state (`isDirty`, `isSubmitting`) | `<FormState control={form.control} name="…" render={…} />` | `FormStateSubscribe` (renamed to `FormState` in 7.84; deprecated alias) |
| Side effect on change, no render (autosave, analytics, the dirty guard) | `form.subscribe({ formState: { values: true }, callback })` in an effect, return its unsubscribe | `watch(callback)` — v8 removes it |

**React Compiler** — **Default off** in this kit until react-hook-form v7 is confirmed compiler-safe
(RHF's compiler work ships in v8 betas; check the RHF release notes before enabling). If the project
enables it, verify forms by test, and opt a misbehaving form out with the `'use no memo'` directive
rather than adding manual memoization. Either way, no new `useMemo` / `useCallback` / `React.memo`
in form code without a profile.

**Route kept alive:** with Cache Components, Next keeps recently visited routes mounted (hidden), so
a half-filled form is still there on Back. That's usually wanted; reset after a successful save, and
don't assume a remount clears a draft.

---

## 4. Server errors — 422 → fields

`httpClient` throws `ApiRequestError` (`status`, `detail`, `errors`, `payload.code`) or
`NetworkError` (http skill §2). Provide once in `src/lib/field-errors.ts`:

```typescript
import { ApiRequestError } from "@/types/common";

/** First server message for a field; keys compare case-insensitively (`FullName` vs `fullName`). */
export function fieldErrorMessage(error: unknown, field: string): string | null {
  if (!(error instanceof ApiRequestError) || !error.errors) return null;
  const wanted = field.toLowerCase();
  for (const [key, messages] of Object.entries(error.errors)) {
    if (key.toLowerCase() === wanted) return messages?.find((m) => m.trim()) ?? null;
  }
  return null;
}

/** Puts each listed field's message on the form, focusing the first; returns whether any matched. */
export function applyFieldErrors<T extends string>(
  form: { setError(name: T, error: { message: string }, options?: { shouldFocus: boolean }): void },
  error: unknown,
  fields: readonly T[],
): boolean {
  let mapped = false;
  for (const field of fields) {
    const message = fieldErrorMessage(error, field);
    if (!message) continue;
    form.setError(field, { message }, { shouldFocus: !mapped });
    mapped = true;
  }
  return mapped;
}
```

In the hook, don't say it twice — skip the toast when a field will show the message:

```typescript
onError: (error) => {
  if (fieldErrorMessage(error, "name") || fieldErrorMessage(error, "ownerEmail")) return;
  toast.error(messageFromError(error, "Couldn't save changes."));
},
```

- When `applyFieldErrors` returns `false`, the hook's toast is the fallback.
- Branch on `errorCode(error)` / `isErrorCode(error, "CODE")`, never on `title`/`detail` text.
- Never show a raw validation `detail` in a toast.

---

## 5. Dirty-state guard

A long form must warn before its edits are lost. Provide one guard and reuse it — never a second
ad-hoc `beforeunload` handler:

- `beforeunload` while the form is dirty (tab close / reload). Track dirtiness with
  `form.subscribe({ formState: { isDirty: true }, callback })` so the page doesn't re-render for it.
- In-app navigation: a small `lib/navigation-guard.ts` singleton (`setNavigationGuard(fn)` /
  `runGuarded(navigate)`) that shell links and menus call, showing a `<ConfirmDialog>` "Leave without
  saving?". The App Router has no route-change event to intercept, so the shell must opt in.
- Clear the guard on successful save (`form.reset(saved)` makes `isDirty` false) and on unmount.

---

## 6. Testing (Vitest 5)

- Schemas get plain tests next to them (`features/<x>/schema.test.ts`), including fast-check fuzzing
  of free-text fields — and a test that each derived step schema still parses (catches a `.pick` on a
  refined object at test time, not in the browser).
- Component tests opt into jsdom per file (`// @vitest-environment jsdom`) with Testing Library:
  variants, validation display, adversarial input rendered as inert text, and an `axe-core`
  assertion. `FormField.test.tsx` is the reference test to write first.
- axe 4.14 enables `label-content-name-mismatch` by default: a button's `aria-label` must contain its
  visible text. Treat findings as real (WCAG 2.5.3).
- Don't assert on generated ids — React 19.2 changed the `useId` prefix to `_r_`; query by role/label.
- `await` every `.resolves` / `.rejects` (an unawaited one fails in Vitest 5); `vi.mock` only at top
  level. In Vitest browser mode `toHaveTextContent` is exact — use `toMatchTextContent` for partial.

---

## Anti-patterns

| Wrong | Right |
|---|---|
| `kind="checkbox" \| "number" \| "date"` on `FormField` | `Controller` + primitive/shared control |
| `required` prop | Schema rule |
| `defaultValues: { status: "" }` / missing keys | `undefined` for selects; list every key |
| `toast` / `invalidateQueries` in `onSubmit` | Inside the mutation hook |
| `z.string().email()`, `{ message }`, `z.nativeEnum`, `.merge()` in new code | `z.email()`, `{ error }`, `z.enum()`, `.extend()` / `.safeExtend()` |
| `.pick()` / `.omit()` / `.extend()` on a refined schema | Compose the unrefined base, refine last; `.safeExtend()` |
| `z.coerce.number()` in a form schema | `z.number()` |
| `useForm<z.infer<…>>` on a schema with `.default()`/`.transform()` | Inferred from the resolver, or `useForm<Input, unknown, Output>` |
| `form.watch()` in render; `watch(callback)` | `useWatch` (+ `compute`), `<Watch name>`, `subscribe` |
| `FormStateSubscribe`, `<Watch names>` | `<FormState>`, `<Watch name>` |
| `forwardRef` in a new custom control | `ref` as a prop |
| A local `messageFromError` copy | `@/lib/api-message` |
| Raw 422 `detail` in a toast | `applyFieldErrors` / `messageFromError` |
| Server actions for submit | mutation hook → service |
