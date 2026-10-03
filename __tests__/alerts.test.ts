import { describe, expect, it, vi } from "vitest";
import {
  buildAlertsForEvent,
  insertAlertsForEvent,
  listAlerts,
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

  it("persists derived alerts through the supplied executor", async () => {
    const execute = vi.fn(async () => ({ rows: [] }));

    const alerts = await insertAlertsForEvent(
      {
        id: "evt_err",
        projectId: "proj_1",
        type: "integration.failed",
        message: "provider timeout",
        level: "error",
        tokens: 10,
        costUsd: 0,
        latencyMs: 20,
        createdAt: "2026-10-03T00:00:00.000Z",
      },
      execute,
    );

    expect(alerts).toHaveLength(1);
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining("insert into alerts"),
      expect.arrayContaining(["alert_evt_err_error", "proj_1", "error"]),
    );
  });

  it("queries alerts for a project and normalizes Date timestamps", async () => {
    const execute = vi.fn(async () => ({
      rows: [
        {
          id: "alert_1",
          project_id: "proj_1",
          severity: "error",
          title: "Falha",
          message: "boom",
          created_at: new Date("2026-10-03T00:00:00.000Z"),
        },
      ],
    }));

    const alerts = await listAlerts("proj_1", execute);

    expect(alerts).toMatchObject([
      { id: "alert_1", projectId: "proj_1", createdAt: "2026-10-03T00:00:00.000Z" },
    ]);
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining("where project_id = $1"),
      ["proj_1"],
    );
  });
});
