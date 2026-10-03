import { describe, expect, it } from "vitest";
import {
  buildAlertsForEvent,
  createAlert,
  listAlerts,
  type Alert,
} from "@/lib/alerts";

describe("alerts domain", () => {
  it("creates token/cost alerts for high token usage", () => {
    const alerts = buildAlertsForEvent({
      id: "evt_1",
      projectId: "proj_1",
      type: "model_call.completed",
      message: "Contexto quase acabando",
      level: "warning",
      model: "gpt-5.5",
      tokens: 120000,
      costUsd: 12.5,
      latencyMs: 4200,
      createdAt: new Date().toISOString(),
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toMatchObject({
      projectId: "proj_1",
      severity: "warning",
      title: "Contexto quase acabando",
    });
  });
});
