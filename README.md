# FellowshipHub

FellowshipHub is a full-stack Bible Study Fellowship coordination MVP built with Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS, secure cookie sessions, Zod validation, React Hook Form, Recharts, and Docker Compose.

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
password: Admin@12345
```

Member:

```text
email: member@fellowshiphub.local
password: Member@12345
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

For HTTPS deployments, set:

```bash
COOKIE_SECURE=true
NEXT_PUBLIC_APP_URL=https://your-domain.example
```

For local HTTP development, the default `NEXT_PUBLIC_APP_URL=http://localhost:3000` keeps the session cookie usable in the browser.
