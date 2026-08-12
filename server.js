import Fastify from 'fastify';
import { DatabasePostgres } from './database-postgres.js';

const server = Fastify();
const database = new DatabasePostgres();

await database.init();

server.post('/todos', async (request, reply) => {
  const { title, description, completed = false } = request.body;
  const id = await database.create({ title, description, completed });
  return reply.status(201).send({ id });
});

server.get('/todos', async (request, reply) => {
  const { search } = request.query;
  const todos = await database.list(search);
  return reply.send(todos);
});

server.put('/todos/:id', async (request, reply) => {
  const todoId = request.params.id;
  const { title, description, completed = false } = request.body;

  const ok = await database.update(todoId, { title, description, completed });
  if (!ok) {
    return reply.status(404).send({ message: 'Todo not found' });
  }
  return reply.status(200).send({ message: 'Todo updated successfully!' });
});

server.delete('/todos/:id', async (request, reply) => {
  const { id } = request.params;
  await database.delete(id);
  return reply.status(200).send({ message: 'Todo deleted successfully!' });
});

const PORT = process.env.PORT || 3000;

try {
  await fastify.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  console.log(`Server running on port ${PORT}`);
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}