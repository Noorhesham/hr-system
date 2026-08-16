# Frontend — نظام الموارد البشرية

Next.js 16 (App Router) + Tailwind v4 + shadcn/ui admin shell, Arabic RTL, brand primary `#1F9120`, font **Changa**.

## Prerequisites

- Node.js 20+ (tested on 22)
- Backend running on **port 3004** (`cd ../backend && npm run start:dev`)
- Backend CORS `FRONTEND_URL=http://localhost:3000` (already in `backend/.env.example`)

## Setup

```bash
cd frontend
cp .env.example .env.local   # if needed
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)  
Login: [http://localhost:3000/login](http://localhost:3000/login)  
API: `NEXT_PUBLIC_API_URL` → `http://localhost:3004/api`

## Auth model

- Access token lives **in memory only** (never `localStorage`)
- Refresh token is an **httpOnly cookie** set by the backend (`credentials: "include"`)
- On load, `AuthProvider` calls `POST /auth/refresh` then `GET /auth/me`
- Dashboard routes are guarded client-side (middleware cannot see the in-memory access token)

## Seed credentials (after `npx prisma db seed` in backend)

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@najd.sa` | `Owner@1234` |
| Employee | `ahmed.harbi@najd.sa` | `Emp@12345` |
| Platform | `platform@admin.com` | `Platform@123` |

## Stack notes

- shadcn `dashboard-01` block under `src/app/(dashboard)/`
- Sidebar anchors to the **right** (`side="right"`) for RTL
- Figma pixel-matching comes in a later pass — this is scaffold only
