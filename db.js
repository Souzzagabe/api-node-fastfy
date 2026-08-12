import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');
const createVideosSql = fs.readFileSync(path.join(migrationsDir, '001-create-videos-table.sql'), 'utf8');

const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initDatabase() {
  await sql.unsafe(createVideosSql);
}

export async function closeDatabase() {
  await sql.end();
}

export async function listVideos(search) {
  if (search) {
    const pattern = `%${search}%`;
    return sql`
      SELECT id, title, description, duration, created_at
      FROM videos
      WHERE title ILIKE ${pattern}
      ORDER BY created_at DESC
    `;
  }

  return sql`
    SELECT id, title, description, duration, created_at
    FROM videos
    ORDER BY created_at DESC
  `;
}

export async function createVideo({ title, description, duration }) {
  const id = randomUUID();
  await sql`
    INSERT INTO videos (id, title, description, duration)
    VALUES (${id}, ${title}, ${description}, ${duration})
  `;
  return id;
}

export async function updateVideo(id, { title, description, duration }) {
  const result = await sql`
    UPDATE videos
    SET title = ${title},
        description = ${description},
        duration = ${duration}
    WHERE id = ${id}
  `;
  return result.count > 0;
}

export async function deleteVideo(id) {
  await sql`
    DELETE FROM videos
    WHERE id = ${id}
  `;
}
