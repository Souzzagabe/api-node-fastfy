import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

// Ordem importa: users -> lists -> todos (por causa das FKs)
const createUsersSql = fs.readFileSync(path.join(migrationsDir, '001-create-users-table.sql'), 'utf8');
const createListsSql = fs.readFileSync(path.join(migrationsDir, '002-create-lists-table.sql'), 'utf8');
const createTodosSql = fs.readFileSync(path.join(migrationsDir, '003-create-todos-table.sql'), 'utf8');

export class DatabasePostgres {
  constructor() {
    this.sql = postgres(process.env.DATABASE_URL, {
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async init() {
    await this.sql.unsafe(createUsersSql);
    await this.sql.unsafe(createListsSql);
    await this.sql.unsafe(createTodosSql);
  }

  async close() {
    await this.sql.end();
  }

  /*
  |--------------------------------------------------------------------------
  | USERS
  |--------------------------------------------------------------------------
  */

  async createUser({ id = randomUUID(), username, password_hash, role = 'user' }) {
    const result = await this.sql`
      INSERT INTO users (id, username, password_hash, role)
      VALUES (${id}, ${username}, ${password_hash}, ${role})
      RETURNING id, username, role;
    `;

    return result[0];
  }

  async findUserByUsername(username) {
    const users = await this.sql`
      SELECT id, username, password_hash, role
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
    return users[0] ?? null;
  }

  async findUserById(id) {
    const users = await this.sql`
      SELECT id, username, role
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;
    return users[0] ?? null;
  }

  async ensureAdminUser() {
    const users = await this.sql`
      SELECT id
      FROM users
      WHERE username = 'admin'
      LIMIT 1
    `;

    if (users.length === 0) {
      const id = randomUUID();
      const passwordHash = await bcrypt.hash('123456', 10);
      await this.createUser({ id, username: 'admin', password_hash: passwordHash, role: 'admin' });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LISTS
  |--------------------------------------------------------------------------
  | Regra: admin enxerga todas as listas. Usuário comum enxerga só as suas.
  */

  async createList({ user_id, name }) {
    const id = randomUUID();
    await this.sql`
      INSERT INTO lists (id, user_id, name)
      VALUES (${id}, ${user_id}, ${name})
    `;
    return id;
  }

  async listLists({ userId, role }) {
    if (role === 'admin') {
      return this.sql`
        SELECT id, user_id, name, created_at
        FROM lists
        ORDER BY created_at DESC
      `;
    }

    return this.sql`
      SELECT id, user_id, name, created_at
      FROM lists
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
  }

  async findListById(id) {
    const lists = await this.sql`
      SELECT id, user_id, name, created_at
      FROM lists
      WHERE id = ${id}
      LIMIT 1
    `;
    return lists[0] ?? null;
  }

  async updateList(id, { name }) {
    const result = await this.sql`
      UPDATE lists
      SET name = ${name}
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  async deleteList(id) {
    await this.sql`
      DELETE FROM lists
      WHERE id = ${id}
    `;
  }

  /*
  |--------------------------------------------------------------------------
  | TODOS
  |--------------------------------------------------------------------------
  | Sempre pertencem a uma lista. Acesso é controlado a partir da lista pai.
  */

  async createTodo({ list_id, title, description, completed = false }) {
    const id = randomUUID();
    await this.sql`
      INSERT INTO todos (id, list_id, title, description, completed)
      VALUES (${id}, ${list_id}, ${title}, ${description}, ${completed})
    `;
    return id;
  }

  async listTodos(list_id, search) {
    if (search) {
      const pattern = `%${search}%`;
      return this.sql`
        SELECT id, list_id, title, description, completed, created_at
        FROM todos
        WHERE list_id = ${list_id}
          AND title ILIKE ${pattern}
        ORDER BY created_at DESC
      `;
    }

    return this.sql`
      SELECT id, list_id, title, description, completed, created_at
      FROM todos
      WHERE list_id = ${list_id}
      ORDER BY created_at DESC
    `;
  }

  async findTodoById(id) {
    const todos = await this.sql`
      SELECT id, list_id, title, description, completed, created_at
      FROM todos
      WHERE id = ${id}
      LIMIT 1
    `;
    return todos[0] ?? null;
  }

  async updateTodo(id, { title, description, completed = false }) {
    const result = await this.sql`
      UPDATE todos
      SET title = ${title},
          description = ${description},
          completed = ${completed}
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  async deleteTodo(id) {
    await this.sql`
      DELETE FROM todos
      WHERE id = ${id}
    `;
  }
}
