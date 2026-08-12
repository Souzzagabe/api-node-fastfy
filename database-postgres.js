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

export class DatabasePostgres {
  constructor() {
    this.sql = postgres(process.env.DATABASE_URL, {
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async init() {
    await this.sql.unsafe(createVideosSql);
  }

  async close() {
    await this.sql.end();
  }

  async list(search) {
    if (search) {
      const pattern = `%${search}%`;
      return this.sql`
        SELECT id, title, description, duration, created_at
        FROM videos
        WHERE title ILIKE ${pattern}
        ORDER BY created_at DESC
      `;
    }

    return this.sql`
      SELECT id, title, description, duration, created_at
      FROM videos
      ORDER BY created_at DESC
    `;
  }

  async create({ title, description, duration }) {
    const id = randomUUID();
    await this.sql`
      INSERT INTO videos (id, title, description, duration)
      VALUES (${id}, ${title}, ${description}, ${duration})
    `;
    return id;
  }

  async update(id, { title, description, duration }) {
    const result = await this.sql`
      UPDATE videos
      SET title = ${title},
          description = ${description},
          duration = ${duration}
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  async delete(id) {
    await this.sql`
      DELETE FROM videos
      WHERE id = ${id}
    `;
  }
}