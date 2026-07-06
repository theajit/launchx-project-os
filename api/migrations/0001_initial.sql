create extension if not exists pgcrypto;

do $$ begin
  create type member_role as enum ('CEO','CTO','CTPO','CGO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type project_status as enum ('Idea','Active','Paused','Completed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type priority_level as enum ('Low','Medium','High');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('Todo','In Progress','Done');
exception when duplicate_object then null;
end $$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role member_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  status project_status not null default 'Idea',
  priority priority_level not null default 'Medium',
  owner_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  content text not null default '',
  created_by uuid references users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text not null default '',
  status task_status not null default 'Todo',
  priority priority_level not null default 'Medium',
  assigned_to uuid references users(id),
  due_date date,
  created_by uuid references users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  context text not null default '',
  decision text not null default '',
  consequences text not null default '',
  created_by uuid references users(id),
  decided_at date not null default current_date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists weekly_priorities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  done boolean not null default false,
  week_start date not null default date_trunc('week', current_date)::date,
  created_by uuid references users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_org on projects(organization_id);
create index if not exists idx_notes_org on notes(organization_id);
create index if not exists idx_tasks_org on tasks(organization_id);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assigned_to on tasks(assigned_to);
create index if not exists idx_decisions_org on decisions(organization_id);
create index if not exists idx_weekly_org on weekly_priorities(organization_id);
create index if not exists idx_activity_org on activity_logs(organization_id, created_at desc);
