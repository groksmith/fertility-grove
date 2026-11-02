"use client";

/* One appointment list: questions grouped by topic, editable, reorderable,
   and ready to copy, print, share, or share with a linked partner. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Pencil, Plus, Printer, Share2, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useUnsavedGuard } from "@/components/UnsavedGuard";
import { Button, Choices, Counter, Dialog, EmptyState, Field, IconButton, Input, LinkButton, Panel, Textarea, toast, useCopy } from "@/components/ui";
import { act, useStore } from "@/lib/store";
import type { AppointmentQuestion } from "@/lib/types";

const AI_LABEL = "AI, not a doctor. Check with your doctor before acting on this.";

export default function AppointmentListPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const list = useStore((s) => s.appointmentLists.find((l) => l.id === id));
  const partner = useStore((s) => s.partner);
  const [, copy] = useCopy();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [share, setShare] = useState(false);
  const [access, setAccess] = useState<("View" | "Edit")[]>(["View"]);
  // A question being edited, or a new one typed but not added.
  const editingQ = list?.questions.find((q) => q.id === editing);
  const commitEdit = () => {
    if (!list || !editingQ || !draft.trim()) return false;
    act.guide.updateList(list.id, list.questions.map((x) => (x.id === editingQ.id ? { ...x, text: draft.trim() } : x)));
    setEditing(null);
    return true;
  };
  const guard = useUnsavedGuard({
    dirty: (!!editingQ && draft.trim() !== editingQ.text) || (adding && !!newQ.trim()),
    onSave: editingQ ? commitEdit : undefined,
  });

  if (!list) {
    return <EmptyState art="bookmark" title="This list isn't available." action={<LinkButton href="/guide/appointments">Back to your lists</LinkButton>} />;
  }

  const qs = list.questions;
  const save = (next: AppointmentQuestion[]) => act.guide.updateList(list.id, next);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    const next = [...qs];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };
  const asText = () =>
    `${list.type}${list.date ? ` · ${list.date}` : ""}\n\n${qs.map((q, i) => `${i + 1}. ${q.text}`).join("\n")}\n\n${AI_LABEL}`;

  const topics = Array.from(new Set(qs.map((q) => q.topic)));
  const dateLabel = list.date ? new Date(`${list.date}T12:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "No date set";

  return (
    <>
      <Link href="/guide/appointments" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink print:hidden">
        <ArrowLeft size={16} /> Appointment questions
      </Link>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">{list.type}</h1>
          <p className="tabular mt-2 text-[15px] text-ink-soft">
            {dateLabel} · {qs.length} questions in {topics.length} topics
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={() => { copy(asText()); toast("List copied"); }}>
            <Copy size={16} /> Copy
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print or save as PDF
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ title: list.type, text: asText() });
                else {
                  copy(asText());
                  toast("Sharing isn't available here, so we copied the list");
                }
              } catch {
                /* the member closed the share sheet */
              }
            }}
          >
            <Share2 size={16} /> Share
          </Button>
          <Button onClick={() => setShare(true)}>
            <Users size={16} /> Share with partner
          </Button>
        </div>
      </header>

      <Panel className="p-5 sm:p-7">
        {topics.map((t) => (
          <section key={t} className="mb-7 last:mb-0">
            <h2 className="mb-3 text-[17px] font-semibold">{t}</h2>
            <ol className="space-y-2">
              {qs.map((q, i) =>
                q.topic !== t ? null : (
                  <li key={q.id} className="flex items-start gap-3 rounded-[14px] bg-raised px-4 py-3">
                    <span className="tabular mt-0.5 w-6 shrink-0 text-[14px] font-semibold text-muted">{i + 1}.</span>
                    {editing === q.id ? (
                      <form
                        className="flex-1 space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!draft.trim()) return;
                          save(qs.map((x) => (x.id === q.id ? { ...x, text: draft.trim() } : x)));
                          setEditing(null);
                        }}
                      >
                        <Field label="Question" counter={<Counter value={draft} max={300} />}>
                          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} max={300} hardStop rows={2} autoFocus />
                        </Field>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="flex-1 text-[15px] leading-relaxed text-ink">{q.text}</p>
                        <span className="flex shrink-0 print:hidden">
                          <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={16} /></IconButton>
                          <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === qs.length - 1}><ArrowDown size={16} /></IconButton>
                          <IconButton label="Edit question" onClick={() => { setEditing(q.id); setDraft(q.text); }}><Pencil size={16} /></IconButton>
                          <IconButton label="Delete question" onClick={() => save(qs.filter((x) => x.id !== q.id))}><Trash2 size={16} /></IconButton>
                        </span>
                      </>
                    )}
                  </li>
                ),
              )}
            </ol>
          </section>
        ))}

        <div className="mt-6 print:hidden">
          {adding ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newQ.trim()) return;
                save([...qs, { id: `aq-${Date.now()}`, topic: "My own questions", text: newQ.trim() }]);
                setNewQ("");
                setAdding(false);
              }}
            >
              <Field label="Your question" counter={<Counter value={newQ} max={300} />}>
                <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} maxLength={300} autoFocus />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <Button variant="quiet" onClick={() => setAdding(true)} disabled={qs.length >= 30}>
              <Plus size={16} /> Add a question
            </Button>
          )}
          {qs.length >= 30 && <p className="mt-2 text-[13px] text-muted">A list holds up to 30 questions.</p>}
        </div>
        <p className="mt-6 text-[13px] font-semibold text-blue-ink">{AI_LABEL}</p>
      </Panel>

      <div className="mt-4 flex justify-end print:hidden">
        <Button
          variant="ghost"
          onClick={() => {
            act.guide.deleteList(list.id);
            router.push("/guide/appointments");
            toast("List deleted");
          }}
        >
          <Trash2 size={16} /> Delete list
        </Button>
      </div>

      <Dialog open={share} onClose={() => setShare(false)} title="Share with your partner">
        {partner.linked ? (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const a = access[0] === "Edit" ? "edit" : "view";
              act.family.share({ kind: "appointment-list", refId: list.id, title: `${list.type} questions`, access: a });
              setShare(false);
              toast(`Shared with ${partner.firstName}`);
            }}
          >
            <Choices legend={`What can ${partner.firstName} do?`} options={["View", "Edit"] as const} value={access} onChange={setAccess} columns={2} />
            <Button type="submit">Share</Button>
          </form>
        ) : (
          <div>
            <p className="text-[15px] leading-relaxed text-ink-soft">
              Once your partner joins with their own private account, you can share question lists with them in your family space.
            </p>
            <LinkButton href="/family" className="mt-5">Invite your partner</LinkButton>
          </div>
        )}
      </Dialog>
      {guard.ui}
    </>
  );
}
