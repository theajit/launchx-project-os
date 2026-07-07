import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import 'dotenv/config';
import { z } from 'zod';

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);
const host = process.env.API_HOST ?? '0.0.0.0';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});
await app.register(sensible);

const workspaceSchema = z.object({
  projects: z.array(z.unknown()).default([]),
  notes: z.array(z.unknown()).default([]),
  tasks: z.array(z.unknown()).default([]),
  decisions: z.array(z.unknown()).default([]),
  weekly: z.array(z.unknown()).default([]),
});

type Workspace = z.infer<typeof workspaceSchema>;

let workspace: Workspace = {
  projects: [],
  notes: [],
  tasks: [],
  decisions: [],
  weekly: [],
};

app.get('/health', async () => ({
  ok: true,
  service: 'launchx-project-os-api',
  mode: process.env.NODE_ENV ?? 'development',
}));

app.get('/api/workspace', async () => workspace);

app.put('/api/workspace', async (request, reply) => {
  const parsed = workspaceSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.badRequest('Invalid workspace payload');
  }

  workspace = parsed.data;
  return { ok: true, workspace };
});

app.get('/api/projects', async () => workspace.projects);
app.get('/api/tasks', async () => workspace.tasks);
app.get('/api/notes', async () => workspace.notes);
app.get('/api/decisions', async () => workspace.decisions);
app.get('/api/weekly', async () => workspace.weekly);

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
