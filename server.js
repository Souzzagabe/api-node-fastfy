import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import { DatabasePostgres } from './database-postgres.js';

const server = Fastify();
const database = new DatabasePostgres();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

await server.register(fastifyJwt, {
  secret: JWT_SECRET,
});

server.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.status(401).send({ message: 'Unauthorized' });
  }
});

await database.init();
await database.ensureAdminUser();


server.post('/users', async (request, reply) => {
    const { username, password } = request.body;

    console.log('username:', username);
    console.log('password:', password);

    if (!username || !password) {
        return reply.status(400).send({
            message: 'Username and password are required'
        });
    }

    const existingUser = await database.findUserByUsername(username);

    if (existingUser) {
        return reply.status(409).send({
            message: 'Username already exists'
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    console.log('passwordHash:', passwordHash);

const user = await database.createUser({
    username,
    password_hash: passwordHash
});
    return reply.status(201).send({
        id: user.id,
        username: user.username
    });
});

server.post('/login', async (request, reply) => {
  const { username, password } = request.body;
  if (!username || !password) {
    return reply.status(400).send({ message: 'Username and password are required' });
  }

  const user = await database.findUserByUsername(username);
  if (!user) {
    return reply.status(401).send({ message: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return reply.status(401).send({ message: 'Invalid credentials' });
  }

  const token = server.jwt.sign({ userId: user.id, username: user.username });
  return reply.send({ token });
});

server.post('/todos', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { title, description, completed = false } = request.body;
  const id = await database.create({ title, description, completed });
  return reply.status(201).send({ id });
});

server.get('/todos', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { search } = request.query;
  const todos = await database.list(search);
  return reply.send(todos);
});

server.put('/todos/:id', { preHandler: [server.authenticate] }, async (request, reply) => {
  const todoId = request.params.id;
  const { title, description, completed = false } = request.body;

  const ok = await database.update(todoId, { title, description, completed });
  if (!ok) {
    return reply.status(404).send({ message: 'Todo not found' });
  }
  return reply.status(200).send({ message: 'Todo updated successfully!' });
});

server.delete('/todos/:id', { preHandler: [server.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  await database.delete(id);
  return reply.status(200).send({ message: 'Todo deleted successfully!' });
});

const PORT = process.env.PORT || 3000;

try {
  await server.listen({
    port: PORT,
    host: '0.0.0.0',
  });

  console.log(`Server running on port ${PORT}`);
} catch (error) {
  server.log.error(error);
  process.exit(1);
}