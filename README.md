# MC RailAdmin
Lightweight Minecraft server manager for Railway.

## What it does
- Runs a Paper Minecraft server inside a Docker container on Railway
- Provides a mobile-first admin panel (React) with:
  - Dashboard, Console (live logs), Players
  - Plugins (upload, toggle, delete)
  - Backups (create, restore, auto-schedule)
  - World & Settings, Server Properties
  - Diagnostics (self-check for all systems)
  - Playit.gg tunnel management (claim + regenerate)
- Auto-connects to playit.gg for public access — no port forwarding

## Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend:  Node.js 20 + Express + ws + rcon-client
- Runtime:  Ubuntu 22.04 + OpenJDK 17 + Paper 1.20.4

## Deploy to Railway
1. Push this repo to GitHub.
2. Create a new Railway project → Deploy from GitHub.
3. Railway auto-detects the Dockerfile.
4. Set these env vars in Railway → Variables:
     RCON_PASSWORD=<random-string>
     MC_RAM_MAX=1536M     (adjust to your Railway plan)
     MC_VERSION=1.20.4
     (optional) PLAYIT_SECRET=<from playit.gg dashboard>
5. Deploy. First boot takes 2-4 minutes (Paper download + world gen).
6. Open the Railway public URL.
7. On the About page, copy the claim URL and complete 
   playit.gg tunnel setup.
8. Share the playit.gg address with your players.

## Environment variables
See .env.example.

## Local development
Backend:
  cd backend && npm install && npm run dev
Frontend:
  cd frontend && npm install && npm run dev
Frontend proxies /api and /ws to localhost:3000.

## Diagnostics
Open /diagnostics in the app. It runs 50+ checks across 
frontend, backend, MC server, RCON, playit, filesystem, 
performance, API endpoints, and environment.

## License
MIT
