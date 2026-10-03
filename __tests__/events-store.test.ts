import { describe, expect, it, beforeEach } from "vitest";
import {
  createEvent,
  listEventsForProject,
  resetEventsForTests,
  setEventStorePathForTests,
} from "@/lib/events";

const testPath = "/tmp/ai-observability-events-test.json";

beforeEach(() => {
  process.env.DATABASE_URL = "";
  setEventStorePathForTests(testPath);
  resetEventsForTests();
});

describe("events store (file fallback)", () => {
  it("creates and lists events per project", () => {
    createEvent({
      projectId: "proj-a",
      type: "model_call.completed",
      message: "gpt-5.5 latency 4.2s",
      level: "info",
      model: "gpt-5.5",
      tokens: 1200,
      costUsd: 0.14,
      latencyMs: 4200,
    });

    createEvent({
      projectId: "proj-b",
      type: "alert.integration",
      message: "Provider timeout",
      level: "warning",
      model: "gpt-5.5",
      tokens: 0,
      costUsd: 0,
      latencyMs: 10000,
    });

    expect(listEventsForProject("proj-a")).toHaveLength(1);
    expect(listEventsForProject("proj-b")).toHaveLength(1);
    expect(listEventsForProject("proj-a")[0]).toMatchObject({
      projectId: "proj-a",
      type: "model_call.completed",
      level: "info",
      model: "gpt-5.5",
    });
  });
});
