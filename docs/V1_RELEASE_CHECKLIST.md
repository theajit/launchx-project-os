# LaunchX Project OS v1.0.0 Release Checklist

## Release goal

Ship LaunchX Project OS as an internal collaborative execution platform for CEO, CTO, CTPO, CGO, and external stakeholders.

## Included in v1.0.0

### People / Stakeholders
- Internal CXO team view.
- External project stakeholders.
- Stakeholder categories: Vendor, Client, Agency, Freelancer, Consultant, Partner, Legal, Finance.
- Tasks can be assigned to either internal members or external stakeholders.
- External stakeholders are assignment targets only; they do not have login access in v1.

### Templates

Epic templates:
- Travel Package Launch
- SaaS Product
- Restaurant Launch
- Marketing Campaign
- Fundraising
- Hiring
- Customer Implementation
- Compliance / Audit

Project templates:
- Triphulu
- LaunchX
- KitchenOS
- Pin Code Café
- Odia Nanaa

### Dashboard
- Project-scoped dashboard.
- My Work.
- Due this week.
- Overdue.
- Blocked / waiting on external stakeholders.
- Recent decisions.
- Activity timeline.

### Core modules
- Projects
- Notes
- Tasks
- Decisions / ADRs
- Weekly priorities
- People
- Templates
- Activity
- Settings

### Platform
- PostgreSQL-backed workspace.
- Versioned migrations.
- API smoke script.
- PWA shell and service worker.
- Offline queue foundation.
- JSON backup / restore.
- Responsive dark/light UI.

## Smoke test before tag

### API

```bash
cd api
npm install
npm run build
API_BASE_URL=https://api.launchx.in npm run smoke
```

Expected:
- `/` responds.
- `/health` responds.
- `/db/health` responds.

### Frontend

```bash
cd frontend
npm install
npm run build
```

Expected:
- TypeScript build passes.
- Vite build passes.

### Product smoke

1. Login as CEO.
2. Create a project from a project template.
3. Apply an epic template to that project.
4. Create an external stakeholder.
5. Create a task.
6. Assign the task to an internal user.
7. Reassign the task to an external stakeholder.
8. Move the task from Todo to In Progress.
9. Create an ADR.
10. Create a weekly priority.
11. Refresh the browser and confirm data persists.
12. Login as CTO/CTPO/CGO in another browser and confirm data is visible.

## Dokploy deploy order

1. Deploy API first.
2. Confirm `https://api.launchx.in/health`.
3. Confirm `https://api.launchx.in/db/health`.
4. Deploy frontend.
5. Hard refresh browser.
6. Run product smoke.

## Tag command

```bash
git checkout main
git pull
git tag -a v1.0.0 -m "LaunchX Project OS v1.0.0 - Collaborative Execution Platform"
git push origin v1.0.0
```

## Freeze policy after v1.0.0

Until the Triphulu map milestone is complete:
- Only bug fixes.
- Only data-safety fixes.
- Only tiny UI fixes.
- No new core modules.
