import { NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/projects";
import { listEventsForProject } from "@/lib/events";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is missing" }, { status: 503 });
  }

  const { slug } = await context.params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    project,
    events: await listEventsForProject(project.id),
  });
}
