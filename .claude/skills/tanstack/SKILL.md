---
name: tanstack
description: TanStack Query 5.105 conventions for a Next.js 16 App Router app — client defaults, query keys (inline vs per-feature queryOptions), queries, mutations with toast + invalidation in the hook (4-argument callbacks with context.client), mutationOptions + useMutationState for global pending UI, optimistic updates, dependent queries and parallelising sequential ones (diagnosing slowness is `perf`), pagination and infinite queries, seeding the cache from a server layout with queryClient.query(), URL filter state under Cache Components, the 5.102 deprecations, and the StrictMode mutate-in-effect pitfall. Use when writing or reviewing useQuery/useMutation hooks, keys, invalidation or list pages.
argument-hint: "[query | mutation | keys | invalidation | optimistic | infinite | hydration | filter]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# TanStack Query

Baseline (Nov 2026) — verify against package.json: `@tanstack/react-query` 5.105, `sonner` 2.0,
next 16.4, react 19.3. Hooks live in `src/features/<name>/hooks.ts` (`"use client"`) and call the
feature's service (http skill).

## 1. Client setup — `src/app/providers.tsx`

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { networkMode: "always" },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);   // one per browser session, never per render
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**Default — change if your project differs:**

| Default | Value | Why |
|---|---|---|
| `queries.staleTime` | `60_000` | avoids refetch storms on mount; restate per hook only when deliberately different |
| `queries.retry` | `1` | mutations never retry |
| `queries.refetchOnWindowFocus` | `false` | opt back in per query that must stay live |
| `mutations.networkMode` | `"always"` | an offline save fails at once with `NetworkError` instead of pausing and replaying silently later |

**Devtools are optional.** If you add `@tanstack/react-query-devtools`, render `<ReactQueryDevtools />`
inside the provider; it renders `null` unless `NODE_ENV === "development"`.

`staleTime: "static"` marks data that never goes stale (reference lists that only change on deploy).

## 2. Query keys and `queryOptions`

No global key registry. Two forms:

- **Inline** `useQuery({ queryKey: ["projects", "stats"], queryFn })` — for a query used by one hook
  and never read or invalidated by exact key elsewhere.
- **Per-feature `queryOptions`** when the same definition is used in more than one place (a hook, a
  `queryClient.query()` call, `setQueryData`, an invalidation). One object per feature at the top of
  `hooks.ts`; the key, the `queryFn` and the data type travel together, so `getQueryData` and
  `setQueryData` are typed:

```typescript
import { queryOptions, skipToken } from "@tanstack/react-query";

export const projectQueries = {
  all: ["projects"] as const,
  list: (filter: ProjectFilter = {}) =>
    queryOptions({ queryKey: ["projects", "list", filter], queryFn: () => projectService.list(filter) }),
  detail: (id: string | undefined) =>
    queryOptions({
      queryKey: ["projects", "detail", id],
      queryFn: id ? () => projectService.get(id) : skipToken,     // disabled until there's an id
    }),
};
```

A **server layout** that seeds the cache can't import `hooks.ts` (client module, client `queryFn`).
Put the bare key factories in a server-safe `keys.ts` leaf and build `projectQueries` from them, so
server and client agree on the key exactly (§5).

Rules:
- Every variable the `queryFn` reads is in the key.
- Hierarchical, broad → narrow (`["projects"]` → `["projects", "detail", id]`), so
  `invalidateQueries({ queryKey: projectQueries.all })` refreshes the family by prefix.
- Filter objects go in the key as-is (hashed, order-insensitive); turn `""` into `undefined`.
- First segment = the feature name, so features never collide.

## 3. Queries

```typescript
export function useProject(id: string | undefined) {
  return useQuery({
    ...projectQueries.detail(id),
    retry: (count, error) =>
      error instanceof ApiRequestError && [403, 404].includes(error.status) ? false : count < 1,
  });
}
```

- Optional / dependent queries: `skipToken` in the `queryFn` (typed, no `id as string`), or
  `enabled: Boolean(x)`.
- Settled answers (404, 403) should not retry — pass a `retry` function.
- `select` to derive; don't reshape in the service.
- v5 names: `isPending` (no data yet), `isLoading` (= `isPending && isFetching`), `isFetching`,
  `gcTime`, `placeholderData: keepPreviousData`, `throwOnError`. Pages render `<Skeleton>` while
  `isPending`.
- Several reads one component needs: `useQueries`, or `Promise.all` inside one `queryFn`.
- **Suspense:** `useSuspenseQuery` under an error boundary + `QueryErrorResetBoundary`. The
  render-time prefetch path (`experimental_prefetchInRender` + `use(query.promise)`) was removed in
  5.102 — don't use it.

### Imperative reads — `queryClient.query()` (5.102+)

`queryClient.query(options)` / `queryClient.infiniteQuery(options)` replace the older imperative
reads, which are `@deprecated` and go in the next major:

| Was (deprecated) | Now |
|---|---|
| `fetchQuery(opts)` | `query(opts)` |
| `prefetchQuery(opts)` | `query(opts).catch(noop)` |
| `ensureQueryData(opts)` | `query({ ...opts, staleTime: "static" })` |
| `fetchInfiniteQuery` / `prefetchInfiniteQuery` / `ensureInfiniteQueryData` | `infiniteQuery(…)` with the same mapping |

Use them for hover/intent prefetch (`queryClient.query(projectQueries.detail(id)).catch(noop)`),
reads inside an event handler, and server seeding. `usePrefetchQuery` still exists for prefetch
during render.

### Infinite / paged lists

```typescript
export function useProjectActivity(id: string) {
  return useInfiniteQuery({
    queryKey: ["projects", "activity", id],
    queryFn: ({ pageParam }) => projectService.activity(id, { page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined,
    select: (data) => data.pages.flatMap((p) => p.items),
  });
}
```

For numbered pages use `useQuery` with `page` in the key and `placeholderData: keepPreviousData`.
Share an infinite definition with `infiniteQueryOptions` the same way as `queryOptions`.

## 4. Mutations

Callbacks take **four** arguments: `onSuccess(data, variables, onMutateResult, context)`,
`onError(error, variables, onMutateResult, context)`,
`onSettled(data, error, variables, onMutateResult, context)`; `onMutate(variables, context)` and
`mutationFn(variables, context)` get the context too. `context.client` is the `QueryClient` — no
`useQueryClient()` needed in the hook. (The third argument was called `context` in older v5 docs;
the generic is now `TOnMutateResult`.)

```typescript
export function useCreateProject() {
  return useMutation({
    mutationFn: (input: CreateProjectPayload) => projectService.create(input),
    onSuccess: (project, _vars, _result, { client }) => {
      toast.success(`${project.name} created.`);
      return client.invalidateQueries({ queryKey: projectQueries.all });
    },
    onError: (error) => toast.error(messageFromError(error, "Couldn't create that project.")),
  });
}
```

- Toast + invalidation live **in the hook**, never in the component. Callers pass
  `mutate(vars, { onSuccess, onError })` only for navigation, form reset, closing a dialog, or
  field-error mapping (forms skill §4).
- One hook per operation (`useCreateProject`, `useRemoveProject`).
- Errors via `messageFromError(error, fallback)` / `isErrorCode` from `@/lib/api-message` (http skill
  §6). Never `toast.error(error.message)`.
- Copy: a short sentence ending in a full stop — "Project removed.", "Couldn't save changes."
- State: `isPending` (disable the button), `isError`, `variables`, `reset()`.
- Prefix invalidation, not `exact: true`. After a role/plan change also invalidate the session key
  exported by `features/auth` (the one sanctioned cross-feature import).
- `variables` is optional on `mutate()` when the mutation takes none (`undefined extends TVariables`).

### Shared mutation definitions — `mutationOptions`

When something outside the form needs to know a save is running (a global "Saving…" pill, a nav
guard), give the mutation a `mutationKey` via `mutationOptions` and read it with `useMutationState`:

```typescript
export const projectMutations = {
  update: (id: string) =>
    mutationOptions({
      mutationKey: ["projects", "update", id],
      mutationFn: (input: UpdateProjectInput) => projectService.update(id, input),
    }),
};

export function useUpdateProject(id: string) {
  return useMutation({
    ...projectMutations.update(id),
    onSuccess: (_data, _vars, _result, { client }) => {
      toast.success("Changes saved.");
      return client.invalidateQueries({ queryKey: projectQueries.all });
    },
    onError: (error) => toast.error(messageFromError(error, "Couldn't save changes.")),
  });
}

// anywhere: is any project save in flight?
const saving = useMutationState({ filters: { mutationKey: ["projects"], status: "pending" } }).length > 0;
```

### StrictMode pitfall — mutate in an effect

A mutation fired from `useEffect` (accept an invite token, confirm an email link) must use
`mutateAsync` + local state. With `mutate()`, StrictMode's mount → unmount → mount in dev drops the
observer the callbacks were attached to, and the page's loader never resolves. React 19.3 also
double-invokes effects during hydration in Strict Mode, and with Cache Components a hidden route's
effects re-run when you navigate back — the `started` ref (component state survives) is what keeps
it to one call.

```tsx
const accept = useAcceptInvite();
const [state, setState] = useState<"pending" | "done" | "failed">("pending");
const started = useRef(false);
useEffect(() => {
  if (started.current) return;
  started.current = true;
  accept.mutateAsync(token).then(() => setState("done"), () => setState("failed"));
}, [accept, token]);
```

### Optimistic updates

Default is wait-then-invalidate. Two accepted optimistic forms:

- **UI-only:** render from `mutation.variables` while `isPending` — no cache writes.
- **Cache:** snapshot, write, roll back, re-sync. `onMutate`'s return value arrives as the third
  callback argument:

```typescript
useMutation({
  mutationFn: projectService.setStatus,
  onMutate: async ({ id, status }, { client }) => {
    await client.cancelQueries({ queryKey: projectQueries.all });
    const snapshot = client.getQueriesData<Project[]>({ queryKey: projectQueries.all });
    client.setQueriesData<Project[]>({ queryKey: projectQueries.all }, (rows) =>
      rows?.map((p) => (p.id === id ? { ...p, status } : p)),
    );
    return { snapshot };
  },
  onError: (error, _vars, result, { client }) => {
    for (const [key, data] of result?.snapshot ?? []) client.setQueryData(key, data);
    toast.error(messageFromError(error, "Couldn't update the status."));
  },
  onSettled: (_d, _e, _v, _r, { client }) => client.invalidateQueries({ queryKey: projectQueries.all }),
});
```

Never optimistically write *typed input* for a value the server normalises (trimmed, sanitised,
formatted) — show the saved value.

## 5. Seeding from a server layout — `HydrationBoundary`

A server layout that reads data (through a feature's `server.ts`, http skill §4) hands it to the
client cache so the first client render doesn't refetch:

```tsx
// src/app/(dashboard)/projects/layout.tsx — Server Component
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getProjects } from "@/features/projects/server";     // throws ApiRequestError on failure
import { projectKeys } from "@/features/projects/keys";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();                                 // throwaway, per request
  await qc.query({ queryKey: projectKeys.list(), queryFn: () => getProjects() }).catch(() => {});  // fail soft
  return <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>;
}
```

- Fail soft: a failed read is caught, only successful queries are dehydrated by default, and the
  client hook fetches on mount. If the layout already has the data for another reason,
  `qc.setQueryData(key, data)` is fine too.
- Keys come from the server-safe `keys.ts` leaf (the client's `projectQueries.list()` uses the same
  factory, with the same default filter), so server and client agree exactly. Never import the
  feature barrel (it carries client hooks) into a server file.
- The layout reads the session cookie → it is **dynamic**. With Cache Components on, it renders
  inside a `<Suspense>` boundary (perf skill); never wrap it in `"use cache"`.
- Browser-only values (local dates, `window`) render after hydration to avoid mismatches.
- Don't use the deprecated `isServer` export; if you need the check, `environmentManager.isServer()`.

## 6. Filter / list state

- Filters that should survive reload or be shareable go in the URL (`useSearchParams` +
  `router.replace(url, { scroll: false })`); transient ones in `useState`. With Cache Components,
  a component calling `useSearchParams` must sit inside `<Suspense>`.
- Debounced search: two states (`searchInput` bound to the input, `search` in the key), ~300 ms.
- shadcn `Select` can't hold `""` — use a sentinel like `"__all__"` for "All".
- Lists: `isPending` → skeleton, empty → an `EmptyState` (or the shadcn `empty` primitive if the
  project adopted it), else map the rows.

Waterfalls, prefetching strategy and RSC boundaries: perf skill.

## 7. React Compiler

**Default off** in this kit until the form/data libraries are verified with it — check the TanStack
Query and react-hook-form release notes before enabling `reactCompiler`. Either way, don't wrap
hook results in new `useMemo` / `useCallback` / `React.memo` without a profile; `select` and
`useMutationState`'s `select` are the tools for narrowing re-renders.

## Anti-patterns

| Wrong | Right |
|---|---|
| `toast` / `invalidateQueries` in a component | In the mutation hook |
| `new QueryClient()` in a client component body | Provider's `useState(createQueryClient)` (server seeding uses a throwaway one) |
| Variable used in `queryFn` but missing from the key | Put it in the key |
| `fetchQuery` / `prefetchQuery` / `ensureQueryData` in new code (deprecated in 5.102) | `queryClient.query()` per the table in §3 |
| `use(query.promise)`, `experimental_prefetchInRender`, `isServer` | `useSuspenseQuery`; `environmentManager.isServer()` |
| `useQueryClient()` only to invalidate in callbacks | `context.client` (4th callback argument) |
| Reading `onMutate`'s return from the 3rd arg as "context" with a client inside | 3rd = `onMutateResult`, 4th = `{ client, meta, mutationKey }` |
| `cacheTime`, `keepPreviousData: true`, `useErrorBoundary`, `isLoading` on a mutation | `gcTime`, `placeholderData: keepPreviousData`, `throwOnError`, `isPending` |
| `mutate()` inside `useEffect` | `mutateAsync` + local state |
| `toast.error(error.message)` | `messageFromError(error, fallback)` |
| `exact: true` invalidation after a mutation | Prefix invalidation |
| A global query-key factory file | Inline keys; per-feature `queryOptions` / `keys.ts` when shared |
| SWR / Redux for server state | TanStack Query |
