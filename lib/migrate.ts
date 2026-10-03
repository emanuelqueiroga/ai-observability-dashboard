export function normalizeDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is missing");
  }

  return url;
}

export const migrationStatements = [
  `create table if not exists projects (
    id text primary key,
    name text not null,
    slug text not null unique,
    repository_url text,
    description text,
    status text not null,
    created_at timestamptz not null
  )`,
  `create table if not exists events (
    id text primary key,
    project_id text not null references projects(id) on delete cascade,
    type text not null,
    message text not null,
    level text not null,
    model text,
    tokens integer not null default 0,
    cost_usd numeric not null default 0,
    latency_ms integer not null default 0,
    created_at timestamptz not null
  )`,
  `create table if not exists alerts (
    id text primary key,
    project_id text not null references projects(id) on delete cascade,
    severity text not null,
    title text not null,
    message text not null,
    created_at timestamptz not null
  )`,
  `create index if not exists events_project_id_idx on events (project_id)`,
  `create index if not exists events_created_at_idx on events (created_at desc)`,
  `create index if not exists alerts_project_id_idx on alerts (project_id)`,
];
