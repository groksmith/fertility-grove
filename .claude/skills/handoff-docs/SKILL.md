---
name: handoff-docs
description: Rules for the three working documents, one per audience — FE tasks (docs/fe-tasks.md, temporary, only while implementing), product-owner questions (docs/po-questions.md, plain language for a non-technical reader), and backend/ops asks (docs/backend-tasks.md, built on the PO's answers). Use whenever you plan or implement a feature, find a gap or contradiction in the spec, raise a question for the product owner, record an answer, or add or close a backend or ops ask.
---

# Handoff docs — one file per audience

| File | Reader | Lives |
|---|---|---|
| `docs/fe-tasks.md` | us, while building | **Only during implementation.** Deleted when empty |
| `docs/po-questions.md` | the Product Owner (not technical) | Permanent; holds **open** questions only |
| `docs/backend-tasks.md` | the backend team (and ops) | Permanent; `B<n>` backend asks, `O<n>` ops asks |

Never create a per-task or per-question file, and never a `docs/fe-tasks/` folder. There is one file
per audience. `src/docs-rules.test.ts` guards what can be checked mechanically (template in the kit's
`templates/guards/`).

**Order of authority: spec → PO answers → code.** Read the product spec first (the path is in
CLAUDE.md's Reference Documents). Only a gap, an unclear passage or a contradiction in the spec
becomes a PO question. When the spec is clear, the work is FE (a task in `fe-tasks.md`) or BE (a
`B<n>`), never a question.

---

## 1. FE tasks: temporary, created while implementing

FE tasks are not a backlog. They exist only while a piece of work is being implemented.

**Create** `docs/fe-tasks.md` when implementation starts and the work has more than one step: a
feature, a spec sync, a set of PO answers, or a backend item that just shipped.

```markdown
# FE tasks — in progress

Working list for the implementation under way. Remove each task when it is done. Delete this file
when the list is empty.

## <What is being implemented> (started YYYY-MM-DD)

- [ ] <Concrete step: what changes, where> (source: spec section, PO answer of <date>, or backend-tasks B<n>)
- [ ] …
```

**Remove** each task as soon as it is done — the code is in and typecheck plus the relevant tests
pass. Don't tick it and leave it; delete the line. Remove a heading when its last task goes. **Delete
the file** when nothing is left.

- Only FE work goes here. A step that turns out to need the backend moves to `backend-tasks.md` as a
  `B<n>`; a step that needs a product decision moves to `po-questions.md`.
- History lives in the code and the commit messages. Never keep a "Done" section.
- A backend item's "**FE follow-up when shipped**" line is where FE work waiting on the backend
  sits. When the item ships, its follow-up becomes a task here.
- If the file still exists at the end of a session, tell the user what is left in it.

---

## 2. PO questions: plain language, open questions only

The PO is not technical and cannot read keys. Write every question for someone who has never seen
the code, the API or the spec's numbering.

**Never in the question text:** requirement or section ids, backend ask numbers (`B12`), status or
error codes (`409`, `ORDER_ALREADY_SHIPPED`), endpoints (`/api/…`, `POST …`), field or enum names,
file or component names, or anything in backticks. Say what the person on screen sees and does.

Before writing one, check it is really a question: search the spec for every place that covers the
case. If a rule settles it, it's FE or BE work.

```markdown
## Q<n> — <the decision, as a short everyday phrase>

**The situation:** <who is doing what, in everyday words. One short paragraph.>

**What the spec says:** <the rule in plain words, or "nothing about this case", or "two things that
don't agree: … and …".>

**What the app does today:** <what the person sees right now.>

**What we need you to decide:**
1. <Option A, and what the person would see>
2. <Option B, and what the person would see>
<Recommend one if we have a view: "We suggest 1, because …">
```

One decision per question; give each option its effect on the user, not how it would be built.

**Numbering:** `Q<n>`, never reused. Keep a "next new question: Q<n>" line in the file's header and
update it when you add one. If the spec keeps its own question register, start after its last
number.

**Lifecycle** — a question stays only while it is open. When the PO answers:
1. Add the FE part of the answer as tasks in `fe-tasks.md` and build it.
2. If the answer needs backend work, write the `B<n>` **from the answer** (section 3).
3. If the answer changes or adds a rule the spec doesn't have, record the spec edit it needs (in the
   spec itself, or as a "spec text owed" item if the spec is owned elsewhere).
4. Delete the question. The answer now lives in the code, the `B<n>` and the commit message.

Self-check: read the question as the PO would. Any word that would make them ask "what does that
mean?" gets rewritten.

---

## 3. Backend and ops asks: built on the PO's answers

Each ask is a numbered `B<n>` section (`O<n>` for ops/infrastructure: keys, secrets, WAF, DNS).
Numbers are never reused. Technical detail belongs here: endpoints, fields, codes, spec ids.

**The PO answer comes first.** Before writing or updating a `B<n>`, check `po-questions.md` and recent
answers on the same topic:
- **Answered** → write the ask *from that answer*. Open with it in plain words and the date:
  `**PO answer (YYYY-MM-DD):** …`, then the ask that carries it out and nothing more. Don't re-decide
  or widen what the PO settled.
- **Question still open** → don't specify a contract that guesses the answer. Wait, or add the item
  marked `**Waiting on PO:** Q<n>` and state only what is certain.
- **No question** → the spec is the basis; cite the rule it carries out.

```markdown
## B<n> — <what is needed, short>

**PO answer (YYYY-MM-DD):** <only when the ask comes from one; the decision in plain words>
<or> **Waiting on PO:** Q<n>

<Problem: what is missing or wrong, with spec / API-guide / OpenAPI references. A repro for bugs.>

**Ask:** <the exact contract: endpoint, request and response shape, error codes, migration.>

**Today:** <what the FE does meanwhile — an honest fallback, no hacks.>

**FE follow-up when shipped:** <the FE work the delivery unlocks.>
```

**Closing:** when an item ships, move its FE follow-up into `fe-tasks.md` and build it. Once it is
built, delete the item and add its number to a single `Closed:` line at the top of the file, so the
number is never reused. Code comments cite asks as `docs/backend-tasks.md B<n>` — never a deleted
file. Before starting a new batch of asks, clear out the closed items of the previous one.

---

## Checklist per task

- [ ] Checked the spec first. FE work, BE work, or a genuine PO question?
- [ ] FE steps are in `docs/fe-tasks.md`, each removed the moment it is done; file deleted when empty.
- [ ] PO questions carry no keys or codes and follow situation → spec → today → choices.
- [ ] Every `B<n>` starts from the PO's answer when one exists, and never guesses an open question.
- [ ] Code comments cite `docs/backend-tasks.md B<n>`, never a deleted file.
