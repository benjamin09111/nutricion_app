# Skill: API Communication & Data Fetching

NutriNet follows a centralized API communication pattern to ensure traceability and modularity.

## 1. Centralized Client
- **Entry Point**: All API calls must go through `frontend/src/lib/api.ts` (or domain-specific files like `appointments.ts`).
- **Base Client**: Use the established `api-base.ts` which handles auth tokens, base URLs, and common error responses.
- **NO Direct Fetch**: Never use `fetch()` or `axios` directly inside components.

## 2. Server State Management
- **Library**: `@tanstack/react-query` (React Query) v5.
- **Convention**: 
    - Use `useQuery` for fetching data.
    - Use `useMutation` for creating, updating, or deleting data.
- **Invalidation**: Proactively invalidate queries (e.g., `queryClient.invalidateQueries(['patients'])`) after a successful mutation to ensure UI consistency.

## 3. Error Handling
- **Global Interceptors**: Rely on the client in `api-base.ts` for handling 401 (Auth) or 500 (Server) errors.
- **Contextual Feedback**: Always wrap mutations in `try/catch` or use React Query's `onError` to provide specific user feedback via `sonner`.

## 4. Implementation Example
```tsx
const { data: patients, isLoading } = useQuery({
  queryKey: ['patients'],
  queryFn: () => api.patients.getAll()
});

const mutation = useMutation({
  mutationFn: (newPatient) => api.patients.create(newPatient),
  onSuccess: () => {
    queryClient.invalidateQueries(['patients']);
    toast.success("Paciente registrado");
  }
});
```

---
*Last updated: 2024-05-07*
