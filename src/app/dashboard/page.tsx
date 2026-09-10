"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  FolderClosed,
  HandHeart,
  Plus,
  Quote,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Avatar,
  Button,
  fieldWidth,
  LinkButton,
  Modal,
  notWired,
} from "@/components/ui";
import { useStore } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { profile, records } = useStore();
  const [recordsOpen, setRecordsOpen] = useState(false);

  return (
    <AppShell section="dashboard" rail={<DashboardRail />}>
      <div className="flex items-center gap-7">
        <Avatar
          name={`${profile.firstName} ${profile.lastName}`}
          size={86}
          status={profile.status}
          preset={profile.avatarPreset}
        />
        <h2 className="serif text-[33px] leading-tight">
          {greeting()}, {profile.firstName}
        </h2>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card
          tint="var(--tint-green)"
          icon={<Sparkles size={22} />}
          title="Care Guide"
          body="Discover a range of treatments and therapies that many people have found helpful."
          action={
            <LinkButton href="/care" variant="green">
              Browse Care Guide
            </LinkButton>
          }
        />
        <Card
          tint="var(--tint-blue)"
          icon={<HandHeart size={22} />}
          title="Support Campaign"
          body="Give your loved ones the chance to support your fertility journey financially by setting up a support campaign."
          action={
            <LinkButton href="/fundraising/new" variant="blue">
              Create a Support Campaign
            </LinkButton>
          }
        />

        <div className="lg:row-span-2">
          <div
            className="flex h-full flex-col rounded-2xl p-7"
            style={{ background: "var(--tint-pink)" }}
          >
            <div className="flex items-start gap-3.5">
              <Users size={22} className="mt-1.5" />
              <div>
                <h3 className="serif text-[24px] leading-tight">
                  Explore the Community
                </h3>
                <p className="mt-2 max-w-[300px] text-[14.5px] leading-relaxed">
                  Fertility Grove&rsquo;s community and groups are great places to
                  find support and learn from others.
                </p>
              </div>
            </div>

            <div className="mt-9 space-y-2">
              <p className="text-[15px] font-medium">Groups</p>
              <div className="flex justify-center py-2">
                <LinkButton href="/community/groups" variant="coral">
                  Explore groups
                </LinkButton>
              </div>
            </div>

            <div className="mt-10 space-y-2">
              <p className="text-[15px] font-medium">Community Discussion Board</p>
              <div className="flex justify-center py-2">
                <LinkButton href="/community/new" variant="coral">
                  Post a question
                </LinkButton>
              </div>
            </div>
          </div>
        </div>

        <Card
          tint="var(--tint-yellow)"
          icon={<BookOpen size={22} />}
          title="Learn"
          body="Explore resources to better understand your diagnosis and navigate your fertility journey with confidence."
          action={
            <LinkButton href="/learn" variant="coral">
              Explore resources
            </LinkButton>
          }
        />

        <div className="rounded-2xl bg-surface p-7">
          <div className="flex items-start gap-3.5">
            <FolderClosed size={22} className="mt-1.5" />
            <div>
              <h3 className="serif text-[24px] leading-tight">My Records</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed">
                You can keep documents and records here, all in one place, to stay
                organized.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setRecordsOpen(true)}
              className="group relative grid h-[110px] w-[152px] place-items-center rounded-xl transition hover:brightness-95"
              style={{ background: "var(--fg-yellow-soft)" }}
              aria-label="Open my records"
            >
              <span
                className="absolute left-0 top-0 h-4 w-16 rounded-tl-xl rounded-tr-lg"
                style={{ background: "var(--fg-yellow-soft)" }}
              />
              <Plus size={26} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        width={560}
        labelledBy="records-title"
      >
        <div className="flex items-start justify-between">
          <h3 id="records-title" className="serif text-[26px]">
            My Records
          </h3>
          <button onClick={() => setRecordsOpen(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="mt-1 text-[13.5px] text-muted">
          Private to you. Never shown in community or search.
        </p>
        <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
          {records.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <FolderClosed size={18} className="text-muted" />
              <span className="flex-1 text-[14px]">{r.name}</span>
              <span className="text-[12.5px] text-muted-light">{r.size}</span>
            </li>
          ))}
        </ul>
        <Button variant="quiet" className="mt-5 w-full" {...notWired}>
          <Plus size={16} /> Upload a document
        </Button>
      </Modal>
    </AppShell>
  );
}

function DashboardRail() {
  const { todos, addTodo, toggleTodo, removeTodo, quoteOfTheDay } = useStore();
  const [newTodo, setNewTodo] = useState("");
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="serif text-[22px]">To Do List</h3>
        <Button size="sm" variant="quiet" onClick={() => setAdding((v) => !v)}>
          <Plus size={15} /> Add
        </Button>
      </div>

      {adding && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTodo.trim()) return;
            addTodo(newTodo.trim());
            setNewTodo("");
            setAdding(false);
          }}
        >
          <input
            autoFocus
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs doing?"
            aria-label="New to-do"
            className={`w-full ${fieldWidth} rounded-lg border border-line-strong px-3 py-2 text-[13.5px] focus:border-green focus:outline-none`}
          />
          <Button size="sm" type="submit">
            Add
          </Button>
        </form>
      )}

      <ul className="mt-4 space-y-2.5">
        {todos.map((t) => (
          <li key={t.id} className="group flex items-start gap-2.5">
            <button
              onClick={() => toggleTodo(t.id)}
              role="checkbox"
              aria-checked={t.done}
              aria-label={t.title}
              className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-2 transition"
              style={{
                borderColor: t.done ? "#529BD7" : "#C7C7C7",
                background: t.done ? "#529BD7" : "transparent",
              }}
            >
              {t.done && (
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
                  <path
                    d="M2 6.5 4.6 9 10 3"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
            <span
              className={`flex-1 text-[13.5px] leading-snug ${
                t.done ? "text-muted-light line-through" : "text-ink"
              }`}
            >
              {t.title}
            </span>
            <button
              onClick={() => removeTodo(t.id)}
              aria-label={`Delete ${t.title}`}
              className="opacity-0 transition group-hover:opacity-100"
            >
              <Trash2 size={14} className="text-muted-light" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <h3 className="serif flex items-center gap-2 text-[22px]">
          <Quote size={18} /> Today&rsquo;s Quote
        </h3>
        <blockquote className="serif mt-4 text-center text-[17px] leading-relaxed text-ink">
          &ldquo;{quoteOfTheDay.body}&rdquo;
        </blockquote>
        {quoteOfTheDay.attribution && (
          <p className="mt-2 text-center text-[13px] text-muted">
            — {quoteOfTheDay.attribution}
          </p>
        )}
      </div>

      <div className="mt-12 rounded-xl border border-line p-4">
        <p className="text-[13.5px] font-semibold">Your profile</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Keep it current so members at your stage can find you.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-block text-[13.5px] font-medium underline underline-offset-2"
        >
          View my profile
        </Link>
      </div>
    </div>
  );
}

function Card({
  tint,
  icon,
  title,
  body,
  action,
}: {
  tint: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl p-7"
      style={{ background: tint }}
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-1.5">{icon}</span>
        <div>
          <h3 className="serif text-[24px] leading-tight">{title}</h3>
          <p className="mt-2 text-[14.5px] leading-relaxed">{body}</p>
        </div>
      </div>
      <div className="mt-auto flex justify-center pt-7">{action}</div>
    </div>
  );
}
