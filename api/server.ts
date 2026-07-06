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

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 8080);
const jwtSecret = process.env.JWT_SECRET ?? 'dev-only-change-me';
const allowedOrigin = process.env.CORS_ORIGIN ?? '*';

await ensureSchema();

await app.register(cors, { origin: allowedOrigin === '*' ? true : allowedOrigin, credentials: true });
await app.register(sensible);
await app.register(jwt, { secret: jwtSecret });

async function requireAuth(request: any) {
  await request.jwtVerify();
  return request.user as AuthUser;
}

async function logActivity(user: AuthUser, entityType: string, entityId: string | null, action: string, metadata = {}) {
  await query('insert into activity_logs (organization_id, user_id, entity_type, entity_id, action, metadata) values ($1,$2,$3,$4,$5,$6)', [user.organizationId, user.userId, entityType, entityId, action, metadata]);
}

app.get('/health', async () => ({ ok: true, service: 'launchx-project-os-api' }));

app.get('/db/health', async () => {
  const rows = await query<{ ok: number }>('select 1 as ok');
  return { ok: rows[0]?.ok === 1 };
});

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

app.post('/projects', async (request) => {
  const user = await requireAuth(request);
  const body = z.object({ name: z.string().min(1), description: z.string().default(''), status: z.enum(['Idea','Active','Paused','Completed']).default('Idea'), priority: z.enum(['Low','Medium','High']).default('Medium') }).parse(request.body);
  const rows = await query<{ id: string }>('insert into projects (organization_id, name, description, status, priority, owner_user_id) values ($1,$2,$3,$4,$5,$6) returning *', [user.organizationId, body.name, body.description, body.status, body.priority, user.userId]);
  await logActivity(user, 'project', rows[0].id, 'created', { name: body.name });
  return rows[0];
});

app.patch('/projects/:id', async (request, reply) => {
  const user = await requireAuth(request);
  const params = z.object({ id: z.string().uuid() }).parse(request.params);
  const body = z.object({ name: z.string().min(1).optional(), description: z.string().optional(), status: z.enum(['Idea','Active','Paused','Completed']).optional(), priority: z.enum(['Low','Medium','High']).optional() }).parse(request.body);
  const current = await query('select * from projects where id=$1 and organization_id=$2', [params.id, user.organizationId]);
  if (!current.length) return reply.notFound('Project not found');
  const next = { ...current[0], ...body } as any;
  const rows = await query('update projects set name=$1, description=$2, status=$3, priority=$4, updated_at=now() where id=$5 and organization_id=$6 returning *', [next.name, next.description, next.status, next.priority, params.id, user.organizationId]);
  await logActivity(user, 'project', params.id, 'updated', body);
  return rows[0];
});

app.delete('/projects/:id', async (request) => {
  const user = await requireAuth(request);
  const params = z.object({ id: z.string().uuid() }).parse(request.params);
  await query('delete from projects where id=$1 and organization_id=$2', [params.id, user.organizationId]);
  await logActivity(user, 'project', params.id, 'deleted');
  return { ok: true };
});

app.get('/activity', async (request) => {
  const user = await requireAuth(request);
  return query('select al.*, u.name, u.email from activity_logs al left join users u on u.id=al.user_id where al.organization_id=$1 order by al.created_at desc limit 100', [user.organizationId]);
});

app.listen({ port, host: '0.0.0.0' });
