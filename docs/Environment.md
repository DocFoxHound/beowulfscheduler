# Environment configuration

This app relies on a set of Vite runtime variables. Create a `.env.local` in the project root for development; production values should be set in your hosting platform's environment.

Use `.env.example` as a starting point.

## Live vs Test toggle
- `VITE_IS_LIVE` (string) – set to `"true"` to enable live URLs and IDs. Any other value will select test URLs and IDs.

## Backend endpoints
- `VITE_LIVE_API_URL` – base URL for the live API, e.g., `https://api.example.com`
- `VITE_TEST_API_URL` – base URL for the test API, e.g., `http://localhost:8080`

### User/auth endpoints (consumed directly from the frontend)
- `VITE_LIVE_LOGIN_URL` – live login/SSO URL (Discord OAuth proxy)
- `VITE_TEST_LOGIN_URL` – test/dev login/SSO URL
- `VITE_LIVE_USER_URL` – live endpoint returning the authenticated user ("me")
- `VITE_TEST_USER_URL` – test/dev endpoint for the same

## Role IDs (Discord)
These values are comma-separated lists of role IDs from Discord. They drive role-based visibility and progression in the UI.

- `VITE_RONIN_ID`
- `VITE_FLEET_COMMANDER`
- `VITE_FRIENDLY_ID`
- `VITE_PROSPECT_ID`
- `VITE_CREW_ID`
- `VITE_MARAUDER_ID`
- `VITE_BLOODED_ID`
- `VITE_LIVE_BLOODED_PLUS` – additional blooded roles used in admin views

## Event channels (Discord)
Event creation and announcements use channel IDs that differ by environment.

- Public: `VITE_PUBLIC_EVENTS_CHANNEL` / `VITE_TEST_PUBLIC_EVENTS_CHANNEL`
- Prospect: `VITE_PROSPECT_EVENTS_CHANNEL` / `VITE_TEST_PROSPECT_EVENTS_CHANNEL`
- Crew: `VITE_CREW_EVENTS_CHANNEL` / `VITE_TEST_CREW_EVENTS_CHANNEL`
- Marauder: `VITE_MARAUDER_EVENTS_CHANNEL` / `VITE_TEST_MARAUDER_EVENTS_CHANNEL`

## Tips
- All values are strings from `import.meta.env`.
- Comma-separated fields should not include spaces. If present, the app usually trims, but prefer canonical `id1,id2,id3` formatting.
- If a role-based UI element does not appear, double-check your role IDs align with actual Discord roles for the user.
