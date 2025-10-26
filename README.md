# LoginV0

Clean email/password + Google OAuth example using:

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
VITE_HOSTED_BACKEND_URL=http://localhost:4000
```

## API summary

- POST /api/auth/register {email,password,name}
- POST /api/auth/login {email,password}
- POST /api/auth/logout
- GET /api/auth/me (cookie required)
- GET /api/auth/google -> redirects to Google
- GET /api/auth/google/callback -> sets cookie and redirects back to client

## Notes

- JWT is stored in an httpOnly cookie named `token`.
- CORS is configured to allow the Vite dev server.
- In production, enable HTTPS and set `secure` cookies.
