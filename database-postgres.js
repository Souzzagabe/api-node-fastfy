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
const createTodosSql = fs.readFileSync(path.join(migrationsDir, '001-create-todos-table.sql'), 'utf8');
const createUsersSql = fs.readFileSync(path.join(migrationsDir, '002-create-users-table.sql'), 'utf8');

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
    await this.sql.unsafe(createUsersSql);
  }

  async close() {
    await this.sql.end();
  }

async createUser({ id = randomUUID(), username, password_hash }) {
    const result = await this.sql`
        INSERT INTO users (id, username, password_hash)
        VALUES (${id}, ${username}, ${password_hash})
        RETURNING id, username;
    `;

    return result[0];
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

  async findUserByUsername(username) {
    const users = await this.sql`
      SELECT id, username, password_hash
      FROM users
      WHERE username = ${username}
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
      await this.createUser({ id, username: 'admin', password_hash: passwordHash });
    }
  }
}
