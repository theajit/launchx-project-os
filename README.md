# LaunchX Project OS

LaunchX Project OS is a founder-led execution cockpit for running LaunchX and Ajit's active ventures from one place.

It is designed for:

- Projects
- Notes
- Tasks
- Decisions / ADRs
- Weekly priorities
- Internal CXO users
- External stakeholders
- Project templates
- Activity tracking
- VPS deployment

## Active ventures supported

V1 is intended to manage execution across:

- LaunchX
- Triphulu
- KitchenOS
- Pin Code Café
- Odia Nanaa
- Personal brand / website work

## Repository structure

```text
/frontend   Vite + React + TypeScript frontend
/api        Fastify + PostgreSQL API
/docs       Release, handover, VPS, and operator documentation
```

The frontend and API are intentionally self-contained so they can be deployed as separate VPS/Dokploy services.

## Local development

Install both apps:

```bash
npm run install:all
```

Run API:

```bash
npm run api:dev
```

Run frontend:

```bash
npm run frontend:dev
```

## Build

Build both services from root:

```bash
npm run build
```

Or individually:

```bash
npm run api:build
npm run frontend:build
```

## API service

Path:

```bash
api/
```

Commands:

```bash
npm install
npm run build
npm run start
```

Environment:

```text
DATABASE_URL=postgres://...
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://launchx.in
AUTO_MIGRATE=true
PORT=8080
```

Health checks:

```text
GET /
GET /health
GET /db/health
```

## Frontend service

Path:

```bash
frontend/
```

Commands:

```bash
npm install
npm run build
npm run start
```

Environment:

```text
VITE_API_BASE_URL=https://api.launchx.in
PORT=3000
```

## VPS / Dokploy deployment model

Deploy two services:

### 1. API

- Build path: `api`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Domain: `api.launchx.in`

### 2. Frontend

- Build path: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Domain: `launchx.in` or selected frontend domain

Deploy API first, confirm health checks, then deploy frontend.

## V1 release docs

Read these before tagging V1:

- `docs/V1_RELEASE_CHECKLIST.md`
- `docs/PROJECT_OS_HANDOVER.md`
- `docs/FOUNDER_OPERATOR_RUNBOOK.md`
- `docs/vps-postgres-setup.md`
- `docs/STABLE_CANDIDATE.md`

## V1 stability policy

After V1:

Allowed:

- Bug fixes
- UI polish
- Deployment fixes
- Data-safety fixes
- Small workflow improvements

Avoid until V1.1/V2:

- Major architecture rewrite
- New core modules
- Complex permission redesign
- AI assistant layer
- External sync integrations

## Current release branch

Use:

```bash
v1-stable
```

`main` should only be updated after build, smoke test, and product smoke pass.
