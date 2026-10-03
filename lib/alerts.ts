import { query, toIsoString, type SqlExecutor } from "@/lib/db";
import type { ObservabilityEvent } from "@/lib/events";

export type AlertSeverity = "info" | "warning" | "error";

export type Alert = {
  id: string;
  projectId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: string;
};

type AlertRow = {
  id: string;
  project_id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  created_at: string | Date;
};

const ALERT_INSERT = `insert into alerts (id, project_id, severity, title, message, created_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do nothing`;

function rowToAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    projectId: row.project_id,
    severity: row.severity,
    title: row.title,
    message: row.message,
    createdAt: toIsoString(row.created_at),
  };
}

export function buildAlert(
  input: Omit<Alert, "id" | "createdAt"> & { id?: string; createdAt?: string },
): Alert {
  return {
    id:
      input.id ??
      `alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    projectId: input.projectId,
    severity: input.severity,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function buildAlertsForEvent(event: ObservabilityEvent): Alert[] {
  const alerts: Alert[] = [];

  if (event.tokens > 100000) {
    alerts.push({
      id: `alert_${event.id}_tokens`,
      projectId: event.projectId,
      severity: "warning",
      title: "Contexto quase acabando",
      message: `Evento ${event.id} já consumiu ${event.tokens} tokens.`,
      createdAt: event.createdAt,
    });
  }

  if (event.level === "error") {
    alerts.push({
      id: `alert_${event.id}_error`,
      projectId: event.projectId,
      severity: "error",
      title: "Falha de integração/execução",
      message: event.message,
      createdAt: event.createdAt,
    });
  }

  if (event.latencyMs > 8000) {
    alerts.push({
      id: `alert_${event.id}_latency`,
      projectId: event.projectId,
      severity: "warning",
      title: "Latência alta",
      message: `${event.type} demorou ${event.latencyMs}ms.`,
      createdAt: event.createdAt,
    });
  }

  return alerts;
}

async function insertAlert(alert: Alert, execute: SqlExecutor): Promise<void> {
  await execute(ALERT_INSERT, [
    alert.id,
    alert.projectId,
    alert.severity,
    alert.title,
    alert.message,
    alert.createdAt,
  ]);
}

/**
 * Persists the alerts derived from an event. Idempotent: the deterministic ids
 * plus `on conflict (id) do nothing` make a retried insert a no-op.
 */
export async function insertAlertsForEvent(
  event: ObservabilityEvent,
  execute: SqlExecutor,
): Promise<Alert[]> {
  const alerts = buildAlertsForEvent(event);

  for (const alert of alerts) {
    await insertAlert(alert, execute);
  }

  return alerts;
}

export async function createAlert(
  input: Omit<Alert, "id" | "createdAt"> & { id?: string; createdAt?: string },
  execute: SqlExecutor = query,
): Promise<Alert> {
  const alert = buildAlert(input);
  await insertAlert(alert, execute);
  return alert;
}

export async function listAlerts(
  projectId?: string,
  execute: SqlExecutor = query,
): Promise<Alert[]> {
  const result = projectId
    ? await execute(
        "select * from alerts where project_id = $1 order by created_at desc",
        [projectId],
      )
    : await execute("select * from alerts order by created_at desc");

  return (result.rows as AlertRow[]).map(rowToAlert);
}
