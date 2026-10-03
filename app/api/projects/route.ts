import { NextResponse } from "next/server";
import {
  ProjectValidationError,
  createProjectQueued,
  listProjects,
  type CreateProjectInput,
} from "@/lib/projects";

const STORAGE_ERROR_MESSAGE = "Project store is unavailable";
const INVALID_PAYLOAD_MESSAGE = "Invalid project payload";

function asCreateProjectInput(payload: unknown): CreateProjectInput {
  if (!payload || typeof payload !== "object") {
    return { name: "", slug: "" };
  }

  const record = payload as Record<string, unknown>;

  return {
    name: typeof record.name === "string" ? record.name : "",
    slug: typeof record.slug === "string" ? record.slug : "",
    repositoryUrl:
      typeof record.repositoryUrl === "string" ? record.repositoryUrl : undefined,
    description: typeof record.description === "string" ? record.description : undefined,
  };
}

export async function GET() {
  try {
    return NextResponse.json({ projects: await listProjects() });
  } catch {
    return NextResponse.json({ error: STORAGE_ERROR_MESSAGE }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: INVALID_PAYLOAD_MESSAGE }, { status: 400 });
    }

    const project = await createProjectQueued(asCreateProjectInput(payload));

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: STORAGE_ERROR_MESSAGE }, { status: 500 });
  }
}
