---
name: scaffold
description: Scaffold a new feature module in a Next.js 16 App Router app — src/features/<name>/ with schema.ts (Zod 4), types.ts, service.ts, hooks.ts (TanStack Query 5.105 queryOptions + 4-argument mutation callbacks) and a named-export index.ts barrel, plus Vitest 5 tests and the guard check. Use when adding a new resource/domain module or asked to "scaffold", "create module" or "new feature".
argument-hint: "[feature-name]"
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Scaffold Feature Module

Baseline (Nov 2026) — verify against package.json: @tanstack/react-query 5.105, zod 4.6,
react-hook-form 7.91 + @hookform/resolvers 7, vitest 5, typescript 7.0.

Creates `src/features/<name>/` in the five-file shape. If the project already has modules, copy the
conventions of a recent small one rather than inventing. No `actions.ts`, no server actions:
mutations go hook → service.

```
src/features/<name>/
├── schema.ts     # Zod 4 request/form schemas + z.infer types
├── types.ts      # hand-written response interfaces (match the API spec)
├── service.ts    # export const <name>Service = { … } on httpClient
├── hooks.ts      # "use client"; <name>Queries (queryOptions) + useQuery / useMutation hooks
├── index.ts      # barrel — NAMED re-exports
└── *.test.ts(x)  # schema.test.ts, service.test.ts, hooks.test.tsx
```

Add a single-purpose helper only when needed, named for its job: `keys.ts` (shared query keys),
`server.ts` (server reads on `serverHttpClient`), `state.ts` (pure derivations a server layout
needs), `validation.ts`. `server` / `keys` / `state` are the only files other layers may import past
the barrel (server layouts); keep them free of client hooks and `"use client"`.

## Generator steps

1. **Name** — plural, kebab-case resource (`projects`, `invoices`); service object `projectService`,
   hooks `useProjects` / `useCreateProject`.
2. **Read the endpoint(s)** in `the OpenAPI spec (not yet available)`: paths, bodies, responses, error codes, enum values.
3. **Write the five files** (worked example below), then tests.
4. **Wire a page** in `src/app/(dashboard)/<route>/page.tsx` that imports only from
   `@/features/<name>`; add a nav entry in `src/config/navigation.ts` if it has one.
5. **Validate** by exit code:
   ```bash
   yarn format && yarn typecheck && yarn lint && yarn test src/features/<name>
   yarn vitest run src/architecture.test.ts      # dependency rules
   ```
6. A new convention → update the matching skill.

## Worked example — `features/projects`

### `schema.ts`

```typescript
import { z } from "zod";

export const ProjectStatus = z.enum(["Draft", "Active", "Archived"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Required").max(200),
  description: z.string().max(1000).optional(),
  status: ProjectStatus,
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type CreateProjectPayload = z.output<typeof createProjectSchema>;
export type UpdateProjectPayload = z.output<typeof updateProjectSchema>;
```

Derive (`.partial()`, `.pick()`, `.extend()`) from the **unrefined** object and add `.refine` last —
since Zod 4.3, `.pick`/`.omit` throw on a refined object and `.extend` throws when it overwrites a
refined object's keys (use `.safeExtend()`). Zod 4 idioms, select defaults, input vs output typing:
forms skill §1. Shared enums used by several features move to `src/types/enums.ts`.

### `types.ts`

```typescript
import type { ProjectStatus } from "./schema";

export interface Project {
  id: string;                 // UUID
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;          // ISO 8601 UTC
  dueDate: string | null;     // DateOnly, YYYY-MM-DD
}
```

Hand-written `interface`s for responses — not `z.infer`; API shapes and form shapes evolve
separately. Use `PaginatedResponse<T>` (`@/types/common`) only for a real
`{ items, page, pageSize, totalCount }` envelope.

### `service.ts`

```typescript
import { httpClient } from "@/lib/http.client";

import type { CreateProjectPayload, UpdateProjectPayload } from "./schema";
import type { Project } from "./types";

export interface ProjectFilter { search?: string; status?: string }

export const projectService = {
  list(filter: ProjectFilter = {}): Promise<Project[]> {
    return httpClient.get<Project[]>("/projects", { query: { ...filter } });
  },
  get(id: string): Promise<Project> {
    return httpClient.get<Project>(`/projects/${id}`);
  },
  create(input: CreateProjectPayload): Promise<Project> {
    return httpClient.post<Project>("/projects", input);
  },
  update(id: string, input: UpdateProjectPayload): Promise<Project> {
    return httpClient.patch<Project>(`/projects/${id}`, input);
  },
  /** 204 on success; 409 `PROJECT_HAS_OPEN_TASKS` when it can't be removed yet. */
  remove(id: string): Promise<void> {
    return httpClient.delete<void>(`/projects/${id}`);
  },
};
```

Paths start at the resource (`/api/v1` is prepended); params under `query`; no logic, toast or
try/catch. Full rules: http skill.

### `hooks.ts`

```typescript
"use client";

import { queryOptions, skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { isErrorCode, messageFromError } from "@/lib/api-message";

import type { CreateProjectPayload, UpdateProjectPayload } from "./schema";
import { type ProjectFilter, projectService } from "./service";

/** Shared definitions: key + queryFn + data type travel together (hooks, query(), setQueryData). */
export const projectQueries = {
  all: ["projects"] as const,
  list: (filter: ProjectFilter = {}) =>
    queryOptions({
      queryKey: ["projects", "list", filter],
      queryFn: () => projectService.list(filter),
    }),
  detail: (id: string | undefined) =>
    queryOptions({
      queryKey: ["projects", "detail", id],
      queryFn: id ? () => projectService.get(id) : skipToken,
    }),
};

export function useProjects(filter: ProjectFilter = {}) {
  return useQuery(projectQueries.list(filter));
}

export function useProject(id: string | undefined) {
  return useQuery(projectQueries.detail(id));
}

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

export function useUpdateProject(id: string) {
  return useMutation({
    mutationKey: ["projects", "update", id],          // lets useMutationState show "Saving…"
    mutationFn: (input: UpdateProjectPayload) => projectService.update(id, input),
    onSuccess: (_data, _vars, _result, { client }) => {
      toast.success("Changes saved.");
      return client.invalidateQueries({ queryKey: projectQueries.all });
    },
    onError: (error) => toast.error(messageFromError(error, "Couldn't save changes.")),
  });
}

export function useRemoveProject() {
  return useMutation({
    mutationFn: (id: string) => projectService.remove(id),
    onSuccess: (_data, _id, _result, { client }) => {
      toast.success("Project removed.");
      return client.invalidateQueries({ queryKey: projectQueries.all });
    },
    onError: (error) =>
      toast.error(
        isErrorCode(error, "PROJECT_HAS_OPEN_TASKS")
          ? "Close its open tasks first."
          : messageFromError(error, "Couldn't remove that project."),
      ),
  });
}
```

- One hook per operation, not an object of mutations.
- Mutation callbacks are `(data, variables, onMutateResult, context)`; `context.client` is the
  `QueryClient`, so the hook needs no `useQueryClient()`.
- Prefetch on intent / imperative reads: `queryClient.query(projectQueries.detail(id))` — never the
  deprecated `fetchQuery` / `prefetchQuery` / `ensureQueryData`.
- A server layout that seeds the cache can't import this client module: move the key factories to a
  server-safe `keys.ts` and build `projectQueries` from them (tanstack skill §5). Share a mutation
  definition across components with `mutationOptions` (tanstack skill §4).
- Keys, retries, optimistic updates, hydration seeding: tanstack skill.

### `index.ts`

```typescript
export {
  projectQueries,
  useCreateProject,
  useProject,
  useProjects,
  useRemoveProject,
  useUpdateProject,
} from "./hooks";
export {
  type CreateProjectInput,
  type CreateProjectPayload,
  createProjectSchema,
  ProjectStatus,
  type UpdateProjectPayload,
  updateProjectSchema,
} from "./schema";
export { type ProjectFilter, projectService } from "./service";
export type { Project } from "./types";
```

Named re-exports only (no `export *`), listing what other layers consume.

### Tests (Vitest 5)

- `schema.test.ts` — accepts a valid input, rejects each invalid field; fast-check fuzz on `name`.
- `service.test.ts` — mock `@/lib/http.client`, assert method, path and `query` per call.
- `hooks.test.tsx` (`// @vitest-environment jsdom`) — render with a fresh `QueryClient`
  (`retry: false`), assert invalidation and toast on success/error.

```typescript
// service.test.ts
import { describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/http.client";
import { projectService } from "./service";

vi.mock("@/lib/http.client", () => ({          // top level only — nested vi.mock throws in Vitest 5
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe("projectService", () => {
  it("lists with the filter under query", async () => {
    vi.mocked(httpClient.get).mockResolvedValue([]);
    await projectService.list({ status: "Active" });
    expect(httpClient.get).toHaveBeenCalledWith("/projects", { query: { status: "Active" } });
  });

  it("propagates API errors", async () => {
    vi.mocked(httpClient.delete).mockRejectedValue(new Error("409"));
    await expect(projectService.remove("p1")).rejects.toThrow("409");   // always await rejects/resolves
  });
});
```

Vitest 5 notes: `clearMocks` defaults to `true` (no `vi.clearAllMocks()` in `beforeEach`; calls
recorded in `beforeAll` are cleared before each test); `vi.mock` / `vi.hoisted` must be top level
(`vi.doMock` can go anywhere); an unawaited `.resolves` / `.rejects` fails the test;
`vi.when(fn).calledWith(…).thenResolve(…)` is available for argument-specific stubs; reports and
attachments land under `.vitest/` (gitignore it). Don't assert on `useId`-generated ids (prefix
`_r_` since React 19.2).

## Don't

`actions.ts` / server actions, a grab-bag `utils.ts`, a `components/` folder inside the feature
(route-private UI lives in `app/<route>/_components/`, feature-aware shared UI in
`components/common/`), importing another feature (auth excepted), standalone exported service
functions instead of the `<name>Service` object.
