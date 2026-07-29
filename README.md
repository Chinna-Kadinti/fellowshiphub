# FellowshipHub

FellowshipHub is a full-stack Bible Study Fellowship coordination MVP built with Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS, secure cookie sessions, Zod validation, React Hook Form, Recharts, and Docker Compose.

The repository now also includes bundled Android and iOS applications in
[`mobile`](./mobile). The native apps preserve the web application features and
roles while using the existing Next.js/PostgreSQL deployment as their secure API
backend. See [`mobile/README.md`](./mobile/README.md) for Node 22, Android Studio,
Xcode, backend URL, signing, and release instructions.

## Quick Start

```bash
docker compose up --build
```

Open http://localhost:3000.

The app container waits for PostgreSQL, applies Prisma migrations, runs the idempotent seed, and starts Next.js.

To stop the app:

```bash
docker compose down
```

To reset the database and seed from scratch:

```bash
docker compose down -v
docker compose up --build
```

## Seeded Accounts

Admin / Leader:

```text
email: admin@fellowshiphub.local
password: Admin@123456
```

Member:

```text
email: member@fellowshiphub.local
password: Member@123456
```

## Included MVP Features

- Authentication: login, register, logout, protected routes, secure HTTP-only JWT cookie sessions, role-aware pages.
- Dashboard: greeting, next meeting, countdown status, quick RSVP, RSVP stats, latest announcement, daily verse, recent prayer requests, upcoming events.
- Meetings: admin create/delete, member details, RSVP, arrival status, check-in, admin attendance marking, volunteers, Google Maps redirect.
- Announcements: admin creation, priorities, pinned first.
- Resources: searchable study materials with metadata and optional URLs.
- Prayer: public/private requests, request status, user-level “I prayed” records.
- Discussions: default seeded channels, posts, admin message deletion.
- Reading: admin reading plan entries, member completion tracking, progress percentage.
- Directory: member directory and profile privacy for phone visibility.
- Reports: admin attendance chart, RSVP chart, member attendance percentages, prayer engagement, reading completion.
- PWA: manifest, icon, and production service worker registration.
- Android and iOS: Capacitor 8 projects, bundled mobile UI, secure native session
  storage, native navigation/back handling, safe areas, icons, splash screens, and
  complete member/admin feature parity through `/api/mobile/v1`.

## New Developer Setup

Prerequisites:

- Docker Desktop or Docker Engine with Docker Compose
- Git

Clone the repository, then run:

```bash
docker compose up --build
```

The application will be available at http://localhost:3000.

Useful commands:

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f db
docker compose down
```

## Local Development Without Docker

For local development outside containers, install Node.js 20 and PostgreSQL, then:

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Environment

Set a strong `JWT_SECRET` before deploying beyond local development. The bundled Docker Compose file uses a local-only default database password and app secret for convenience.

To enable Google sign-in, create an OAuth 2.0 Web application in Google Cloud.
Add the local callback and the callback for every deployed domain as authorized
redirect URIs:

```text
http://localhost:3000/api/auth/google/callback
https://your-deployed-domain.example/api/auth/google/callback
```

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in both local and deployment
environments. The application detects the deployed HTTPS origin automatically.
Set `APP_URL` to the canonical production origin when using a custom
domain or a reverse proxy whose forwarded host is not the public domain.

For HTTPS deployments, set:

```bash
COOKIE_SECURE=true
NEXT_PUBLIC_APP_URL=https://your-domain.example
MOBILE_ALLOWED_ORIGINS=capacitor://localhost,https://localhost
SEED_DATABASE=false
```

For local HTTP development, the default `NEXT_PUBLIC_APP_URL=http://localhost:3000` keeps the session cookie usable in the browser.
The local Docker Compose service explicitly enables `SEED_DATABASE=true` to
provide demo accounts. Keep seeding disabled in production so a restart cannot
overwrite credentials or live data. If a new production database must be
seeded, set unique `SEED_ADMIN_PASSWORD` and `SEED_MEMBER_PASSWORD` values of at
least 12 characters for the first deployment, then disable seeding.
