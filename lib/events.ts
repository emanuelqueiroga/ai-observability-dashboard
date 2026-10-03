import { query } from "@/lib/db";

export type ObservabilityEvent = {
  id: string;
  projectId: string;
  type: string;
  message: string;
  level: "info" | "warning" | "error";
  model?: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  createdAt: string;
};

type EventRow = {
  id: string;
  project_id: string;
  type: string;
  message: string;
  level: "info" | "warning" | "error";
  model: string | null;
  tokens: number;
  cost_usd: string;
  latency_ms: number;
  created_at: string;
};

function rowToEvent(row: EventRow): ObservabilityEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    message: row.message,
    level: row.level,
    model: row.model ?? undefined,
    tokens: row.tokens,
    costUsd: Number(row.cost_usd),
    latencyMs: row.latency_ms,
    createdAt: row.created_at,
  };
}

export async function createEvent(
  input: Omit<ObservabilityEvent, "id" | "createdAt"> & { id?: string; createdAt?: string },
): Promise<ObservabilityEvent> {
  const event: ObservabilityEvent = {
    id: input.id ?? `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    projectId: input.projectId,
    type: input.type,
    message: input.message,
    level: input.level,
    model: input.model,
    tokens: input.tokens,
    costUsd: input.costUsd,
    latencyMs: input.latencyMs,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  await query(
    `insert into events (id, project_id, type, message, level, model, tokens, cost_usd, latency_ms, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      event.id,
      event.projectId,
      event.type,
      event.message,
      event.level,
      event.model ?? null,
      event.tokens,
      event.costUsd,
      event.latencyMs,
      event.createdAt,
    ],
  );

  return event;
}

export async function listEventsForProject(projectId: string): Promise<ObservabilityEvent[]> {
  const result = await query<EventRow>(
    "select * from events where project_id = $1 order by created_at desc",
    [projectId],
  );

  return result.rows.map(rowToEvent);
}
