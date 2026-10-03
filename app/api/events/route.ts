import { NextResponse } from "next/server";
import {
  createEvent,
  EventProjectNotFoundError,
  listEventsForProject,
} from "@/lib/events";

const EVENT_INVALID_PAYLOAD = "Invalid event payload";
const EVENT_STORE_UNAVAILABLE = "Event store is unavailable";
const DATABASE_URL_MISSING = "DATABASE_URL is missing";

function normalizeEventPayload(payload: unknown): Parameters<typeof createEvent>[0] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (
    typeof record.projectId !== "string" ||
    record.projectId.trim() === "" ||
    typeof record.type !== "string" ||
    record.type.trim() === "" ||
    typeof record.message !== "string" ||
    (record.level !== "info" && record.level !== "warning" && record.level !== "error") ||
    typeof record.tokens !== "number" ||
    !Number.isFinite(record.tokens) ||
    typeof record.costUsd !== "number" ||
    !Number.isFinite(record.costUsd) ||
    typeof record.latencyMs !== "number" ||
    !Number.isFinite(record.latencyMs)
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

function storeUnavailableResponse() {
  return NextResponse.json({ error: EVENT_STORE_UNAVAILABLE }, { status: 500 });
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: DATABASE_URL_MISSING }, { status: 503 });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    return NextResponse.json({ events: await listEventsForProject(projectId) });
  } catch {
    return storeUnavailableResponse();
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: DATABASE_URL_MISSING }, { status: 503 });
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

  try {
    const event = await createEvent(normalized);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof EventProjectNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return storeUnavailableResponse();
  }
}
