import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');
const createTodosSql = fs.readFileSync(path.join(migrationsDir, '001-create-todos-table.sql'), 'utf8');

export class DatabasePostgres {
  constructor() {
    this.sql = postgres(process.env.DATABASE_URL, {
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async init() {
    await this.sql.unsafe(createTodosSql);
  }

  async close() {
    await this.sql.end();
  }

  async list(search) {
    if (search) {
      const pattern = `%${search}%`;
      return this.sql`
        SELECT id, title, description, completed, created_at
        FROM todos
        WHERE title ILIKE ${pattern}
        ORDER BY created_at DESC
      `;
    }

    return this.sql`
      SELECT id, title, description, completed, created_at
      FROM todos
      ORDER BY created_at DESC
    `;
  }

  async create({ title, description, completed = false }) {
    const id = randomUUID();
    await this.sql`
      INSERT INTO todos (id, title, description, completed)
      VALUES (${id}, ${title}, ${description}, ${completed})
    `;
    return id;
  }

  async update(id, { title, description, completed = false }) {
    const result = await this.sql`
      UPDATE todos
      SET title = ${title},
          description = ${description},
          completed = ${completed}
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  async delete(id) {
    await this.sql`
      DELETE FROM todos
      WHERE id = ${id}
    `;
  }
}