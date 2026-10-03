import { isPgErrorWithCode, query, toIsoString, withTransaction } from "@/lib/db";
import { insertAlertsForEvent } from "@/lib/alerts";

export type EventLevel = "info" | "warning" | "error";

export type ObservabilityEvent = {
  id: string;
  projectId: string;
  type: string;
  message: string;
  level: EventLevel;
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
  level: EventLevel;
  model: string | null;
  tokens: number;
  cost_usd: string | number;
  latency_ms: number;
  created_at: string | Date;
};

export class EventProjectNotFoundError extends Error {}

function rowToEvent(row: EventRow): ObservabilityEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    message: row.message,
    level: row.level,
    model: row.model ?? undefined,
    tokens: Number(row.tokens),
    // `numeric` is returned as a string by `pg` to avoid float precision loss.
    costUsd: Number(row.cost_usd),
    latencyMs: Number(row.latency_ms),
    createdAt: toIsoString(row.created_at),
  };
}

function createEventId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createEvent(
  input: Omit<ObservabilityEvent, "id" | "createdAt"> & { id?: string; createdAt?: string },
): Promise<ObservabilityEvent> {
  const event: ObservabilityEvent = {
    id: input.id ?? createEventId(),
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

  try {
    await withTransaction(async (execute) => {
      await execute(
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

      // Alerts are derived and persisted atomically with their event so the
      // dashboard never shows an event without the alerts it should have.
      await insertAlertsForEvent(event, execute);
    });
  } catch (error) {
    if (isPgErrorWithCode(error, "23503")) {
      throw new EventProjectNotFoundError(
        `Project ${event.projectId} does not exist`,
      );
    }

    throw error;
  }

  return event;
}

export async function listEventsForProject(
  projectId: string,
): Promise<ObservabilityEvent[]> {
  const result = await query<EventRow>(
    "select * from events where project_id = $1 order by created_at desc",
    [projectId],
  );

  return result.rows.map(rowToEvent);
}
