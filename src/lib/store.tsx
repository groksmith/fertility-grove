"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  CAMPAIGNS,
  CARE_NETWORK,
  CONVERSATIONS,
  GROUPS,
  ME,
  MY_CAMPAIGN_TEMPLATE,
  POSTS,
  QUOTES,
  RECORDS,
  SAVED_VENDOR_IDS,
  TODOS,
  WISHLIST,
} from "./data";
import type {
  Campaign,
  Conversation,
  Group,
  Post,
  PostType,
  Todo,
  WishlistItem,
} from "./types";

export interface Profile {
  firstName: string;
  lastName: string;
  handle: string;
  zip: string;
  genderIdentity: string;
  pronouns: string;
  birthYear: number;
  aboutMe: string;
  email: string;
  community: string;
  stages: string[];
  diagnoses: string[];
  anonymous: boolean;
  notifications: {
    comments: boolean;
    messages: boolean;
    donations: boolean;
    digest: boolean;
  };
  avatarPreset: number;
  status: "online" | "away" | "busy" | "invisible";
}

const DEFAULT_PROFILE: Profile = {
  firstName: "Annie",
  lastName: "Williamson",
  handle: "annie1989",
  zip: "94549",
  genderIdentity: "Female",
  pronouns: "she/her",
  birthYear: 1989,
  aboutMe:
    "Hi, I'm Annie. I've been on this fertility journey for a little over a year now, and it's been full of ups and downs. I'm currently exploring IVF and trying to stay hopeful, one day at a time. I joined Fertility Grove to find connection, support, and a place where I don't have to explain everything from scratch. Outside of this, I love morning walks, strong coffee, and anything that makes me laugh.",
  email: "anniewilliamson@gmail.com",
  community: "Women's Community",
  stages: ["Pursuing treatment"],
  diagnoses: ["Unexplained"],
  anonymous: false,
  notifications: { comments: true, messages: true, donations: true, digest: false },
  avatarPreset: -1,
  status: "online",
};

interface State {
  signedIn: boolean;
  onboarded: boolean;
  profile: Profile;
  posts: Post[];
  groups: Group[];
  todos: Todo[];
  savedVendors: string[];
  careNetwork: { providerId: string; therapy: string }[];
  campaigns: Campaign[];
  myCampaign: Campaign | null;
  conversations: Conversation[];
  wishlist: WishlistItem[];
  records: typeof RECORDS;
  recommendedProviders: {
    name: string;
    category: string;
    city: string;
    state: string;
  }[];
}

interface Store extends State {
  signIn: (email?: string) => void;
  signOut: () => void;
  completeOnboarding: (p: Partial<Profile>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  addPost: (p: {
    community: string;
    groupId?: string;
    title: string;
    body: string;
    type: PostType;
    tags: string[];
  }) => Post;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  addComment: (postId: string, body: string) => void;
  toggleGroup: (id: string) => void;
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  toggleVendor: (id: string) => void;
  addToCareNetwork: (providerId: string, therapy: string) => void;
  recommendProvider: (p: { name: string; category: string; city: string; state: string }) => void;
  publishCampaign: (c: Campaign) => void;
  donate: (slug: string, amount: number, name: string, message?: string) => void;
  sendMessage: (conversationId: string, body: string) => void;
  markRead: (conversationId: string) => void;
  fulfillWishlistItem: (slug: string, id: string) => void;
  quoteOfTheDay: { body: string; attribution: string };
  reset: () => void;
}

const initialState: State = {
  signedIn: false,
  onboarded: false,
  profile: DEFAULT_PROFILE,
  posts: POSTS,
  groups: GROUPS,
  todos: TODOS,
  savedVendors: SAVED_VENDOR_IDS,
  careNetwork: CARE_NETWORK,
  campaigns: CAMPAIGNS,
  myCampaign: null,
  conversations: CONVERSATIONS,
  wishlist: WISHLIST,
  records: RECORDS,
  recommendedProviders: [],
};

const StoreContext = createContext<Store | null>(null);

const KEY = "fertility-grove-state-v1";

/* An external store keeps React out of the hydration business: the server and
   the first client render both use `initialState`, and React swaps in the
   persisted snapshot immediately after hydration. */
let current: State = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...current, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    /* prototype: a blocked or empty store just means default data */
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureLoaded();
  return current;
}

function getServerSnapshot() {
  return initialState;
}

function patch(fn: (s: State) => State) {
  ensureLoaded();
  current = fn(current);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* prototype: ignore */
  }
  listeners.forEach((l) => l());
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const api = useMemo<Store>(() => {
    return {
      ...state,
      signIn: (email) =>
        patch((s) => ({
          ...s,
          signedIn: true,
          profile: email ? { ...s.profile, email } : s.profile,
        })),
      signOut: () => patch(() => ({ ...initialState })),
      completeOnboarding: (p) =>
        patch((s) => ({
          ...s,
          signedIn: true,
          onboarded: true,
          profile: { ...s.profile, ...p },
        })),
      updateProfile: (p) =>
        patch((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      addPost: (p) => {
        const post: Post = {
          id: `p-${Date.now()}`,
          community: p.community,
          groupId: p.groupId,
          title: p.title,
          body: p.body,
          author: {
            ...ME,
            name: `${state.profile.firstName} ${state.profile.lastName}`,
            handle: `@${state.profile.handle}`,
            anonymous: state.profile.anonymous,
          },
          createdAt: "just now",
          type: p.type,
          tags: p.tags,
          likes: 0,
          comments: [],
        };
        patch((s) => ({ ...s, posts: [post, ...s.posts] }));
        return post;
      },
      toggleLike: (id) =>
        patch((s) => ({
          ...s,
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
              : p,
          ),
        })),
      toggleSave: (id) =>
        patch((s) => ({
          ...s,
          posts: s.posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)),
        })),
      addComment: (postId, body) =>
        patch((s) => ({
          ...s,
          posts: s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: `c-${Date.now()}`,
                      author: {
                        ...ME,
                        name: `${s.profile.firstName} ${s.profile.lastName}`,
                        handle: `@${s.profile.handle}`,
                        anonymous: s.profile.anonymous,
                      },
                      body,
                      createdAt: "just now",
                    },
                  ],
                }
              : p,
          ),
        })),
      toggleGroup: (id) =>
        patch((s) => ({
          ...s,
          groups: s.groups.map((g) =>
            g.id === id
              ? { ...g, joined: !g.joined, members: g.members + (g.joined ? -1 : 1) }
              : g,
          ),
        })),
      addTodo: (title) =>
        patch((s) => ({
          ...s,
          todos: [...s.todos, { id: `t-${Date.now()}`, title, done: false }],
        })),
      toggleTodo: (id) =>
        patch((s) => ({
          ...s,
          todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      removeTodo: (id) =>
        patch((s) => ({ ...s, todos: s.todos.filter((t) => t.id !== id) })),
      toggleVendor: (id) =>
        patch((s) => ({
          ...s,
          savedVendors: s.savedVendors.includes(id)
            ? s.savedVendors.filter((v) => v !== id)
            : [...s.savedVendors, id],
        })),
      addToCareNetwork: (providerId, therapy) =>
        patch((s) =>
          s.careNetwork.some((c) => c.providerId === providerId)
            ? s
            : { ...s, careNetwork: [...s.careNetwork, { providerId, therapy }] },
        ),
      recommendProvider: (p) =>
        patch((s) => ({
          ...s,
          recommendedProviders: [...s.recommendedProviders, p],
        })),
      publishCampaign: (c) =>
        patch((s) => ({
          ...s,
          myCampaign: { ...c, status: "Live" },
          campaigns: [{ ...c, status: "Live" }, ...s.campaigns],
        })),
      donate: (slug, amount, name, message) =>
        patch((s) => {
          const apply = (c: Campaign): Campaign =>
            c.slug === slug
              ? {
                  ...c,
                  raised: c.raised + amount,
                  supporters: [
                    { name, amount, message, when: "just now" },
                    ...c.supporters,
                  ],
                }
              : c;
          return {
            ...s,
            campaigns: s.campaigns.map(apply),
            myCampaign: s.myCampaign ? apply(s.myCampaign) : null,
          };
        }),
      sendMessage: (conversationId, body) =>
        patch((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  preview: `You: ${body}`,
                  time: "now",
                  messages: [
                    ...c.messages,
                    {
                      id: `m-${Date.now()}`,
                      from: "me" as const,
                      body,
                      at: "now",
                      day: "Today, March 3",
                    },
                  ],
                }
              : c,
          ),
        })),
      markRead: (conversationId) =>
        patch((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unread: false } : c,
          ),
        })),
      fulfillWishlistItem: (slug, id) =>
        patch((s) => {
          const bump = (c: Campaign): Campaign =>
            c.slug === slug
              ? {
                  ...c,
                  wishlist: c.wishlist.map((w) =>
                    w.id === id && w.fulfilled < w.wanted
                      ? { ...w, fulfilled: w.fulfilled + 1 }
                      : w,
                  ),
                }
              : c;
          return {
            ...s,
            campaigns: s.campaigns.map(bump),
            myCampaign: s.myCampaign ? bump(s.myCampaign) : null,
          };
        }),
      quoteOfTheDay: QUOTES[new Date().getDate() % QUOTES.length],
      reset: () => {
        try {
          window.localStorage.removeItem(KEY);
        } catch {
          /* prototype: ignore */
        }
        patch(() => ({ ...initialState }));
      },
    };
  }, [state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

const noopSubscribe = () => () => {};

/** True only after hydration — the first client render still uses the server
 *  snapshot, so anything that redirects must wait for this. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { MY_CAMPAIGN_TEMPLATE, DEFAULT_PROFILE };
