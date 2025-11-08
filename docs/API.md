# Frontend API Catalog

This document summarizes how the frontend talks to the backend. The base URL is chosen by `VITE_IS_LIVE` using `VITE_LIVE_API_URL` or `VITE_TEST_API_URL`.

All modules are in `src/api`. Most functions return typed data from `src/types/*`.

## Conventions
- GET endpoints often accept `params` via axios query string.
- Mutations (POST/PUT) send JSON bodies with `Content-Type: application/json`.
- Some requests include `{ withCredentials: true }` where backend auth requires cookies.

## Modules and representative routes

- badgeAccoladeRecordApi
  - GET `${base}/api/badgeAccoladeRecord/...`
- badgeRecordApi
  - GET/POST `${base}/api/badgeRecord/...`
- badgeReusableApi
  - GET `${base}/api/badgeReusable/...`
- blackboxApi
  - GET `${base}/api/blackbox/...`
- calendarAvailabilityApi
  - GET/POST `${base}/api/calendar-availability/...`
- emojiApi
  - GET `${base}/api/emoji/...`
- fleetApi
  - GET `${base}/api/fleet/` (all fleets)
  - GET `${base}/api/fleet/commander?user_id=...`
  - GET `${base}/api/fleet/fleet?id=...`
  - GET `${base}/api/fleet/members?user_id=...` (404 => null)
  - GET `${base}/api/fleet/activeornot?activeOrNot=true|false`
  - POST `${base}/api/fleet/` (create)
  - PUT `${base}/api/fleet/:id` (edit)
- fleetLogApi
  - GET `${base}/api/fleetlog/...`
- grantPrestige
  - POST `${base}/api/grantPrestige/...`
- hittrackerApi
  - GET/POST `${base}/api/hittracker/...`
- leaderboardApi and variants (Blackbox, Fleetlog, Piracy, SBLog)
  - GET `${base}/api/leaderboard/...`
- notifyAwardApi
  - POST `${base}/api/notifyAward/...`
- orgGoalsApi
  - GET `${base}/api/org-goals/...`
- patchApi
  - GET `${base}/api/patch/...`
- playerExperiencesApi
  - GET `${base}/api/player-experiences/...`
- playerStatsApi
  - GET `${base}/api/player-stats/...`
- promotePlayerApi
  - POST `${base}/api/promote-player/...`
- summarizedItemApi
  - GET `${base}/api/items/summary/...`
- uexPlanetsApi / uexStationsApi / uexSystemsApi
  - GET `${base}/api/uex/...`
- userService
  - GET `${base}/api/users/:id`
  - GET `${base}/api/users/`
  - GET `${base}/api/ranks/:id`
  - GET `${base}/api/users/by-ronin-role`
  - GET `${base}/api/users/by-fleet-commander-role`
  - PUT `${base}/api/users/:id`
- verifyUserApi
  - GET `${base}/api/verify-user/...`
- voiceChannelSessionsApi
  - GET `${base}/api/voice-channel-sessions/...`
- warehouseApi
  - GET `${base}/api/warehouse/...`

Note: The exact backend paths may differ; use this as a guide and consult the backend repository for authoritative routes and payloads.

## Error handling
- Some wrappers convert 404 responses to `null` (e.g., `fetchFleetByMember`) to simplify conditional rendering.
- Other errors are thrown to the caller; handle them with user-friendly toasts/messages as needed.

## Authentication
- Login is initiated by redirecting to `VITE_*_LOGIN_URL`.
- The app then queries `VITE_*_USER_URL` for the authenticated user profile (cookies must be set/available).
