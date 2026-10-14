# Pulse — Social Media Platform

Pulse is a full-stack social media application with a Next.js web client and an Express API. Users can create profiles, publish text or media posts, follow other accounts, react and comment on posts, and exchange direct messages. The project also includes private-account follow requests, blocking/reporting flows, and an SSE endpoint for supported live events.

> This repository contains the application source. You must configure a database and environment variables before running it locally.

## Features

- **Accounts and profiles:** sign-up/login, JWT-protected API routes, profile photo and bio, and public/private account settings.
- **Feed and posts:** home feed, explore page, text posts, image/video posts, and profile post grid/list views.
- **Social interactions:** like/unlike, comments and replies, follow/unfollow, private-account follow requests, blocking, and reporting flows.
- **Messaging:** one-to-one conversations and sharing posts in conversations.
- **Moderation:** reported-content views and admin-related screens/routes.
- **Responsive interface:** mobile-friendly navigation, feed, and profile layouts.

Some features depend on correct database, API, and optional media-upload configuration.

## Tech stack

| Area | Technologies |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS 4 |
| UI components | Radix UI, Lucide React, shadcn-style components |
| Backend | Node.js, Express 5, JavaScript ES modules |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Database | MySQL, Prisma ORM |
| Media uploads | Cloudinary unsigned upload presets (optional) |
| Live events | Server-Sent Events (SSE) |

## Project structure

```text
Social-Media-Management-main/
├── backend/
│   ├── prisma/              # Schema, migrations, and seed data
│   ├── src/
│   │   ├── middleware/      # Authentication middleware
│   │   ├── realtime/        # SSE client hub
│   │   └── routes/           # Auth, posts, users, and messages
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Feed, profile, post, and UI components
│   ├── public/              # Static image assets
│   └── package.json
└── README.md
```

## Requirements

- Node.js 18.18 or newer (Node.js 20 LTS recommended)
- npm
- MySQL 8 or a compatible MySQL server
- A Cloudinary account only if you want to enable media uploads

## Run locally

### 1. Create a database

Start MySQL and create a database, for example:

```sql
CREATE DATABASE pulse;
```

### 2. Configure and start the backend

In a terminal at the repository root:

```bash
cd backend
npm install
cp .env.example .env
```

Set the values in `backend/.env` to match your local setup:

```env
DATABASE_URL="mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/pulse"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=5000
FRONTEND_ORIGIN="http://localhost:3000"
```

Generate Prisma Client and apply the included migrations:

```bash
npm run db:generate
npm run db:migrate
```

Optional: add local demo users and posts:

```bash
npm run db:seed
```

The seed script creates `sarah@example.com` and `john@example.com` with the password `password123`. These are development-only demo credentials; do not use them in a public deployment.

Start the API:

```bash
npm run dev
```

The API defaults to `http://localhost:5000`. Open `http://localhost:5000/health` to check that it is running.

### 3. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
cp .env.example .env.local
```

Configure `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
NEXT_PUBLIC_CLOUDINARY_IMAGE_UPLOAD_PRESET="your-unsigned-image-upload-preset"
NEXT_PUBLIC_CLOUDINARY_RAW_UPLOAD_PRESET="your-unsigned-raw-upload-preset"
```

Cloudinary settings are optional unless you need uploads. Because `NEXT_PUBLIC_` variables are exposed in the browser, only use a cloud name and unsigned upload preset here—never put private Cloudinary API secrets in frontend variables.

Start the frontend:

```bash
npm run dev
```

Visit `http://localhost:3000`. Run the backend and frontend in separate terminals.

## Useful scripts

### Backend (`backend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Start the API with nodemon |
| `npm start` | Start the API with Node.js |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Apply checked-in Prisma migrations |
| `npm run db:seed` | Insert development demo users and posts |

### Frontend (`frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build for production |
| `npm start` | Serve a production build |

## Environment variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection URL used by Prisma |
| `JWT_SECRET` | Yes for secure use | Secret for signing/verifying JWTs; use a long random value |
| `PORT` | No | API port; defaults to `5000` |
| `FRONTEND_ORIGIN` | No | Frontend origin allowed by CORS; defaults to `http://localhost:3000` |

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Recommended | Backend base URL; defaults to `http://localhost:5000` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Only for uploads | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_IMAGE_UPLOAD_PRESET` | Only for media uploads | Cloudinary unsigned image upload preset |
| `NEXT_PUBLIC_CLOUDINARY_RAW_UPLOAD_PRESET` | Only for raw/text uploads | Cloudinary unsigned raw upload preset |

## API route groups

The backend mounts `/auth`, `/posts`, `/users`, and `/messages`. It also exposes `/events` for the SSE stream and `/health` for a health check. See `backend/src/routes/` for individual endpoints and request formats.

## Notes

- Keep `.env` and `.env.local` out of version control. The included example files use placeholders.
- Use a strong `JWT_SECRET` and secure deployment configuration outside local development.
- Configure Cloudinary unsigned presets with appropriate allowed formats and file-size limits.
- Back up your database before applying schema or migration changes.
- No license file was included in the supplied archive; add one if you plan to distribute the project.
# pulse-social-media-platform
