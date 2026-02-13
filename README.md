# DevzAnime-API

Unofficial REST API for scraping anime data from hianime.

## Runtime support

- Node.js (local development)
- Vercel Serverless Functions (free tier)
- Cloudflare Workers (free tier)
- Redis is optional and currently disabled in this branch

## Production requirement (important)

To fully use this API in production, you also need to deploy **AniProx**:

- https://github.com/devz-on/AniProx

`DevzAnime-API` provides anime metadata and stream source discovery, but production-grade playback usually requires a dedicated media proxy layer (for m3u8/segment/caption requests, upstream header handling, and cross-origin compatibility).  
Use AniProx as that proxy layer in front of stream/caption/thumbnail media requests.

## Local setup

```bash
npm install
npm run dev
```

Local URLs:

- API base: `http://localhost:3030/api/v1`
- Docs: `http://localhost:3030/doc`

## Environment variables

Use `.env.example`:

```env
ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_LIMIT=100
NODEJS_HELPERS=0
```

## Deploy To Cloudflare (Easy Way)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/devz-on/DevzAnime-Api)

This repo includes `src/worker.js` and `wrangler.toml`.

1. Install dependencies: `npm install`
2. Login: `npx wrangler login`
3. Deploy: `npx wrangler deploy`

Worker URLs:

- API base: `https://<your-worker>.<subdomain>.workers.dev/api/v1`
- Docs: `https://<your-worker>.<subdomain>.workers.dev/doc`

Notes:

- `wrangler.toml` uses `nodejs_compat` for npm compatibility.
- If needed, update `ORIGIN` and rate-limit values in `[vars]`.

  
## Deploy on Vercel (Currently not available)

This repo includes:
- `api/[...route].js` (Vercel Function entry)
- `vercel.json` (runtime + routing settings for serverless functions)

1. Import the repo in Vercel.
2. Set env vars (`ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_LIMIT`, `NODEJS_HELPERS=0`).
3. Deploy.

No manual framework preset/build preset tuning is required. Runtime and route behavior are declared in `vercel.json`.

Vercel URLs:

- API base: `https://<your-project>.vercel.app/api/v1`
- Docs: `https://<your-project>.vercel.app/api/doc`
- OpenAPI: `https://<your-project>.vercel.app/api/openapi.json`


## Main endpoints

- `GET /api/v1/home`
- `GET /api/v1/spotlight`
- `GET /api/v1/topten`
- `GET /api/v1/anime/{animeId}`
- `GET /api/v1/search?keyword={query}&page={page}`
- `GET /api/v1/search/suggestion?keyword={query}`
- `GET /api/v1/episodes/{animeId}`
- `GET /api/v1/servers?id={episodeId}`
- `GET /api/v1/stream?id={episodeId}&server={server}&type={sub|dub}`
