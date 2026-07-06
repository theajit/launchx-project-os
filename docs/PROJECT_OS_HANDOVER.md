# LaunchX Project OS — Engineering Handover

## Product intent

LaunchX Project OS is a shared execution cockpit for a founder-led CXO team.

Roles:
- CEO: workspace owner, bootstrap, team creation, destructive data recovery/import.
- CTO: technology execution contributor.
- CTPO: product and technical product execution contributor.
- CGO: growth execution contributor.

The product direction is to keep PostgreSQL as the source of truth and use local storage only as a fallback/cache layer.

## Repository structure

```text
/frontend   Vite + React frontend
/api        Fastify + PostgreSQL API
/docs       Architecture, handover, and change documentation
```

## Deployment model

Frontend service:
- Build path: `/frontend`
- Build command: `npm install && npm run build`
- Start/static output: Vite build output, usually `dist`

API service:
- Build path: `/api`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

API health checks:
- `GET /health`
- `GET /db/health`
- `GET /`

Current production URLs:
- Frontend: `https://launchx.in` or configured frontend host
- API: `https://api.launchx.in`

## Environment variables

API:

```text
DATABASE_URL=postgres://...
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://launchx.in
AUTO_MIGRATE=true
PORT=8080
```

Frontend:

```text
VITE_API_BASE_URL=https://api.launchx.in
```

## Current capabilities

### Workspace and auth
- CEO creates the first workspace.
- CEO creates CTO, CTPO, and CGO users.
- Users login using email/password.
- JWT is stored in browser local storage.

### Collaboration
- Projects, notes, tasks, decisions/ADRs, and weekly priorities are shared through the API when logged in.
- Frontend auto-refreshes server workspace every 30 seconds.
- Manual refresh is available in Settings.

### Permissions
- CEO-only:
  - Bootstrap workspace.
  - Create team members.
  - Replace server data from local copy.
- CTO/CTPO/CGO:
  - Contribute to execution data.
  - Cannot replace server data.

### Data modules
- Projects: create/delete visible in UI; update API exists for projects.
- Notes: create/delete visible in UI; markdown preview is supported.
- Tasks: create/delete, status movement, assignment to team members.
- Decisions/ADRs: create/delete and project label visible.
- Weekly priorities: create/delete/toggle completion.
- Activity: audit feed from `/activity`.

## API routes

Auth:
- `POST /auth/bootstrap`
- `POST /auth/login`
- `GET /me`

Team:
- `GET /team/members`
- `POST /team/members`
- `PATCH /team/members/:id`
- `DELETE /team/members/:id`

Workspace:
- `GET /workspace`
- `POST /workspace/import` — CEO-only when replacing server data.

Projects:
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

Notes:
- `POST /notes`
- `PATCH /notes/:id`
- `DELETE /notes/:id`

Tasks:
- `POST /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Decisions:
- `POST /decisions`
- `DELETE /decisions/:id`

Weekly priorities:
- `POST /weekly-priorities`
- `PATCH /weekly-priorities/:id`
- `DELETE /weekly-priorities/:id`

Audit:
- `GET /activity`

## Important implementation notes

1. The frontend has historically moved quickly and contains dense React code. The next refactor should split `App.tsx` into modules:
   - `apiClient.ts`
   - `types.ts`
   - `components/Nav.tsx`
   - `components/Settings.tsx`
   - `views/*`

2. CSS is currently layered through:
   - `styles.css`
   - `dark.css`

   `dark.css` also contains responsive polish overrides. This should eventually be renamed to `overrides.css` or split into `mobile.css`.

3. API schema auto-migration is controlled by `AUTO_MIGRATE`. It reads `schema.sql` from the API build output path.

4. Destructive server replacement must remain CEO-only. Do not expose it for CTO/CTPO/CGO.

5. The current task assignment model stores `assigned_to` on tasks and maps it to team members from `/workspace`.

## Recent build history

### Infrastructure split
- Moved to monorepo structure with `/frontend` and `/api`.
- API deployed independently from frontend.
- PostgreSQL connected and verified through `/db/health`.

### Premium UI restoration
- Restored premium dashboard, dark mode, project cards, notes, tasks, decisions, weekly priorities, JSON backup/import, command palette.

### Sync foundation
- Added auth bootstrap/login.
- Added workspace import to push local data to PostgreSQL.
- Added Settings sync panel.

### Multi-user workspace v1
- Added CEO-managed team member creation.
- Added CTO/CTPO/CGO roles.
- Added team list in Settings.

### CRUD v1
- Added server-backed create/delete for workspace entities.
- Added task assignment.
- Added ADR project labeling.
- Added activity/audit feed.
- Added auto-sync every 30 seconds.

### UI Polish v2
- Improved mobile spacing, safe-area handling, Settings layout, badge width, button stacking, topbar overflow, and bottom nav horizontal behavior.

## Next recommended milestones

1. Frontend refactor into components and API client.
2. True edit forms for project/note/task/ADR/weekly instead of mostly create/delete.
3. Role-based UX rules in frontend, not only backend.
4. Better authentication UX: invite flow, temporary password reset, logout state cleanup.
5. Activity feed filters by entity/project/user.
6. Optimistic updates with rollback.
7. Conflict handling for multi-user edits.
8. Database migration versioning instead of single auto schema file.
9. Tests: API route smoke tests and frontend build check.
10. PWA install polish and offline queue.
