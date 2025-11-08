# Architecture

This document provides a deeper dive into the frontend architecture of IronPoint (Beowulf Scheduler).

## High-level overview

```
Browser -> React Router -> Pages -> Components -> API Layer (axios) -> Backend REST API
                              \-> Context (UserContext) -> Role-based logic
```

## Entry point
- `src/main.tsx` mounts `<App />` inside `<BrowserRouter/>`.

## Routing
- Defined in `src/App.tsx` using React Router 7.
- Routes:
  - `/` Login
  - `/dashboard` Dashboard overview (roles, stats, progression)
  - `/scheduler` Event calendar & creation modal
  - `/fleets` Fleet list and management
  - `/piracy` Piracy / hit tracking
  - `/gangs` Gangs (recent groups / activities)
  - `/warehouse` Org & personal inventory views
  - `/leaderboards` Multiple leaderboard variants (piracy, blackbox, fleets, SB logs)
  - `/info` General information/help
  - `/admin/activity` Administrative activity panel

## State management
- Lightweight approach using React Context.
- `src/context/UserContext.tsx` supplies:
  - `dbUser` (backend user object)
  - `userRank` (rank meta)
- Role and permission logic is derived from environment variable provided arrays of Discord role IDs.

## Environment-driven behavior
- `VITE_IS_LIVE` flag selects between live and test sets of URLs & channel IDs.
- Many modules construct `API_BASE_URL` or `API_URL` with:
  ```ts
  const base = import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL;
  ```
- Role arrays (comma-separated) are parsed in multiple components and utilities.

## API layer
- Located in `src/api/*`.
- Each file exports functions that wrap axios calls and return typed data (TypeScript interfaces in `src/types`).
- Example pattern:
  ```ts
  const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;
  export const fetchFleetById = async (id: string) => axios.get(`${API_BASE_URL}/api/fleet/fleet`, { params: { id }})
  ```
- Errors are surfaced to callers; some functions gracefully return `null` for 404 (e.g., `fetchFleetByMember`).

### Notable API modules
- `fleetApi.ts` – CRUD and query for fleets & membership.
- `fleetLogApi.ts` – Logs of fleet actions.
- `hittrackerApi.ts` – Piracy/hit data.
- `leaderboard*` – Different leaderboard data segments.
- `warehouseApi.ts` – Inventory retrieval.
- `scheduleService.ts` & `calendarAvailabilityApi.ts` – Scheduling and availability.
- `userService.ts` – User and rank retrieval plus role-based queries.
- `verifyUserApi.ts`, `promotePlayerApi.ts`, etc. – Administrative/role progression operations.

## Types
- `src/types/*` centralizes domain models (fleet, user, stats, badges, items, goals, etc.). Keep these authoritative & synced with backend responses.

## Components & Pages
- Pages under `src/pages` orchestrate data fetching and compose presentational components.
- Reusable UI goes under `src/components` (e.g., `ActiveFleetCard`, `LeaderboardTable`, scheduler modals, admin panels).
- Column definition modules under `src/columns` define table column configurations.

## Styling & Theming
- MUI + Emotion: components adopt MUI system props & theme when appropriate.
- Global styles in `src/index.css` and page-specific CSS modules (e.g., `Dashboard.css`).

## Data & Role Logic Utilities
- Promotion/progression logic in `src/utils/promotionUtils.ts` and `progressionEngine.ts` parse role arrays and compute progression.

## Error handling strategy
- Most API wrappers allow errors to bubble; select ones catch 404 specifically and return `null` to simplify conditional rendering.
- Recommend future enhancement: introduce a central axios instance with interceptors for auth refresh + logging.

## Performance considerations
- Vite code-splitting via dynamic imports could be introduced (currently routes are eagerly loaded).
- Repeated env parsing could be consolidated into a single `env.ts` helper to avoid duplication.

## Recommended future improvements
- Introduce a domain-level service layer to combine multiple API calls.
- Add React Query (TanStack Query) for caching & background refetch.
- Add unit tests for utilities and integration tests for key flows (login redirect, fleet creation, event scheduling).
- Implement error boundary & loading skeleton components.

## Diagram (suggested future state)
```
+------------------+       +------------------+
| React Components | <---> | React Query Cache| 
+------------------+       +------------------+
          |                           |
          v                           v
    +-----------+            +----------------+
    | Services  |  <-------> | Auth / Env Util|
    +-----------+            +----------------+
          |
          v
     +---------+
     | API/HTTP|
     +---------+
          |
          v
     Backend REST
```
