import type { ObservabilityEvent } from "@/lib/events";

export type Alert = {
  id: string;
  projectId: string;
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  createdAt: string;
};

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

export function createAlert(input: Omit<Alert, "id" | "createdAt"> & { id?: string; createdAt?: string }): Alert {
  return {
    id: input.id ?? `alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    projectId: input.projectId,
    severity: input.severity,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function listAlerts(): Alert[] {
  return [];
}
