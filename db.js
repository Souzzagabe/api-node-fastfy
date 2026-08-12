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

const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initDatabase() {
  await sql.unsafe(createTodosSql);
}

export async function closeDatabase() {
  await sql.end();
}

export async function listTodos(search) {
  if (search) {
    const pattern = `%${search}%`;
    return sql`
      SELECT id, title, description, completed, created_at
      FROM todos
      WHERE title ILIKE ${pattern}
      ORDER BY created_at DESC
    `;
  }

  return sql`
    SELECT id, title, description, completed, created_at
    FROM todos
    ORDER BY created_at DESC
  `;
}

export async function createTodo({ title, description, completed = false }) {
  const id = randomUUID();
  await sql`
    INSERT INTO todos (id, title, description, completed)
    VALUES (${id}, ${title}, ${description}, ${completed})
  `;
  return id;
}

export async function updateTodo(id, { title, description, completed = false }) {
  const result = await sql`
    UPDATE todos
    SET title = ${title},
        description = ${description},
        completed = ${completed}
    WHERE id = ${id}
  `;
  return result.count > 0;
}

export async function deleteTodo(id) {
  await sql`
    DELETE FROM todos
    WHERE id = ${id}
  `;
}
