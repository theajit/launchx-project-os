import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from './db.js';
import { ensureSchema } from './migrate.js';

type Role = 'CEO' | 'CTO' | 'CTPO' | 'CGO';
type AuthUser = { userId: string; organizationId: string; role: Role; email: string };
type ProjectRow = { id: string; name: string; description: string; status: 'Idea' | 'Active' | 'Paused' | 'Completed'; priority: 'Low' | 'Medium' | 'High' };

declare module '@fastify/jwt' { interface FastifyJWT { payload: AuthUser; user: AuthUser; } }

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 8080);
const jwtSecret = process.env.JWT_SECRET ?? 'dev-only-change-me';
const allowedOrigin = process.env.CORS_ORIGIN ?? '*';

await ensureSchema();
await app.register(cors, { origin: allowedOrigin === '*' ? true : allowedOrigin, credentials: true });
await app.register(sensible);
await app.register(jwt, { secret: jwtSecret });

async function requireAuth(request: any) { await request.jwtVerify(); return request.user as AuthUser; }
function requireCEO(user: AuthUser, reply: any) { if (user.role !== 'CEO') { reply.forbidden('Only CEO can manage team members'); return false; } return true; }
async function logActivity(user: AuthUser, entityType: string, entityId: string | null, action: string, metadata = {}) { await query('insert into activity_logs (organization_id, user_id, entity_type, entity_id, action, metadata) values ($1,$2,$3,$4,$5,$6)', [user.organizationId, user.userId, entityType, entityId, action, metadata]); }

app.get('/', async () => ({ ok: true, service: 'launchx-project-os-api', endpoints: ['/health','/db/health','/auth/login','/workspace','/team/members'] }));
app.get('/health', async () => ({ ok: true, service: 'launchx-project-os-api' }));
app.get('/db/health', async () => { const rows = await query<{ ok: number }>('select 1 as ok'); return { ok: rows[0]?.ok === 1 }; });

app.post('/auth/bootstrap', async (request, reply) => {
  const body = z.object({ organizationName: z.string().min(2), name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(['CEO','CTO','CTPO','CGO']).default('CEO') }).parse(request.body);
  const existing = await query<{ id: string }>('select id from users where email=$1', [body.email]);
  if (existing.length) return reply.conflict('User already exists');
  const passwordHash = await bcrypt.hash(body.password, 12);
  const org = await query<{ id: string }>('insert into organizations (name) values ($1) returning id', [body.organizationName]);
  const user = await query<{ id: string }>('insert into users (email, name, password_hash) values ($1,$2,$3) returning id', [body.email, body.name, passwordHash]);
  await query('insert into organization_members (organization_id, user_id, role) values ($1,$2,$3)', [org[0].id, user[0].id, body.role]);
  const token = app.jwt.sign({ userId: user[0].id, organizationId: org[0].id, role: body.role, email: body.email });
  return { token, user: { id: user[0].id, email: body.email, name: body.name, role: body.role }, organization: { id: org[0].id, name: body.organizationName } };
});

app.post('/auth/login', async (request, reply) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(request.body);
  const rows = await query<{ id: string; email: string; name: string; password_hash: string; organization_id: string; role: Role }>('select u.id, u.email, u.name, u.password_hash, om.organization_id, om.role from users u join organization_members om on om.user_id=u.id where u.email=$1 limit 1', [body.email]);
  const user = rows[0];
  if (!user) return reply.unauthorized('Invalid credentials');
  const valid = await bcrypt.compare(body.password, user.password_hash);
  if (!valid) return reply.unauthorized('Invalid credentials');
  const token = app.jwt.sign({ userId: user.id, organizationId: user.organization_id, role: user.role, email: user.email });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
});

app.get('/me', async (request) => {
  const user = await requireAuth(request);
  const rows = await query('select u.id, u.email, u.name, om.role, o.id as organization_id, o.name as organization_name from users u join organization_members om on om.user_id=u.id join organizations o on o.id=om.organization_id where u.id=$1 and o.id=$2', [user.userId, user.organizationId]);
  return rows[0];
});

app.get('/team/members', async (request) => {
  const user = await requireAuth(request);
  return query('select u.id, u.email, u.name, om.role, om.created_at from users u join organization_members om on om.user_id=u.id where om.organization_id=$1 order by case om.role when \'CEO\' then 1 when \'CTO\' then 2 when \'CTPO\' then 3 when \'CGO\' then 4 else 9 end, u.name', [user.organizationId]);
});

app.post('/team/members', async (request, reply) => {
  const user = await requireAuth(request);
  if (!requireCEO(user, reply)) return;
  const body = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(['CTO','CTPO','CGO']) }).parse(request.body);
  const existing = await query<{ id: string }>('select id from users where email=$1', [body.email]);
  let memberId = existing[0]?.id;
  if (!memberId) {
    const passwordHash = await bcrypt.hash(body.password, 12);
    const created = await query<{ id: string }>('insert into users (email, name, password_hash) values ($1,$2,$3) returning id', [body.email, body.name, passwordHash]);
    memberId = created[0].id;
  }
  const membership = await query('select user_id from organization_members where organization_id=$1 and user_id=$2', [user.organizationId, memberId]);
  if (membership.length) return reply.conflict('User is already a member of this workspace');
  await query('insert into organization_members (organization_id, user_id, role) values ($1,$2,$3)', [user.organizationId, memberId, body.role]);
  await logActivity(user, 'member', memberId, 'created', { email: body.email, role: body.role });
  return { ok: true, member: { id: memberId, name: body.name, email: body.email, role: body.role } };
});

app.patch('/team/members/:id', async (request, reply) => {
  const user = await requireAuth(request);
  if (!requireCEO(user, reply)) return;
  const params = z.object({ id: z.string().uuid() }).parse(request.params);
  const body = z.object({ role: z.enum(['CTO','CTPO','CGO']) }).parse(request.body);
  await query('update organization_members set role=$1 where organization_id=$2 and user_id=$3 and role <> \'CEO\'', [body.role, user.organizationId, params.id]);
  await logActivity(user, 'member', params.id, 'role_updated', { role: body.role });
  return { ok: true };
});

app.delete('/team/members/:id', async (request, reply) => {
  const user = await requireAuth(request);
  if (!requireCEO(user, reply)) return;
  const params = z.object({ id: z.string().uuid() }).parse(request.params);
  await query('delete from organization_members where organization_id=$1 and user_id=$2 and role <> \'CEO\'', [user.organizationId, params.id]);
  await logActivity(user, 'member', params.id, 'removed');
  return { ok: true };
});

app.get('/workspace', async (request) => {
  const user = await requireAuth(request);
  const [projects, notes, tasks, decisions, weekly, members] = await Promise.all([
    query('select * from projects where organization_id=$1 order by updated_at desc', [user.organizationId]),
    query('select * from notes where organization_id=$1 order by updated_at desc', [user.organizationId]),
    query('select * from tasks where organization_id=$1 order by updated_at desc', [user.organizationId]),
    query('select * from decisions where organization_id=$1 order by updated_at desc', [user.organizationId]),
    query('select * from weekly_priorities where organization_id=$1 order by created_at desc', [user.organizationId]),
    query('select u.id, u.email, u.name, om.role from users u join organization_members om on om.user_id=u.id where om.organization_id=$1', [user.organizationId]),
  ]);
  return { projects, notes, tasks, decisions, weekly, members };
});

app.post('/workspace/import', async (request) => {
  const user = await requireAuth(request);
  const item = z.object({ id: z.string().optional(), projectId: z.string().optional(), name: z.string().optional(), title: z.string().optional(), description: z.string().optional(), content: z.string().optional(), status: z.string().optional(), priority: z.string().optional(), owner: z.string().optional(), decision: z.string().optional(), consequences: z.string().optional(), done: z.boolean().optional() });
  const body = z.object({ projects: z.array(item).default([]), notes: z.array(item).default([]), tasks: z.array(item).default([]), decisions: z.array(item).default([]), weekly: z.array(item).default([]), replace: z.boolean().default(false) }).parse(request.body);
  if (body.replace) { await query('delete from weekly_priorities where organization_id=$1', [user.organizationId]); await query('delete from decisions where organization_id=$1', [user.organizationId]); await query('delete from tasks where organization_id=$1', [user.organizationId]); await query('delete from notes where organization_id=$1', [user.organizationId]); await query('delete from projects where organization_id=$1', [user.organizationId]); }
  const projectMap = new Map<string, string>();
  for (const p of body.projects) { const rows = await query<{ id: string }>('insert into projects (organization_id, name, description, status, priority, owner_user_id) values ($1,$2,$3,$4,$5,$6) returning id', [user.organizationId, p.name ?? p.title ?? 'Untitled project', p.description ?? '', ['Idea','Active','Paused','Completed'].includes(p.status ?? '') ? p.status : 'Idea', ['Low','Medium','High'].includes(p.priority ?? '') ? p.priority : 'Medium', user.userId]); if (p.id) projectMap.set(p.id, rows[0].id); }
  const firstProject = [...projectMap.values()][0] ?? null;
  for (const n of body.notes) await query('insert into notes (organization_id, project_id, title, content, created_by) values ($1,$2,$3,$4,$5)', [user.organizationId, (n.projectId && projectMap.get(n.projectId)) || firstProject, n.title ?? 'Untitled note', n.content ?? '', user.userId]);
  for (const t of body.tasks) await query('insert into tasks (organization_id, project_id, title, description, status, priority, created_by) values ($1,$2,$3,$4,$5,$6,$7)', [user.organizationId, (t.projectId && projectMap.get(t.projectId)) || firstProject, t.title ?? 'Untitled task', t.description ?? '', ['Todo','In Progress','Done'].includes(t.status ?? '') ? t.status : 'Todo', ['Low','Medium','High'].includes(t.priority ?? '') ? t.priority : 'Medium', user.userId]);
  for (const d of body.decisions) await query('insert into decisions (organization_id, project_id, title, decision, consequences, created_by) values ($1,$2,$3,$4,$5,$6)', [user.organizationId, (d.projectId && projectMap.get(d.projectId)) || firstProject, d.title ?? 'ADR: Untitled', d.decision ?? '', d.consequences ?? '', user.userId]);
  for (const w of body.weekly) await query('insert into weekly_priorities (organization_id, project_id, title, done, created_by) values ($1,$2,$3,$4,$5)', [user.organizationId, (w.projectId && projectMap.get(w.projectId)) || firstProject, w.title ?? 'Untitled priority', w.done ?? false, user.userId]);
  await logActivity(user, 'workspace', null, 'imported', { projects: body.projects.length, notes: body.notes.length, tasks: body.tasks.length, decisions: body.decisions.length, weekly: body.weekly.length, replace: body.replace });
  return { ok: true, imported: { projects: body.projects.length, notes: body.notes.length, tasks: body.tasks.length, decisions: body.decisions.length, weekly: body.weekly.length } };
});

app.post('/projects', async (request) => { const user = await requireAuth(request); const body = z.object({ name: z.string().min(1), description: z.string().default(''), status: z.enum(['Idea','Active','Paused','Completed']).default('Idea'), priority: z.enum(['Low','Medium','High']).default('Medium') }).parse(request.body); const rows = await query<{ id: string }>('insert into projects (organization_id, name, description, status, priority, owner_user_id) values ($1,$2,$3,$4,$5,$6) returning *', [user.organizationId, body.name, body.description, body.status, body.priority, user.userId]); await logActivity(user, 'project', rows[0].id, 'created', { name: body.name }); return rows[0]; });
app.patch('/projects/:id', async (request, reply) => { const user = await requireAuth(request); const params = z.object({ id: z.string().uuid() }).parse(request.params); const body = z.object({ name: z.string().min(1).optional(), description: z.string().optional(), status: z.enum(['Idea','Active','Paused','Completed']).optional(), priority: z.enum(['Low','Medium','High']).optional() }).parse(request.body); const current = await query<ProjectRow>('select id, name, description, status, priority from projects where id=$1 and organization_id=$2', [params.id, user.organizationId]); const existing = current[0]; if (!existing) return reply.notFound('Project not found'); const rows = await query('update projects set name=$1, description=$2, status=$3, priority=$4, updated_at=now() where id=$5 and organization_id=$6 returning *', [body.name ?? existing.name, body.description ?? existing.description, body.status ?? existing.status, body.priority ?? existing.priority, params.id, user.organizationId]); await logActivity(user, 'project', params.id, 'updated', body); return rows[0]; });
app.delete('/projects/:id', async (request) => { const user = await requireAuth(request); const params = z.object({ id: z.string().uuid() }).parse(request.params); await query('delete from projects where id=$1 and organization_id=$2', [params.id, user.organizationId]); await logActivity(user, 'project', params.id, 'deleted'); return { ok: true }; });
app.get('/activity', async (request) => { const user = await requireAuth(request); return query('select al.*, u.name, u.email from activity_logs al left join users u on u.id=al.user_id where al.organization_id=$1 order by al.created_at desc limit 100', [user.organizationId]); });

app.listen({ port, host: '0.0.0.0' });
