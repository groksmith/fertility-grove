"use client";

/* Saved: posts, stories and Learn articles, private to the member, to find
   again before an appointment. One list with type tabs; beside it, what to do
   with what you've saved (a question list, your partner), and while the list
   is short, a few reviewed articles worth saving. Removing folds an item away;
   anything newly saved rises into place. */

import Image from "next/image";
import Link from "next/link";
import { Bookmark, ClipboardList, Lock, UsersRound } from "lucide-react";
import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { EmptyState, LinkButton, Name, PageHeader, Panel, Tabs, TypeChip, toast } from "@/components/ui";
import { ARTICLES, articleCover } from "@/lib/data/articles";
import { act, sel, useStore } from "@/lib/store";
import type { Article } from "@/lib/types";

type Kind = "all" | "posts" | "stories" | "articles";

/** Folds an item away before it leaves the list, then runs the removal. */
function useFoldAway() {
  const [leaving, setLeaving] = useState<string[]>([]);
  const fold = (key: string, remove: () => void, message: string) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      remove();
      toast(message);
      return;
    }
    setLeaving((l) => [...l, key]);
    window.setTimeout(() => {
      remove();
      setLeaving((l) => l.filter((k) => k !== key));
      toast(message);
    }, 240);
  };
  return { leaving, fold };
}

function SaveButton({ saved, onClick, label }: { saved: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={saved}
      className="bookmark-pop press grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-raised"
    >
      <Bookmark size={18} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

function ArticleRow({ a, onRemove }: { a: Article; onRemove: () => void }) {
  return (
    <Panel className="flex items-center gap-4 p-3 pr-4 sm:gap-5">
      <Link href={`/learn/${a.slug}`} tabIndex={-1} aria-hidden className="relative block aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-[12px] sm:w-40">
        <Image src={articleCover(a.slug)} alt="" fill sizes="160px" quality={90} className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-muted">Article · {a.readMinutes} min read</p>
        <Link href={`/learn/${a.slug}`} className="mt-0.5 block text-[16px] leading-snug font-semibold text-ink hover:underline">
          {a.title}
        </Link>
        <p className="mt-1 hidden text-[14px] leading-relaxed text-ink-soft sm:line-clamp-1">{a.summary}</p>
      </div>
      <SaveButton saved onClick={onRemove} label={`Remove ${a.title} from saved`} />
    </Panel>
  );
}

export default function SavedPage() {
  const s = useStore();
  const { posts, stories, articles } = sel.savedItems(s);
  const [kind, setKind] = useState<Kind>("all");
  const { leaving, fold } = useFoldAway();
  // Items present when the page opened stay still; only new ones rise in.
  const keys = [...posts.map((p) => `p:${p.id}`), ...stories.map((x) => `s:${x.id}`), ...articles.map((a) => `a:${a!.slug}`)];
  const [first] = useState(() => new Set(keys));
  const rise = (key: string) => (first.has(key) ? "" : "rise");
  const fade = (key: string) => (leaving.includes(key) ? "is-leaving" : "");

  const total = keys.length;
  const show = (k: Exclude<Kind, "all">) => kind === "all" || kind === k;

  // While the list is short, offer reviewed articles matched to the member.
  const suggestions = ARTICLES.filter((a) => !s.savedArticles.includes(a.slug))
    .sort((a, b) => Number(b.diagnoses.some((d) => s.me.diagnoses.includes(d))) - Number(a.diagnoses.some((d) => s.me.diagnoses.includes(d))))
    .slice(0, 3);

  const lists = s.appointmentLists.length;
  const empty =
    (kind === "posts" && !posts.length) || (kind === "stories" && !stories.length) || (kind === "articles" && !articles.length);

  return (
    <>
      <PageHeader
        title="Saved"
        lede={total ? `${sel.plural(total, "saved item")} to bring to your next appointment.` : "Keep posts, stories and articles here to find again before your next appointment."}
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {total === 0 ? (
            <EmptyState
              art="bookmark"
              title="Nothing saved yet."
              body="Tap the bookmark on any post, story or article and it waits for you here."
              action={<LinkButton href="/learn" variant="secondary">Browse Learn</LinkButton>}
            />
          ) : (
            <>
              <Tabs
                label="Saved items"
                value={kind}
                onChange={setKind}
                tabs={[
                  { id: "all", label: "All" },
                  { id: "posts", label: "Posts", count: posts.length },
                  { id: "stories", label: "Stories", count: stories.length },
                  { id: "articles", label: "Articles", count: articles.length },
                ]}
              />
              <ul className="mt-5 space-y-3">
                {show("articles") &&
                  articles.map((a) => {
                    const k = `a:${a!.slug}`;
                    return (
                      <li key={k} className={`fold ${rise(k)} ${fade(k)}`}>
                        <div className="fold-inner">
                          <ArticleRow a={a!} onRemove={() => fold(k, () => act.settings.saveArticle(a!.slug), "Removed from saved")} />
                        </div>
                      </li>
                    );
                  })}
                {show("posts") &&
                  posts.map((p) => {
                    const k = `p:${p.id}`;
                    return (
                      <li key={k} className={`fold ${rise(k)} ${fade(k)}`}>
                        <div className="fold-inner">
                          <PostCard post={p} />
                        </div>
                      </li>
                    );
                  })}
                {show("stories") &&
                  stories.map((x) => {
                    const k = `s:${x.id}`;
                    const author = sel.person(s, x.authorId);
                    return (
                      <li key={k} className={`fold ${rise(k)} ${fade(k)}`}>
                        <div className="fold-inner">
                          <Panel className="flex items-start gap-4 p-5">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                                <TypeChip type={x.type} />
                                {author && <Name member={author} pronouns={false} />}
                              </div>
                              <Link href="/stories" className="mt-2 block text-[16px] leading-snug font-semibold text-ink hover:underline">
                                {x.title}
                              </Link>
                              <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">{x.body}</p>
                            </div>
                            <SaveButton saved onClick={() => fold(k, () => act.stories.toggleSave(x.id), "Removed from saved")} label={`Remove ${x.title} from saved`} />
                          </Panel>
                        </div>
                      </li>
                    );
                  })}
              </ul>
              {empty && (
                <p className="mt-6 rounded-[20px] border border-dashed border-line-strong p-6 text-center text-[15px] text-muted">
                  No saved {kind} yet. Tap the bookmark on one and it shows up here.
                </p>
              )}
            </>
          )}

          {total < 4 && suggestions.length > 0 && (
            <section aria-labelledby="worth-h" className="mt-12">
              <h2 id="worth-h" className="text-[18px] font-semibold text-ink">Worth saving</h2>
              <p className="mt-1 text-[14px] text-muted">Clinician-reviewed, and matched to your journey where we can.</p>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {suggestions.map((a) => (
                  <li key={a.slug} className="flex">
                    <div className="group flex w-full flex-col overflow-hidden rounded-[20px] border border-line bg-panel">
                      <Link href={`/learn/${a.slug}`} tabIndex={-1} aria-hidden className="relative block aspect-[16/9] overflow-hidden">
                        <Image src={articleCover(a.slug)} alt="" fill sizes="(min-width: 1024px) 240px, 100vw" quality={90} className="object-cover transition-transform duration-300 ease-[var(--e-out)] group-hover:scale-[1.03]" />
                      </Link>
                      <div className="flex flex-1 items-start gap-2 p-4">
                        <Link href={`/learn/${a.slug}`} className="min-w-0 flex-1 text-[15px] leading-snug font-semibold text-ink hover:underline">
                          {a.title}
                        </Link>
                        <SaveButton
                          saved={false}
                          onClick={() => {
                            act.settings.saveArticle(a.slug);
                            toast("Saved");
                          }}
                          label={`Save ${a.title}`}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
          <Panel className="p-5">
            <h2 className="text-[16px] font-semibold text-ink">Before your appointment</h2>
            <ul className="mt-3 space-y-1">
              <li>
                <Link href="/guide/appointments" className="press -mx-2 flex items-start gap-3 rounded-[14px] p-2 hover:bg-raised">
                  <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-yellow-tint text-ink">
                    <ClipboardList size={18} strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{lists ? "Your question lists" : "Make a question list"}</span>
                    <span className="block text-[13px] text-muted">
                      {lists ? sel.plural(lists, "list") + " ready to print or share" : "The Guide drafts questions to bring, from what you've read"}
                    </span>
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/family" className="press -mx-2 flex items-start gap-3 rounded-[14px] p-2 hover:bg-raised">
                  <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-pink-tint text-ink">
                    <UsersRound size={18} strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{s.partner.linked ? `Share with ${s.partner.firstName}` : "Share with your partner"}</span>
                    <span className="block text-[13px] text-muted">
                      {s.partner.linked ? "Put an article in your family space" : "Invite them to a family space you both choose"}
                    </span>
                  </span>
                </Link>
              </li>
            </ul>
          </Panel>
          <p className="flex items-start gap-2 px-1 text-[13px] leading-relaxed text-muted">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
            Only you can see what you save.
          </p>
        </aside>
      </div>
    </>
  );
}
