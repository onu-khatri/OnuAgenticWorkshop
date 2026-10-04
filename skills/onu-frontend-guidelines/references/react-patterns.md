# React/TypeScript Patterns

Concrete, production-grade patterns for the React/Vite client. Use these to resolve a specific component, state, data-fetching, form, routing, or performance decision. They are the implementation-level companion to the higher-level standards in the parent `SKILL.md`.

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
- Set sensible `staleTime`/`gcTime` and use `placeholderData`/`initialData` for smooth pagination and detail navigation.
- Surface retry and refetch affordances in the error state; never hide a mutation failure behind an indefinite spinner.

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

- Zod schemas mirror the backend request contracts for consistency.
- Place shared field validation rules in a shared schema module.
- Announce server-side errors with a visible, focusable message, not only inline styling.

## Routing (React Router)

- Define routes in the application router under the existing route hierarchy.
- Use `useParams` for route params, `useSearchParams` for filter/sort state in list views.
- Keep route guards and loaders co-located with the route they protect.

## Performance

- Use TanStack Query's built-in caching and background refetching; avoid manual `useEffect` fetching.
- Lazy-load route components with `React.lazy` and `Suspense` boundaries.
- Defer heavy third-party imports until they are needed.
- Profile with the React DevTools Profiler before memoizing; `useMemo`/`useCallback`/`React.memo` are not defaults.
- Guard against poor Interaction to Next Paint (INP): keep event handlers light, break long tasks, and avoid layout thrash in interactions.

## Error handling

- Add a React Error Boundary at the route level to contain render/effect crashes.
- Provide a retry path for failed queries and mutations; never leave a surface silently stuck.
- Log uncaught client errors to the configured telemetry; do not leak sensitive data into logs.

## Implementation checklist

- [ ] All states (loading / empty / error / success / permission) are rendered.
- [ ] Forms use RHF + Zod with schemas aligned to backend models.
- [ ] Server state is in TanStack Query; client-only state is in local state or Zustand.
- [ ] No raw `fetch` calls outside `src/features/<feature>/api/`.
- [ ] A route-level error boundary catches render/effect failures.
- [ ] `npm run check` and `npm run build` pass before the change is complete.
