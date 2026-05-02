# Frontend conventions

## Structure

- `src/pages/` - Route-level components (one per route)
- `src/components/` - Shared components
- `src/components/ui/` - shadcn/ui generated components (do not edit manually)
- `src/hooks/` - Custom React hooks
- `src/api/client.ts` - Central API client (all fetch calls go here)
- `src/types/` - TypeScript interfaces and types
- `src/lib/utils.ts` - Utility functions (cn, etc.)

## Component rules

- One component per file.
- File name = component name in PascalCase.
- Export default for page components, named export for shared components.
- No `any`. Use `unknown` and narrow with type guards.

## State management

- Server state: `@tanstack/react-query` only. No `useState` for API data.
- UI state (open/closed, selected row): `useState` or `useReducer`.
- Global UI state (sidebar open, theme): `useState` in a context provider.

## API calls

All calls go through `src/api/client.ts`. No direct `fetch()` in components.
The `apiFetch` utility handles base URL, JSON headers, and error throwing.

## Styling

- TailwindCSS utility classes only. No inline styles, no CSS modules.
- Colors: only tokens from DESIGN.md via Tailwind (`bg-bg-canvas`, `text-fg-muted`).
- Never use raw hex values.
- Radius: `rounded-sm` (6px), `rounded-md` (8px), `rounded-lg` (12px).

## Testing

- One test file per page/component: `Home.test.tsx`.
- Mock `@/api/client` module with `vi.mock`.
- Use `@testing-library/react` with `render` + queries.
- Test loading, success, and error states for every data-fetching component.
