# LaunchX Project OS — Founder Operator Runbook

## Purpose

LaunchX Project OS v1 is the execution cockpit for Ajit's active ventures. It is not a generic task tracker. It should be used to convert ideas, conversations, calls, vendor follow-ups, product decisions, and weekly commitments into visible execution records.

## Active project portfolio

Create or maintain one project for each active initiative:

1. **LaunchX** — consulting, MSME advisory, founder operating system, client delivery.
2. **Triphulu** — travel SaaS, package discovery, map milestone, supplier workflow.
3. **KitchenOS** — POS and restaurant SaaS.
4. **Pin Code Café** — café operations, launch, menu, vendors, marketing.
5. **Odia Nanaa** — restaurant execution, outlet setup, staffing, menu economics.
6. **Personal Website / Ajit Brand** — positioning, LinkedIn, newsletter, founder story.

Archived or experimental ideas can be added later, but v1 should stay focused on projects that are actively moving.

## Daily operating rhythm

### Morning — 10 minutes

1. Open Dashboard.
2. Review **My Work**, **Overdue**, and **Due this week**.
3. Pick 3 execution items for the day.
4. Move stale tasks to the right status: Todo, In Progress, or Done.

### During the day — capture immediately

Use the system whenever something happens:

- A vendor gives a quote → add a note or task.
- A partner commits to something → create a task with owner/stakeholder.
- A strategic choice is made → create an ADR.
- A phone call changes scope → add note + decision.
- A pending external dependency appears → assign the task to an external stakeholder.

### Evening — 10 minutes

1. Mark completed tasks as Done.
2. Convert loose notes into tasks or ADRs.
3. Update weekly priorities.
4. Check if any external stakeholder is blocking progress.

## Weekly review ritual

Run this once every week, ideally Sunday evening or Monday morning.

For each active project:

1. Review open tasks.
2. Delete or close dead tasks.
3. Add 3 weekly priorities max.
4. Review recent ADRs.
5. Check external stakeholders.
6. Confirm what must ship this week.

Rule: if everything is priority, nothing is priority. Keep weekly priorities brutal and small.

## How to use modules

### Projects

Use projects as operating containers. Each project should have:

- Clear name.
- One-line execution thesis.
- Status: Idea, Active, Paused, Completed.
- Owner role or person.

### Notes

Use notes for raw thinking and call logs.

Suggested note titles:

- `Call notes — <person/company> — <date>`
- `Vendor discussion — <vendor> — <date>`
- `Idea scratchpad — <topic>`
- `Meeting summary — <project> — <date>`

### Tasks

Use tasks only for action. A task must start with a verb.

Good:

- `Finalize Pin Code Café opening menu`
- `Call designer for LaunchX website section`
- `Confirm Triphulu map milestone scope`

Bad:

- `Menu`
- `Website`
- `Triphulu`

### Decisions / ADRs

Use ADRs when reversing the decision later would be costly or confusing.

Create ADRs for:

- Architecture decisions.
- Pricing model decisions.
- Partner role decisions.
- Vendor selection.
- Product scope boundaries.
- Launch/deployment strategy.

ADR format:

- Context: why this decision exists.
- Decision: what was chosen.
- Consequence: what trade-off was accepted.

### Weekly priorities

Weekly priorities are the CEO operating focus. Keep them few.

Examples:

- `Ship Triphulu map milestone`
- `Deploy LaunchX Project OS V1`
- `Finalize Pin Code Café vendor list`
- `Close Odia Nanaa seating layout`

### People / Stakeholders

Use internal members for CXO execution:

- CEO
- CTO
- CTPO
- CGO

Use external stakeholders for non-login participants:

- Vendor
- Client
- Agency
- Freelancer
- Consultant
- Partner
- Legal
- Finance

Assign tasks to external stakeholders when work is blocked by them.

## Recommended project templates

Use these templates as starting points:

- **Travel Package Launch** for Triphulu packages.
- **SaaS Product** for KitchenOS and LaunchX Project OS.
- **Restaurant Launch** for Pin Code Café and Odia Nanaa.
- **Marketing Campaign** for LinkedIn, launch posts, reels, and campaigns.
- **Hiring** for intern, trainee, designer, developer, or CXO hiring.
- **Customer Implementation** for LaunchX consulting clients.
- **Compliance / Audit** for formal documentation and operating processes.

## V1 stability policy

After v1 release:

Allowed:

- Bug fixes.
- UI polish.
- Deployment fixes.
- Data safety improvements.
- Small workflow improvements.

Not allowed without a new version plan:

- Rebuilding the architecture.
- Replacing PostgreSQL.
- Adding large AI modules.
- Adding complex team permissions.
- Changing project structure.

## Golden rules

1. Every meeting should create either a note, task, or ADR.
2. Every strategic decision should become an ADR.
3. Every weekly priority should be tied to a project.
4. Every external blocker should be assigned to a stakeholder.
5. Every Sunday/Monday, clean the board.

## V1 success definition

LaunchX Project OS v1 is successful if Ajit can use it daily to answer:

- What am I building?
- What is blocked?
- Who owns what?
- What did we decide?
- What must move this week?
- Which venture needs attention now?
