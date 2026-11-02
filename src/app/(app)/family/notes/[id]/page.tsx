"use client";

/* A family note: edited by both partners, every save kept as a version that
   shows who changed it and when, and any version can be restored. Notes from
   before an unlink are read-only. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { useState } from "react";
import { useUnsavedGuard } from "@/components/UnsavedGuard";
import { Button, Counter, EmptyState, Field, Input, LinkButton, Panel, Textarea, toast } from "@/components/ui";
import { MSG } from "@/lib/rules/validation";
import { act, sel, useStore } from "@/lib/store";

export default function FamilyNotePage() {
  const { id } = useParams<{ id: string }>();
  const note = useStore((s) => s.family.notes.find((n) => n.id === id));
  const partner = useStore((s) => s.partner.firstName || "Your partner");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const commit = () => {
    if (!note) return false;
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = MSG.noteTitle;
    if (!body.trim()) next.body = MSG.noteBody;
    setErrs(next);
    if (Object.keys(next).length) return false;
    act.family.editNote(note.id, title.trim(), body.trim());
    setEditing(false);
    toast("Note saved");
    return true;
  };
  const guard = useUnsavedGuard({ dirty: !!note && editing && (title !== note.title || body !== note.body), onSave: commit });

  if (!note) {
    return <EmptyState art="roots" title="This note isn't available." action={<LinkButton href="/family">Family space</LinkButton>} />;
  }
  const readOnly = !!note.past;
  const last = note.versions[0];

  return (
    <>
      <Link href="/family" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Family space
      </Link>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="p-6 sm:p-8">
          {editing ? (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                commit();
              }}
            >
              <Field label="Title" error={errs.title} counter={<Counter value={title} max={120} />}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              </Field>
              <Field label="Note" error={errs.body} counter={<Counter value={body} max={5000} />}>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} max={5000} hardStop rows={10} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button variant="ghost" onClick={() => { setEditing(false); setTitle(note.title); setBody(note.body); }}>Cancel</Button>
              </div>
              {guard.ui}
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">{note.title}</h1>
                {!readOnly && (
                  <Button variant="secondary" onClick={() => { setTitle(note.title); setBody(note.body); setEditing(true); }}>
                    Edit
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[14px] text-muted">
                {readOnly
                  ? "Read-only copy from before you unlinked."
                  : last
                    ? `Last edited by ${last.by === "me" ? "you" : partner}, ${sel.timeAgo(last.minutesAgo)} ago`.replace("just now ago", "just now")
                    : "You can both edit this note."}
              </p>
              <div className="mt-6 max-w-[66ch] space-y-3 text-[16px] leading-relaxed whitespace-pre-wrap text-ink">{note.body}</div>
            </>
          )}
        </Panel>
        <aside>
          <Panel className="p-5">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <History size={17} /> Versions
            </h2>
            {note.versions.length ? (
              <ol className="mt-3 space-y-3">
                {note.versions.map((v) => (
                  <li key={v.id} className="rounded-[14px] bg-raised p-3">
                    <p className="text-[13px] text-muted">
                      {v.by === "me" ? "You" : partner} · {sel.timeAgo(v.minutesAgo)}
                    </p>
                    <p className="mt-1 line-clamp-3 text-[14px] leading-snug text-ink-soft">{v.body}</p>
                    {!readOnly && (
                      <button type="button" className="mt-2 text-[13px] font-semibold text-accent hover:underline" onClick={() => { act.family.restore(note.id, v.id); toast("Earlier version restored"); }}>
                        Restore this version
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-[14px] text-muted">Earlier versions appear here after each edit.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
