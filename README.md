# MemSky

A digital time capsule maker

- Server: Express + TypeScript + MongoDB (Mongoose) + JWT in httpOnly cookies
- Client: React (Vite + TS)

## Prereqs

- Node.js 18+ and npm
- MongoDB running locally or connection string

## Setup

1. Server env
   Copy `server/.env.example` to `server/.env` and fill values (you can skip Google for now to test email login).

2. Install deps

```powershell
# from repo root
cd server
npm i
cd ..\client
npm i
```

3. Run dev
   Open two terminals.

```powershell
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

- Server: http://localhost:4000
- Client: http://localhost:5173

## Client config

Optionally create `client/.env` with:

```
VITE_API_BASE=http://localhost:4000
```



- JWT is stored in an httpOnly cookie named `token`.
- CORS is configured to allow the Vite dev server.
- In production, enable HTTPS and set `secure` cookies.

