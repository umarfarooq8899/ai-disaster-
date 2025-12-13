# AI Disaster Relief (Blue/White)

Full-stack MERN starter based on your provided project structure, with a clean **blue + white** UI theme (gradient), working **JWT auth**, **disaster reporting**, and role-based dashboards.

## Tech
- Frontend: React + Vite + Tailwind
- Backend: Express + Mongoose + JWT
- DB: MongoDB (local or Atlas)

## Setup

### 1) Backend
```bash
cd backend
cp .env.example .env
# edit MONGO_URI and JWT_SECRET
npm install
npm run dev
```

### 2) MongoDB (local)
Make sure MongoDB is running on `127.0.0.1:27017`.

### 3) Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Frontend proxies `/api` to `http://localhost:5000` via `vite.config.mjs`.

## Demo Roles
Signup allows selecting role (general/volunteer/ngo/rescue/admin) for demo. In real apps, admin/provider roles are created by existing admins.

## API
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/disasters`
- `POST /api/disasters` (JWT required)
