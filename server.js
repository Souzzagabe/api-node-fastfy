import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyCookie from '@fastify/cookie'
import bcrypt from 'bcryptjs'

import { DatabasePostgres } from './database-postgres.js'

import {
  swaggerOptions,
  swaggerUiOptions,
} from './swagger.js'

import { schemas } from './schemas.js'

const server = Fastify({
  logger: true,
})

const database = new DatabasePostgres()

const JWT_SECRET =
  process.env.JWT_SECRET || 'supersecret'

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

await server.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://vue-dashboard-lovat.vercel.app',
  ],
  credentials: true,
})

/*
|--------------------------------------------------------------------------
| COOKIE
|--------------------------------------------------------------------------
*/

await server.register(fastifyCookie)

/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

await server.register(fastifyJwt, {
  secret: JWT_SECRET,

  cookie: {
    cookieName: 'token',
    signed: false,
  },
})

/*
|--------------------------------------------------------------------------
| SWAGGER
|--------------------------------------------------------------------------
*/

await server.register(
  fastifySwagger,
  swaggerOptions,
)

await server.register(
  fastifySwaggerUi,
  swaggerUiOptions,
)

/*
|--------------------------------------------------------------------------
| FASTIFY SCHEMAS
|--------------------------------------------------------------------------
*/

for (const schema of Object.values(schemas)) {
  server.addSchema(schema)
}

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

server.decorate(
  'authenticate',
  async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch (error) {
      return reply.status(401).send({
        message: 'Unauthorized',
      })
    }
  },
)

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

await database.init()
await database.ensureAdminUser()

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

server.post(
  '/users',
  {
    schema: {
      tags: ['Auth'],
      summary: 'Cria um novo usuário',
      description:
        'Cadastra um novo usuário informando username e password.',

      body: {
        $ref: 'CreateUser#',
      },

      response: {
        201: {
          $ref: 'UserResponse#',
        },

        400: {
          $ref: 'Error#',
        },

        409: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { username, password } = request.body

    if (!username || !password) {
      return reply.status(400).send({
        message:
          'Username and password are required',
      })
    }

    const existingUser =
      await database.findUserByUsername(username)

    if (existingUser) {
      return reply.status(409).send({
        message:
          'Username already exists',
      })
    }

    const passwordHash =
      await bcrypt.hash(password, 10)

    const user =
      await database.createUser({
        username,
        password_hash: passwordHash,
      })

    return reply.status(201).send({
      id: user.id,
      username: user.username,
    })
  },
)

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

server.post(
  '/login',
  {
    schema: {
      tags: ['Auth'],
      summary: 'Realiza login',
      description:
        'Autentica um usuário e armazena o token JWT em um cookie HttpOnly.',

      body: {
        $ref: 'Login#',
      },

      response: {
        200: {
          $ref: 'LoginResponse#',
        },

        400: {
          $ref: 'Error#',
        },

        401: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { username, password } = request.body

    if (!username || !password) {
      return reply.status(400).send({
        message:
          'Username and password are required',
      })
    }

    const user =
      await database.findUserByUsername(username)

    if (!user) {
      return reply.status(401).send({
        message: 'Invalid credentials',
      })
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash,
      )

    if (!passwordMatches) {
      return reply.status(401).send({
        message: 'Invalid credentials',
      })
    }

    const token = server.jwt.sign({
      userId: user.id,
      username: user.username,
    })

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return reply.send({
      message: 'Login realizado com sucesso',
    })
  },
)

/*
|--------------------------------------------------------------------------
| ME
|--------------------------------------------------------------------------
*/

server.get(
  '/me',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Auth'],
      summary: 'Retorna o usuário autenticado',

      response: {
        200: {
          type: 'object',

          properties: {
            id: {
              type: 'string',
            },

            username: {
              type: 'string',
            },
          },

          required: [
            'id',
            'username',
          ],
        },

        401: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    return reply.send({
      id: request.user.userId,
      username: request.user.username,
    })
  },
)

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

server.post(
  '/logout',
  {
    schema: {
      tags: ['Auth'],
      summary: 'Realiza logout',

      response: {
        200: {
          $ref: 'MessageResponse#',
        },
      },
    },
  },

  async (request, reply) => {
    reply.clearCookie('token', {
      path: '/',
    })

    return reply.send({
      message: 'Logout realizado com sucesso',
    })
  },
)

/*
|--------------------------------------------------------------------------
| CREATE TODO
|--------------------------------------------------------------------------
*/

server.post(
  '/todos',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Cria uma tarefa',
      description:
        'Cria uma nova tarefa. Requer autenticação.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      body: {
        $ref: 'CreateTodo#',
      },

      response: {
        201: {
          $ref: 'CreatedResponse#',
        },

        401: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const {
      title,
      description,
      completed = false,
    } = request.body

    const id = await database.create({
      title,
      description,
      completed,
    })

    return reply.status(201).send({
      id,
    })
  },
)

/*
|--------------------------------------------------------------------------
| LIST TODOS
|--------------------------------------------------------------------------
*/

server.get(
  '/todos',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Lista todos',
      description:
        'Retorna todas as tarefas cadastradas.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      querystring: {
        type: 'object',

        properties: {
          search: {
            type: 'string',
            description:
              'Filtra tarefas pelo título',
          },
        },
      },

      response: {
        200: {
          type: 'array',

          items: {
            $ref: 'Todo#',
          },
        },

        401: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { search } = request.query

    const todos =
      await database.list(search)

    return reply.send(todos)
  },
)

/*
|--------------------------------------------------------------------------
| UPDATE TODO
|--------------------------------------------------------------------------
*/

server.put(
  '/todos/:id',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Atualiza uma tarefa',
      description:
        'Atualiza uma tarefa existente pelo ID.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      params: {
        type: 'object',

        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
        },

        required: ['id'],
      },

      body: {
        $ref: 'CreateTodo#',
      },

      response: {
        200: {
          $ref: 'MessageResponse#',
        },

        401: {
          $ref: 'Error#',
        },

        404: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { id } = request.params

    const {
      title,
      description,
      completed = false,
    } = request.body

    const ok =
      await database.update(id, {
        title,
        description,
        completed,
      })

    if (!ok) {
      return reply.status(404).send({
        message: 'Todo not found',
      })
    }

    return reply.status(200).send({
      message:
        'Todo updated successfully!',
    })
  },
)

/*
|--------------------------------------------------------------------------
| DELETE TODO
|--------------------------------------------------------------------------
*/

server.delete(
  '/todos/:id',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Remove uma tarefa',
      description:
        'Remove uma tarefa existente pelo ID.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      params: {
        type: 'object',

        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
        },

        required: ['id'],
      },

      response: {
        200: {
          $ref: 'MessageResponse#',
        },

        401: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { id } = request.params

    await database.delete(id)

    return reply.status(200).send({
      message:
        'Todo deleted successfully!',
    })
  },
)

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const PORT =
  process.env.PORT || 3000

try {
  await server.listen({
    port: PORT,
    host: '0.0.0.0',
  })

  console.log(
    `Server running on port ${PORT}`,
  )

  console.log(
    `Swagger docs disponíveis em http://localhost:${PORT}/docs`,
  )
} catch (error) {
  server.log.error(error)
  process.exit(1)
}