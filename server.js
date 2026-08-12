import Fastify from 'fastify';
import { DatabasePostgres } from './database-postgres.js';

const server = Fastify();
const database = new DatabasePostgres();

await database.init();

server.post('/videos', async (request, reply) => {
  const { title, description, duration } = request.body;
  const id = await database.create({ title, description, duration });
  return reply.status(201).send({ id });
});

server.get('/videos', async (request, reply) => {
  const { search } = request.query;
  const videos = await database.list(search);
  return reply.send(videos);
});

server.put('/videos/:id', async (request, reply) => {
  const videoId = request.params.id;
  const { title, description, duration } = request.body;

  const ok = await database.update(videoId, { title, description, duration });
  if (!ok) {
    return reply.status(404).send({ message: 'Video not found' });
  }
  return reply.status(200).send({ message: 'Video updated successfully!' });
});

server.delete('/videos/:id', async (request, reply) => {
  const { id } = request.params;
  await database.delete(id);
  return reply.status(200).send({ message: 'Video deleted successfully!' });
});

server.listen({ port: 3000 }).catch((err) => {
  console.error(err);
  process.exit(1);
});