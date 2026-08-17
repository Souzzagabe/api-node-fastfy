
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { randomUUID } from 'crypto';
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');
 
// Ordem importa: users -> lists -> todos (por causa das FKs)
const createUsersSql = fs.readFileSync(path.join(migrationsDir, '001-create-users-table.sql'), 'utf8');
const createListsSql = fs.readFileSync(path.join(migrationsDir, '002-create-lists-table.sql'), 'utf8');
const createTodosSql = fs.readFileSync(path.join(migrationsDir, '003-create-todos-table.sql'), 'utf8');
 
const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false,
  },
});
 
export async function initDatabase() {
  await sql.unsafe(createUsersSql);
  await sql.unsafe(createListsSql);
  await sql.unsafe(createTodosSql);
}
 
export async function closeDatabase() {
  await sql.end();
}
 
/*
|--------------------------------------------------------------------------
| LISTS
|--------------------------------------------------------------------------
*/
 
export async function createList({ user_id, name }) {
  const id = randomUUID();
  await sql`
    INSERT INTO lists (id, user_id, name)
    VALUES (${id}, ${user_id}, ${name})
  `;
  return id;
}
 
export async function listLists({ userId, role }) {
  if (role === 'admin') {
    return sql`
      SELECT id, user_id, name, created_at
      FROM lists
      ORDER BY created_at DESC
    `;
  }
 
  return sql`
    SELECT id, user_id, name, created_at
    FROM lists
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}
 
/*
|--------------------------------------------------------------------------
| TODOS (sempre vinculados a uma lista)
|--------------------------------------------------------------------------
*/
 
export async function listTodos(list_id, search) {
  if (search) {
    const pattern = `%${search}%`;
    return sql`
      SELECT id, list_id, title, description, completed, created_at
      FROM todos
      WHERE list_id = ${list_id}
        AND title ILIKE ${pattern}
      ORDER BY created_at DESC
    `;
  }
 
  return sql`
    SELECT id, list_id, title, description, completed, created_at
    FROM todos
    WHERE list_id = ${list_id}
    ORDER BY created_at DESC
  `;
}
 
export async function createTodo({ list_id, title, description, completed = false }) {
  const id = randomUUID();
  await sql`
    INSERT INTO todos (id, list_id, title, description, completed)
    VALUES (${id}, ${list_id}, ${title}, ${description ?? null}, ${completed})
  `;
  return id;
}
 
export async function updateTodo(id, { title, description, completed = false }) {
  const result = await sql`
    UPDATE todos
    SET title = ${title},
        description = ${description ?? null},
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
 





































