---
name: onu-frontend-react-patterns
description: "Apply production-grade React and TypeScript patterns for the target project: component structure, state management, data fetching, forms, routing, and performance. Use when implementing or reviewing frontend code in the React/Vite client."
---

# React Patterns

Use this skill to write React/TypeScript code that fits the target project client stack and stays easy to change. It complements `onu-frontend-guidelines` and `onu-frontend-development`.

For multi-skill work, follow [frontend workflow routing](../onu-frontend-guidelines/references/frontend-workflow-routing.md). Use this only to resolve a concrete React or TypeScript pattern decision; it is not a delivery coordinator and does not delegate work.

## Stack

- React + TypeScript + Vite
- React Router for routing
- TanStack Query for server state
- Zustand for shared client state
- React Hook Form + Zod for forms
- Tailwind CSS for styling
- Headless UI + Heroicons for accessible UI primitives

## Component patterns

### Feature boundaries

Work inside `src/features/<feature>/`. Each feature owns its pages, components, hooks, models, and API layer. Reuse `shared/ui`, `shared/api`, and feature-level primitives before creating new ones.

### Component structure

```tsx
// src/features/posts/components/PostDetail.tsx
import { useQuery } from '@tanstack/react-query';
import { postService } from '../api/post-service';

export function PostDetail({ postId }: { postId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postService.getById(postId),
    enabled: postId > 0,
  });

  if (isLoading) return <PostDetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={...} />;
  if (!data) return <EmptyState />;

  return <PostDetailView post={data} />;
}
```

- One component per file; keep it under 200 lines; extract when it grows.
- Every data-driven surface must handle loading, empty, error, success, and permission states.
- Prefer composition over prop drilling; use Zustand for global client state.

## Data fetching (TanStack Query)

- Server state lives in TanStack Query with meaningful `queryKey` arrays.
- Mutations use `useMutation` with `onSuccess` invalidation rather than manual refetch.
- API functions stay in `src/features/<feature>/api/` and return typed promises.
- Avoid fetching the same data in multiple components; lift the query key to the nearest common ancestor.

## Form patterns (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

function PostForm({ defaultValues, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} className={...} />
      {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      <button type="submit" disabled={isSubmitting}>Save</button>
    </form>
  );
}
```

- Zod schemas mirror the backend AM request contracts for consistency.
- Place shared field validation rules in a shared schema module.

## Routing (React Router)

- Define routes in the application router under the existing route hierarchy.
- Use `useParams` for route params, `useSearchParams` for filter/sort state in list views.

## Performance

- Use TanStack Query's built-in caching and background refetching; avoid manual `useEffect` fetching.
- Lazy-load route components with `React.lazy` and `Suspense` boundaries.
- Defer heavy third-party imports until they are needed.
- Profile with the React DevTools Profiler before memoizing.

## Implementation checklist

- [ ] All states (loading / empty / error / success / permission) are rendered.
- [ ] Forms use RHF + Zod with schemas aligned to backend models.
- [ ] Server state is in TanStack Query; client-only state is in local state or Zustand.
- [ ] No raw `fetch` calls outside `src/features/<feature>/api/`.
- [ ] `npm run check` and `npm run build` pass before the change is complete.
