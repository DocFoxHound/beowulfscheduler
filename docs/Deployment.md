# Deployment

This app is a static React/Vite SPA that consumes a backend API. You can deploy it to any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, Nginx) as long as environment variables are provided and CORS is configured on the API.

## Build

- Install dependencies: `npm install`
- Production build: `npm run build`
- Preview locally: `npm run preview`

This produces an optimized `dist/` directory.

## Environment variables

Provide the variables listed in `docs/Environment.md`. For static hosts, use their UI/CLI to set environment variables; Vite inlines `VITE_*` variables at build time.

Important: when switching between live and test backends with `VITE_IS_LIVE`, ensure the corresponding URLs and channel IDs are set.

## Routing configuration

Because this is an SPA using React Router, requests to deep routes should return `index.html`.

- Nginx example:
  ```nginx
  location / {
    try_files $uri /index.html;
  }
  ```
- Cloudflare Pages / Netlify: configure a catch-all rewrite to `/index.html`.

## CORS & cookies

Many API calls use `withCredentials` (cookies). Ensure your API:
- Sets proper `Access-Control-Allow-Origin` to your deployed domain
- Includes `Access-Control-Allow-Credentials: true`
- Sends cookies with the correct domain and `SameSite=None; Secure` when using HTTPS across origins

## Cache & performance

- Vite outputs hashed filenames for long-term caching.
- You can enable gzip/brotli at the CDN/edge layer.

## Rollbacks

Keep previous build artifacts or use your platform's instant rollback to revert quickly if a deployment misbehaves.
