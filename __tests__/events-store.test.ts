import { describe, expect, it, beforeEach, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("pg", () => ({
  Pool: class {
    query = queryMock;
  },
}));

import { createEvent, listEventsForProject } from "@/lib/events";

const eventRow = {
  id: "evt_1",
  project_id: "proj-a",
  type: "model_call.completed",
  message: "gpt-5.5 latency 4.2s",
  level: "info" as const,
  model: "gpt-5.5",
  tokens: 1200,
  cost_usd: "0.14",
  latency_ms: 4200,
  created_at: "2026-10-03T00:00:00.000Z",
};

beforeEach(() => {
  delete (globalThis as Record<string, unknown>).pgPool;
  queryMock.mockReset();
  process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/z";
});

describe("events store (postgres)", () => {
  it("creates and lists events per project", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const event = await createEvent({
      projectId: "proj-a",
      type: "model_call.completed",
      message: "gpt-5.5 latency 4.2s",
      level: "info",
      model: "gpt-5.5",
      tokens: 1200,
      costUsd: 0.14,
      latencyMs: 4200,
    });

    expect(event).toMatchObject({
      projectId: "proj-a",
      type: "model_call.completed",
      level: "info",
      model: "gpt-5.5",
    });
    expect(event.id).toMatch(/^evt_/);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("insert into events"),
      expect.arrayContaining(["proj-a", "model_call.completed"]),
    );

    queryMock.mockResolvedValueOnce({ rows: [eventRow] });

    const events = await listEventsForProject("proj-a");

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      projectId: "proj-a",
      type: "model_call.completed",
      level: "info",
      model: "gpt-5.5",
      costUsd: 0.14,
    });
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining("where project_id = $1"),
      ["proj-a"],
    );
  });

  it("returns an empty list when the project has no events", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await expect(listEventsForProject("proj-empty")).resolves.toEqual([]);
  });

  it("propagates database errors", async () => {
    queryMock.mockRejectedValueOnce(new Error("connection refused"));

    await expect(listEventsForProject("proj-a")).rejects.toThrow("connection refused");
  });
});
