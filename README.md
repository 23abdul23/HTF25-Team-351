# MemSky

A digital time capsule maker

Stack:
- Server: Express + TypeScript + MongoDB (Mongoose) + JWT in httpOnly cookies
- Client: React (Vite + TS)

## Prereqs

- Node.js 18+ and npm
- MongoDB running locally or connection string

## Setup

1. Server env
   Copy `server/.env.example` to `server/.env` and fill required values. 
   For connecting to your own mongo server, replace MONGODB_URI_C with MONGODB_URI and set your link as MONGODB_URI in the .env.
   
2. Get dependencies
     Run `npm install` in the frontend and backend folders.


3. Run dev
   Open two terminals.

```powershell
# Terminal 1
cd backend
nodemon server.js

# Terminal 2
cd frontend
npm run dev
```

- Server: http://localhost:3000
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

And the project is up. 
