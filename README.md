# IronPoint (Beowulf Scheduler)

React + TypeScript web app powered by Vite for managing org operations: authentication via Discord, scheduling, fleet management, piracy tracking, warehouse inventory, leaderboards, and admin activity.

## Key features

- Discord login and environment-aware routing (live vs test)
- Dashboard with user roles and progression tracking
- Scheduler with role-based event channels
- Fleets: create, manage, and view active fleets and logs
- Piracy/hit tracking and leaderboards (blackbox, fleet logs, SB logs, piracy)
- Warehouse (org and personal) summaries
- Admin activity and user management
- Responsive UI built with MUI and charts via Recharts

## Tech stack

- React 19, React Router 7, TypeScript 5
- Vite 6 for dev/build
- MUI 7, Emotion
- Axios for API calls
- date-fns, dayjs, moment-timezone for dates
- Recharts, react-select, react-datepicker, KaTeX

## Quick start

Prerequisites:

- Node.js 18.18+ (LTS recommended)
- npm 9+ (or pnpm/yarn if you prefer)

Steps:

1. Copy environment template and fill in values
   - cp .env.example .env.local
2. Install dependencies
   - npm install
3. Start the dev server
   - npm run dev

The app runs at http://localhost:5173 by default.

## Scripts

- npm run dev – start Vite dev server
- npm run build – production build
- npm run preview – preview production build locally
- npm run lint – run ESLint across the repo

## Configuration and environments

This app supports a dual-environment workflow toggled by the boolean VITE_IS_LIVE.

- When VITE_IS_LIVE="true", the app uses the "live" URLs and channel IDs
- When VITE_IS_LIVE!="true", the app uses the "test" URLs and channel IDs

Primary environment variables used across the app:

- VITE_IS_LIVE: "true" or "false" to toggle environment
- API endpoints
  - VITE_LIVE_API_URL
  - VITE_TEST_API_URL
- Auth/login endpoints
  - VITE_LIVE_LOGIN_URL
  - VITE_TEST_LOGIN_URL
- Current user endpoint (used for many pages)
  - VITE_LIVE_USER_URL
  - VITE_TEST_USER_URL
- Role ID lists (comma-separated Discord role IDs)
  - VITE_RONIN_ID
  - VITE_FLEET_COMMANDER
  - VITE_FRIENDLY_ID
  - VITE_PROSPECT_ID
  - VITE_CREW_ID
  - VITE_MARAUDER_ID
  - VITE_BLOODED_ID
  - VITE_LIVE_BLOODED_PLUS
- Event announcement channels (Discord channel IDs)
  - Public: VITE_PUBLIC_EVENTS_CHANNEL / VITE_TEST_PUBLIC_EVENTS_CHANNEL
  - Prospect: VITE_PROSPECT_EVENTS_CHANNEL / VITE_TEST_PROSPECT_EVENTS_CHANNEL
  - Crew: VITE_CREW_EVENTS_CHANNEL / VITE_TEST_CREW_EVENTS_CHANNEL
  - Marauder: VITE_MARAUDER_EVENTS_CHANNEL / VITE_TEST_MARAUDER_EVENTS_CHANNEL

See docs/Environment.md for a complete reference and examples.

## Architecture overview

- Entry: src/main.tsx mounts App with React Router
- Routing: src/App.tsx defines routes for Login, Dashboard, Scheduler, Fleets, Gangs, Piracy, Warehouse, Info, Leaderboards, and Admin Activity
- State: src/context/UserContext.tsx provides dbUser and userRank
- API layer: src/api/* modules wrap axios requests to a backend API; base URL is chosen via VITE_IS_LIVE and VITE_*_API_URL
- Types: src/types/* define data contracts used across components
- UI: MUI components with Emotion styling; charts via Recharts

A deeper breakdown is available in docs/Architecture.md.

## Working with the API

The frontend communicates with a backend via axios using the base URL from VITE_*_API_URL. Requests involving user data generally include withCredentials where required by the backend.

API modules are organized under src/api (e.g., fleetApi, hittrackerApi, warehouseApi, leaderboardApi). See docs/API.md for a catalog and notes.

## Linting and formatting

Run ESLint via npm run lint. The project is TypeScript-first; keep types accurate and narrow where possible. Respect React Hooks and Refresh plugin rules.

## Contributing

Contributions are welcome. Please read CONTRIBUTING.md for branch strategy, commit conventions, and PR checklists.

## Troubleshooting

- Blank screen or 401 after login: verify VITE_*_LOGIN_URL and VITE_*_USER_URL and that cookies/CORS are configured on the API
- 404s on API calls: confirm VITE_*_API_URL and the API server is reachable from the browser
- Role-based UI not showing: ensure the relevant VITE_*_ID variables are defined and comma-separated
- Port conflicts: set Vite server port or stop the conflicting process

See docs/Troubleshooting.md for more.

## License

No explicit license is included at this time. Contact the maintainers for reuse permissions.

## Acknowledgments

- Built with React, Vite, and MUI
- Thanks to contributors and the broader community libraries used here
