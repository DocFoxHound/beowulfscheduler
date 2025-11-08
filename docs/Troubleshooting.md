# Troubleshooting

Common issues and resolutions when developing or operating IronPoint.

## Login redirect loops or 401
- Verify `VITE_LIVE_LOGIN_URL` / `VITE_TEST_LOGIN_URL` and `VITE_*_USER_URL` are correct.
- Ensure backend sets cookies with `SameSite=None; Secure` (for cross-site HTTPS) and allows credentials via CORS.

## API 404 when fetching fleets or user
- Confirm `VITE_IS_LIVE` matches the API you expect.
- Check `VITE_LIVE_API_URL` / `VITE_TEST_API_URL` correctness and trailing slash usage.

## Role-based components missing
- Make sure role ID env variables are populated and match the user's Discord roles.
- Remove stray spaces in comma-separated env values.

## Event channels show errors or no announcements
- Ensure channel IDs exist and the bot/user posting events has permission to publish.
- Validate the correct test vs live channel variable is selected by `VITE_IS_LIVE`.

## CORS errors in console
- Backend must include `Access-Control-Allow-Origin` with your frontend origin and `Access-Control-Allow-Credentials: true` if cookies are used.

## Build succeeds but deployed site breaks on deep links
- Add SPA rewrites (serve `index.html` for unknown routes).
- Verify no server-side route shadowing your client paths.

## Slow dashboard load
- Consider caching responses (future improvement: React Query/TanStack Query).
- Check browser network tab for long-tail requests or repeated calls.

## Duplicate env parsing logic
- Centralize parsing in a helper (future refactor) or ensure consistent trimming.

## Getting more diagnostics
- Add temporary `console.debug` statements in API wrappers to inspect request params.
- Use browser dev tools to examine cookies and response headers.
