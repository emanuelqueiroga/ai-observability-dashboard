import { NextResponse } from "next/server";
import { createProject, listProjects, type CreateProjectInput } from "@/lib/projects";

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
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const project = createProject(asCreateProjectInput(payload));

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid project payload";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
