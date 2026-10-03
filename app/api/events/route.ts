import { NextResponse } from "next/server";
import { createEvent, listEventsForProject } from "@/lib/events";

const EVENT_INVALID_PAYLOAD = "Invalid event payload";

function normalizeEventPayload(payload: unknown): Parameters<typeof createEvent>[0] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (
    typeof record.projectId !== "string" ||
    typeof record.type !== "string" ||
    typeof record.message !== "string" ||
    (record.level !== "info" && record.level !== "warning" && record.level !== "error") ||
    typeof record.tokens !== "number" ||
    typeof record.costUsd !== "number" ||
    typeof record.latencyMs !== "number"
  ) {
    return null;
  }

  return {
    projectId: record.projectId,
    type: record.type,
    message: record.message,
    level: record.level,
    model: typeof record.model === "string" ? record.model : undefined,
    tokens: record.tokens,
    costUsd: record.costUsd,
    latencyMs: record.latencyMs,
  };
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is missing" }, { status: 503 });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  return NextResponse.json({ events: await listEventsForProject(projectId) });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is missing" }, { status: 503 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: EVENT_INVALID_PAYLOAD }, { status: 400 });
  }

  const normalized = normalizeEventPayload(payload);

  if (!normalized) {
    return NextResponse.json({ error: EVENT_INVALID_PAYLOAD }, { status: 400 });
  }

  const event = await createEvent(normalized);

  return NextResponse.json({ event }, { status: 201 });
}
