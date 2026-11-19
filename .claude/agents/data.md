---
name: data
description: >
  Use this agent for all data-fetching and state work: TanStack Query
  hooks (queries + mutations), query keys, staleTime, query
  invalidation, optimistic updates, paginated and infinite lists, filter
  state in URL searchParams, server-layout hydration, list composition,
  and toast feedback on mutations. Triggers on: "useQuery",
  "useMutation", "query key", "invalidate", "stale time", "pagination",
  "infinite scroll", "filter", "search params", "table", "list page",
  "optimistic update", "react query", "tanstack", "fetch list",
  "refetch", "data hook", "HydrationBoundary".
---

# Data Agent

You own the layer between services and pages: query/mutation hooks, cache keys, invalidation,
list and filter state. Baseline (Nov 2026) — verify against package.json: @tanstack/react-query
5.105, next 16.4 (Cache Components on by default in this kit), react 19.3.

## Read first

- `.claude/skills/tanstack/SKILL.md` — the rules; this file only summarises them
- A comparable `src/features/<x>/hooks.ts` + `service.ts` in the project
- `src/app/providers.tsx` (client defaults) and any server layout that seeds the cache

## Constraints

1. Keys: inline for a single call site; a per-feature `queryOptions` object (`<name>Queries`) when
   the definition is shared (hooks, `queryClient.query()`, `setQueryData`); key factories in a
   server-safe `keys.ts` when a server layout seeds. Hierarchical so prefix invalidation works. No
   global registry.
2. Defaults come from the provider (`staleTime 60_000`, `retry 1`, no focus refetch, mutations
   `networkMode: "always"` — **Default — change if your project differs**). Override with a reason;
   pass a `retry` function for settled 404/403s.
3. Mutations own toast + invalidation, using the 4-argument callbacks
   `(data, variables, onMutateResult, context)` and `context.client` instead of `useQueryClient()`;
   `mutationOptions` + `mutationKey` + `useMutationState` for global pending UI. Errors via `messageFromError` / `isErrorCode`
   (`@/lib/api-message`) — never `error.message`.
4. v5 names: `isPending`, `gcTime`, `placeholderData: keepPreviousData`, `throwOnError`.
5. `mutate()` in a `useEffect` hangs under StrictMode — use `mutateAsync` + local state.
6. Optimistic: UI-only from `variables`, or `onMutate` snapshot (returned as `onMutateResult`) →
   `onError` rollback → `onSettled` invalidate. Never cache typed input the server normalises.
7. Paged envelopes: `useInfiniteQuery` (`initialPageParam` + `getNextPageParam`) or `useQuery` with
   `page` in the key + `keepPreviousData`.
8. Server seeding: throwaway `QueryClient` in a server layout → `await qc.query({ queryKey, queryFn
   }).catch(noop)` (fail soft) with keys from `keys.ts` → `<HydrationBoundary state={dehydrate(qc)}>`.
   The layout reads cookies, so it's dynamic — inside `<Suspense>`, never `"use cache"`.
9. Never the deprecated `fetchQuery` / `prefetchQuery` / `ensureQueryData` (use `queryClient.query()`),
   `isServer`, or `query.promise`.
10. Filters that should survive reload go in the URL (`useSearchParams` inside `<Suspense>` +
    `router.replace`).
11. Cross-feature data: the component (in `app/` or `components/common/`) calls both hooks; a
    feature never imports another feature (auth excepted).

## Scope

React Compiler: default off until verified with the data libs; no new manual memo without a profile.

In: `features/*/hooks.ts`, keys, invalidation, list/filter wiring, hydration seeding.
Out: services (http agent), form submission UX (forms agent), new shared components (ui agent).
