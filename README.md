# FamilyStream

A self-hosted, premium-feeling media streaming and photo gallery for your family — Netflix-dark aesthetic, multi-profile accounts, and installable as a native-feeling app on iOS/Android.

## Architecture

```
family-stream/
├── docker-compose.yml        One-command deploy (backend + frontend containers)
├── .env.example              JWT_SECRET / CLIENT_ORIGIN / HOST_PORT for Compose
│
├── backend/                  Node.js + Express API
│   ├── Dockerfile             node:20-alpine + ffmpeg
│   ├── prisma/
│   │   └── schema.prisma      SQLite schema: User, Profile, Media, VideoRendition, Favorite, WatchProgress
│   └── src/
│       ├── server.js          App entry point
│       ├── middleware/auth.js         JWT (account) + profile-token guards
│       ├── routes/
│       │   ├── auth.routes.js         register/login (bcrypt + JWT)
│       │   ├── profile.routes.js      "Who's watching?" profile CRUD + select
│       │   ├── media.routes.js        upload (Multer), search, favorites, progress
│       │   └── stream.routes.js       HTTP 206 chunked streaming, quality-aware
│       ├── utils/ffmpeg.js    Fluent-ffmpeg rendition ladder + thumbnail generation
│       └── uploads/           originals/ transcoded/ thumbnails/ (gitignored)
│
└── frontend/                 React + Vite + Tailwind + Framer Motion
    ├── Dockerfile              Multi-stage build → nginx
    ├── nginx.conf              SPA fallback + /api reverse proxy, tuned for uploads/streaming
    ├── index.html              iOS/Android PWA meta tags
    ├── vite.config.js          vite-plugin-pwa (manifest + service worker)
    ├── public/
    │   ├── manifest.json       Standalone app manifest
    │   └── icons/              App icons (192/512/apple-touch, placeholders included)
    └── src/
        ├── App.jsx             Routes + auth/profile guards
        ├── context/AuthContext.jsx
        ├── lib/api.js          Fetch wrapper (account JWT + profile token)
        ├── pages/              Login, ProfileSelect, Dashboard, Watch, Search, Upload
        └── components/         Navbar, Hero, Carousel, MediaCard, VideoPlayer
```

### How auth works (two-tier, like real streaming apps)
1. **Account JWT** — issued at login/register, identifies the account (`Authorization: Bearer`).
2. **Profile token** — issued after "Who's watching?" selection (optionally PIN-gated), identifies which family member is active (`x-profile-token` header, or `?profileToken=` for `<video>`/`<img>` tags that can't set custom headers). Favorites and watch progress are scoped per profile.

### How streaming works
Uploaded videos are transcoded in the background with `fluent-ffmpeg`. Each upload now produces a full **rendition ladder** (1080p/720p/480p, skipping any level taller than the source) as fast-start H.264/AAC MP4s, tracked in the `VideoRendition` table. `stream.routes.js` reads a `?quality=` param to pick a specific rendition (falling back to the default/highest one), and reads the `Range` header on each request to respond with **HTTP 206 Partial Content** in 5MB chunks — this is what lets the browser start playing before the whole file downloads and enables scrubbing/seeking. The player's quality menu (`VideoPlayer.jsx`) is wired to the real renditions returned for each media item and swaps the `<video>` source in place, restoring playback position and play state.

### Theater mode
Toggling **Theater** in the player lifts state up to `Watch.jsx` via `onTheaterChange`, which fades in a full-screen black backdrop behind the player and locks page scroll — the "cinema lights down" effect, not just a resized `<video>` box. It resets automatically on navigating away.

## Getting it running locally

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # edit JWT_SECRET to a long random string
npx prisma migrate dev --name init
npm run dev                 # http://localhost:4000
```
FFmpeg must be installed on your system and on PATH (`brew install ffmpeg` / `apt install ffmpeg`).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```
The Vite dev server proxies `/api` to `http://localhost:4000` (see `vite.config.js`).

### 3. First run
1. Open the app, register an account — a default "Family" profile is created automatically.
2. Go to **Who's watching?**, add profiles for each family member (optionally with a PIN).
3. Use the upload icon in the nav bar to add your first photos/videos.

## Installing on iOS / Android (PWA)

- **iOS**: open the site in Safari → Share → **Add to Home Screen**. It launches full-screen using the `apple-mobile-web-app-capable` meta tag and the `apple-touch-icon.png` icon set in `index.html`.
- **Android**: open in Chrome → menu → **Install app** (or you'll see an automatic install prompt), powered by `manifest.json` + the service worker registered via `vite-plugin-pwa`.

### Replacing the placeholder app icon
Programmatically generated placeholder icons are included at `frontend/public/icons/` (192, 512, and iOS touch-icon sizes) so the app is installable out of the box. Swap them for your own artwork at the same filenames/sizes — no other config changes are needed.

## One-command deploy with Docker Compose

**Behind an existing nginx/Apache (e.g. a VPS already running other sites/apps):**
```bash
cp .env.example .env        # set JWT_SECRET; set CLIENT_ORIGIN to https://family.yourdomain.com
docker compose -f docker-compose.yml -f docker-compose.existing-proxy.yml up -d --build
```
This binds the app to `127.0.0.1:8081` (change via `HOST_PORT` in `.env`) — not exposed to the internet directly. Then add a vhost on your existing web server:

<details><summary>nginx vhost (paste as /etc/nginx/sites-available/family, then symlink to sites-enabled)</summary>

```nginx
server {
    listen 80;
    server_name family.yourdomain.com;
    client_max_body_size 5120M;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```
Then: `sudo nginx -t && sudo systemctl reload nginx && sudo certbot --nginx -d family.yourdomain.com`
</details>

<details><summary>Apache vhost (paste as /etc/apache2/sites-available/family.conf)</summary>

```apache
<VirtualHost *:80>
    ServerName family.yourdomain.com
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:8081/ timeout=3600
    ProxyPassReverse / http://127.0.0.1:8081/
    LimitRequestBody 5368709120
</VirtualHost>
```
Requires `sudo a2enmod proxy proxy_http` first. Then: `sudo a2ensite family && sudo systemctl reload apache2 && sudo certbot --apache -d family.yourdomain.com`
</details>

**With a real domain, standalone (Caddy handles everything, no other web server on the box):**
```bash
cp .env.example .env        # set JWT_SECRET, DOMAIN, CLIENT_ORIGIN
docker compose up -d --build
```
A `caddy` container automatically requests and renews a Let's Encrypt certificate for `DOMAIN` and terminates HTTPS at ports 80/443. Make sure the domain's DNS A record already points at the server before starting — Caddy needs to complete the ACME challenge.

**Local testing (no domain yet):**
```bash
cp .env.example .env        # set JWT_SECRET; DOMAIN can stay as-is
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```
This skips Caddy and exposes the frontend directly at `http://localhost:8080` (or `HOST_PORT`).

This builds:
- **backend** — Node + ffmpeg (installed via apk in `backend/Dockerfile`), SQLite file persisted in the `db_data` volume, uploads persisted in `media_uploads`. On boot it runs `prisma db push` to create the schema if it doesn't exist yet.
- **frontend** — Vite production build served by nginx (`frontend/Dockerfile` + `nginx.conf`), which reverse-proxies `/api/*` to the backend container. `client_max_body_size` and proxy buffering are tuned for large video uploads and Range-request streaming.
- **caddy** *(domain mode only)* — automatic HTTPS reverse proxy in front of the frontend container.

**Committing real migrations:** the container currently uses `prisma db push` so it works without any pre-generated migration files. For a more production-grade setup, run `npx prisma migrate dev --name init` locally once (needs network access to Prisma's engine CDN), commit the resulting `backend/prisma/migrations/` folder, and switch the `Dockerfile` CMD to `prisma migrate deploy` for proper versioned migrations.

## Manual production build (no Docker)
```bash
cd frontend && npm run build     # outputs frontend/dist
```
Serve `frontend/dist` behind a reverse proxy (e.g. Caddy/nginx) alongside the backend on your home server, or point Express at it as static files.

## Notes & next steps
- SQLite file lives at `backend/prisma/dev.db` locally, or the `db_data` volume under Docker — back it up along with the uploads directory/volume.
- `Media.category` and `Media.tags` are free-text; the dashboard automatically builds a carousel per distinct category, plus a "Memories from 1 Year Ago" row driven by `Media.takenAt`.
- The quality selector now switches between real transcoded renditions (1080p/720p/480p). This is manual ABR (you pick the level); true *automatic* adaptive bitrate based on measured bandwidth would mean moving to HLS/DASH with `.m3u8`/`.mpd` manifests instead of plain MP4 — a reasonable next step if family members are often on slow connections.
- Background transcoding is fire-and-forget in-process; for a lot of concurrent uploads, consider a real job queue (e.g. BullMQ + Redis) instead.
