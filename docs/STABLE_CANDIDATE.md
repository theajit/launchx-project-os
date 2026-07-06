# LaunchX Project OS — Stable Candidate Checklist

## Stability scope

LaunchX Project OS should be treated as stable for internal use after these items are deployed and smoke-tested:

1. Versioned database migrations.
2. API smoke checks and frontend build checks.
3. PWA shell support and offline queue foundation.
4. Mobile dashboard and Settings UI polish.
5. Project-scoped execution views for tasks, notes, ADRs, and weekly priorities.
6. Friendly dashboard shortcut cards instead of oversized metric blocks.
7. Team/member list layout that does not overlap names and emails.

## Current stability work completed

### Database migrations

- `api/migrate.ts` runs SQL files from `api/migrations` in sorted order.
- Applied migrations are tracked in `schema_migrations`.
- Initial migration lives at `api/migrations/0001_initial.sql`.
- Legacy `schema.sql` remains as fallback only.

### Checks

- API smoke script: `npm run smoke` from `/api`.
- API build plus smoke: `npm run check` from `/api` after the API is running.
- Frontend build check: `npm run build` from `/frontend`.

### PWA and offline foundation

- Manifest added at `frontend/public/manifest.webmanifest`.
- Service worker added at `frontend/public/sw.js`.
- Service worker registered in production from `frontend/src/main.tsx`.
- Offline queue utility added at `frontend/src/offlineQueue.ts`.

### Final UX gate

- Dashboard statistics and lists are scoped to the selected project.
- Notes, tasks, ADRs, and weekly views show selected-project data first.
- Home dashboard cards are compact shortcut cards.
- Assigned/open tasks are shown on the dashboard for the selected project.
- Team member rows use a dedicated `member-card` layout to prevent email/name overlap.

## Freeze guidance

After this pass, avoid adding major LaunchX Project OS features until the Triphulu map milestone is complete. Accept only bug fixes, data-safety fixes, and small UI cleanup.

## Next later improvements

- Refactor `App.tsx` into components and an API client.
- Add full edit forms for all entities.
- Wire offline queue into all write actions.
- Add CI workflow for API build, frontend build, and route smoke checks.
- Add proper PWA icons and install prompt polish.
