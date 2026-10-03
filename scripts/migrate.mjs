import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { migrationStatements } from "../lib/migrate.mjs";

async function run() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    for (const statement of migrationStatements) {
      await pool.query(statement);
    }

    const projectsPath = path.join(process.cwd(), "data", "projects.json");

    if (fs.existsSync(projectsPath)) {
      const projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));

      for (const project of projects) {
        await pool.query(
          `insert into projects (id, name, slug, repository_url, description, status, created_at)
           values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (id) do nothing`,
          [
            project.id,
            project.name,
            project.slug,
            project.repositoryUrl ?? null,
            project.description ?? null,
            project.status,
            project.createdAt,
          ],
        );
      }
    }

    console.log("Database migrated.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
