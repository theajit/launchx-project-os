create table if not exists external_stakeholders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  stakeholder_type text not null default 'External',
  role text not null default '',
  status text not null default 'Active',
  notes text not null default '',
  created_by uuid references users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table tasks add column if not exists assigned_external_id uuid references external_stakeholders(id) on delete set null;
alter table decisions add column if not exists owner_user_id uuid references users(id) on delete set null;
alter table decisions add column if not exists owner_external_id uuid references external_stakeholders(id) on delete set null;

create index if not exists idx_external_stakeholders_org on external_stakeholders(organization_id);
create index if not exists idx_external_stakeholders_project on external_stakeholders(project_id);
create index if not exists idx_tasks_assigned_external on tasks(assigned_external_id);
