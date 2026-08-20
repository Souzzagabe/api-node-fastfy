import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyCookie from '@fastify/cookie'
import fastifyOauth2 from '@fastify/oauth2'
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
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
| GOOGLE OAUTH2
|--------------------------------------------------------------------------
*/

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173'

await server.register(fastifyOauth2, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],

  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },

  startRedirectPath: '/auth/google',
  callbackUri:
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 3000}/auth/google/callback`,
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
| AUTHORIZATION HELPERS
|--------------------------------------------------------------------------
| admin: acessa qualquer lista / todo
| user : acessa apenas o que pertence a ele
*/

function isAdmin(request) {
  return request.user.role === 'admin'
}

server.decorate(
  'requireAdmin',
  async function (request, reply) {
    if (!isAdmin(request)) {
      return reply.status(403).send({
        message: 'Forbidden - admin only',
      })
    }
  },
)

async function getListOrDeny(request, reply, listId) {
  const list = await database.findListById(listId)

  if (!list) {
    reply.status(404).send({ message: 'List not found' })
    return null
  }

  const owns = list.user_id === request.user.userId

  if (!owns && !isAdmin(request)) {
    reply.status(403).send({ message: 'Forbidden' })
    return null
  }

  return list
}

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
        'Cadastra um novo usuário informando username e password. O usuário criado sempre recebe role "user"; a role "admin" é reservada ao usuário seed.',

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
        role: 'user',
      })

    return reply.status(201).send({
      id: user.id,
      username: user.username,
      role: user.role,
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
        'Autentica um usuário e armazena o token JWT (com id e role) em um cookie HttpOnly.',

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
      role: user.role,
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
| LOGIN COM GOOGLE
|--------------------------------------------------------------------------
| GET /auth/google         -> registrado automaticamente pelo @fastify/oauth2,
|                              redireciona o usuário pro consentimento do Google.
| GET /auth/google/callback -> o Google volta pra cá com o código de autorização.
*/

server.get(
  '/auth/google/callback',
  async (request, reply) => {

    // 1. Pega token do Google
    let token

    try {
      const result =
        await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request
        )

      token = result.token
    } catch (error) {
      server.log.error(error)

      return reply.redirect(
        `${FRONTEND_URL}/auth?error=google`
      )
    }

    // 2. Busca informações do usuário no Google
    const googleResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      }
    )

    if (!googleResponse.ok) {
      return reply.redirect(
        `${FRONTEND_URL}/auth?error=google`
      )
    }

    const googleUser = await googleResponse.json()

    // 3. ENTRA AQUI O CÓDIGO NOVO
    let user = await database.findUserByGoogleId(
      googleUser.id,
    )

    if (!user) {
      const existingByEmail =
        await database.findUserByEmail(
          googleUser.email,
        )

      if (existingByEmail) {
        await database.linkGoogleAccount(
          existingByEmail.id,
          googleUser.id,
        )

        user = existingByEmail
      }
    }

    if (!user) {
      const existingByUsername =
        await database.findUserByUsername(
          googleUser.email,
        )

      if (existingByUsername) {
        await database.linkGoogleAccount(
          existingByUsername.id,
          googleUser.id,
        )

        user = existingByUsername
      }
    }

    if (!user) {
      user = await database.createUser({
        username: googleUser.email,
        email: googleUser.email,
        google_id: googleUser.id,
        role: 'user',
      })
    }

    // 4. Gera JWT
    const jwtToken = server.jwt.sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // 5. Salva cookie
    reply.setCookie('token', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    // 6. Volta para o Vue
    return reply.redirect(
      `${FRONTEND_URL}/auth?redirect=/home`)
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

            role: {
              type: 'string',
            },
          },

          required: [
            'id',
            'username',
            'role',
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
      role: request.user.role,
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
| ADMIN - LIST USERS (com contagem de tarefas)
|--------------------------------------------------------------------------
*/

server.get(
  '/users',
  {
    preHandler: [
      server.authenticate,
      server.requireAdmin,
    ],

    schema: {
      tags: ['Admin'],
      summary: 'Lista todos os usuários (admin)',
      description:
        'Retorna todos os usuários com contagem de tarefas totais e concluídas. Restrito a administradores.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      response: {
        200: {
          type: 'array',

          items: {
            $ref: 'UserWithStats#',
          },
        },

        401: {
          $ref: 'Error#',
        },

        403: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const users = await database.listUsersWithStats()

    return reply.send(users)
  },
)

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE USER ROLE
|--------------------------------------------------------------------------
*/

server.patch(
  '/users/:id/role',
  {
    preHandler: [
      server.authenticate,
      server.requireAdmin,
    ],

    schema: {
      tags: ['Admin'],
      summary: 'Altera a role de um usuário (admin)',
      description:
        'Promove ou rebaixa um usuário entre "user" e "admin". Restrito a administradores. Um admin não pode alterar a própria role.',

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
        $ref: 'UpdateRole#',
      },

      response: {
        200: {
          $ref: 'MessageResponse#',
        },

        400: {
          $ref: 'Error#',
        },

        401: {
          $ref: 'Error#',
        },

        403: {
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
    const { role } = request.body

    if (id === request.user.userId) {
      return reply.status(400).send({
        message: 'You cannot change your own role',
      })
    }

    const targetUser = await database.findUserById(id)

    if (!targetUser) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await database.countAdmins()

      if (adminCount <= 1) {
        return reply.status(400).send({
          message: 'Cannot remove the last admin',
        })
      }
    }

    await database.updateUserRole(id, role)

    return reply.status(200).send({
      message: 'User role updated successfully!',
    })
  },
)

/*
|--------------------------------------------------------------------------
| ADMIN - DELETE USER
|--------------------------------------------------------------------------
*/

server.delete(
  '/users/:id',
  {
    preHandler: [
      server.authenticate,
      server.requireAdmin,
    ],

    schema: {
      tags: ['Admin'],
      summary: 'Remove um usuário (admin)',
      description:
        'Remove um usuário e todas as suas listas/tarefas (cascade). Restrito a administradores. Um admin não pode se autoexcluir.',

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

        400: {
          $ref: 'Error#',
        },

        401: {
          $ref: 'Error#',
        },

        403: {
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

    if (id === request.user.userId) {
      return reply.status(400).send({
        message: 'You cannot delete your own account',
      })
    }

    const targetUser = await database.findUserById(id)

    if (!targetUser) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    if (targetUser.role === 'admin') {
      const adminCount = await database.countAdmins()

      if (adminCount <= 1) {
        return reply.status(400).send({
          message: 'Cannot delete the last admin',
        })
      }
    }

    await database.deleteUser(id)

    return reply.status(200).send({
      message: 'User deleted successfully!',
    })
  },
)

/*
|--------------------------------------------------------------------------
| CREATE LIST
|--------------------------------------------------------------------------
*/

server.post(
  '/lists',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Lists'],
      summary: 'Cria uma lista',
      description:
        'Cria uma nova lista pertencente ao usuário autenticado.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      body: {
        $ref: 'CreateList#',
      },

      response: {
        201: {
          $ref: 'CreatedResponse#',
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
    const { name } = request.body

    if (!name) {
      return reply.status(400).send({
        message: 'Name is required',
      })
    }

    const id = await database.createList({
      user_id: request.user.userId,
      name,
    })

    return reply.status(201).send({ id })
  },
)

/*
|--------------------------------------------------------------------------
| LIST LISTS
|--------------------------------------------------------------------------
*/

server.get(
  '/lists',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Lists'],
      summary: 'Lista as listas',
      description:
        'Admin vê todas as listas de todos os usuários. Usuário comum vê apenas as suas próprias listas.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      response: {
        200: {
          type: 'array',

          items: {
            $ref: 'List#',
          },
        },

        401: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const lists = await database.listLists({
      userId: request.user.userId,
      role: request.user.role,
    })

    return reply.send(lists)
  },
)

/*
|--------------------------------------------------------------------------
| UPDATE LIST
|--------------------------------------------------------------------------
*/

server.put(
  '/lists/:id',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Lists'],
      summary: 'Atualiza uma lista',
      description:
        'Atualiza o nome de uma lista. Admin pode atualizar qualquer lista; usuário comum apenas as suas.',

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
        $ref: 'CreateList#',
      },

      response: {
        200: {
          $ref: 'MessageResponse#',
        },

        401: {
          $ref: 'Error#',
        },

        403: {
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
    const { name } = request.body

    const list = await getListOrDeny(request, reply, id)
    if (!list) return

    await database.updateList(id, { name })

    return reply.status(200).send({
      message: 'List updated successfully!',
    })
  },
)

/*
|--------------------------------------------------------------------------
| DELETE LIST
|--------------------------------------------------------------------------
*/

server.delete(
  '/lists/:id',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Lists'],
      summary: 'Remove uma lista',
      description:
        'Remove uma lista e todos os seus todos (cascade). Admin pode remover qualquer lista; usuário comum apenas as suas.',

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

        403: {
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

    const list = await getListOrDeny(request, reply, id)
    if (!list) return

    await database.deleteList(id)

    return reply.status(200).send({
      message: 'List deleted successfully!',
    })
  },
)

/*
|--------------------------------------------------------------------------
| CREATE TODO (dentro de uma lista)
|--------------------------------------------------------------------------
*/

server.post(
  '/lists/:listId/todos',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Cria uma tarefa em uma lista',
      description:
        'Cria uma nova tarefa dentro de uma lista. Requer autenticação e acesso à lista.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      params: {
        type: 'object',

        properties: {
          listId: {
            type: 'string',
            format: 'uuid',
          },
        },

        required: ['listId'],
      },

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

        403: {
          $ref: 'Error#',
        },

        404: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { listId } = request.params

    const list = await getListOrDeny(request, reply, listId)
    if (!list) return

    const {
      title,
      description,
      completed = false,
    } = request.body

    const id = await database.createTodo({
      list_id: listId,
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
| LIST TODOS (de uma lista)
|--------------------------------------------------------------------------
*/

server.get(
  '/lists/:listId/todos',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Lista as tarefas de uma lista',
      description:
        'Retorna as tarefas de uma lista específica. Requer acesso à lista.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      params: {
        type: 'object',

        properties: {
          listId: {
            type: 'string',
            format: 'uuid',
          },
        },

        required: ['listId'],
      },

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

        403: {
          $ref: 'Error#',
        },

        404: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { listId } = request.params
    const { search } = request.query

    const list = await getListOrDeny(request, reply, listId)
    if (!list) return

    const todos =
      await database.listTodos(listId, search)

    return reply.send(todos)
  },
)

/*
|--------------------------------------------------------------------------
| UPDATE TODO
|--------------------------------------------------------------------------
*/

server.put(
  '/lists/:listId/todos/:id',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Atualiza uma tarefa',
      description:
        'Atualiza uma tarefa existente pelo ID, dentro de uma lista. Requer acesso à lista.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      params: {
        type: 'object',

        properties: {
          listId: {
            type: 'string',
            format: 'uuid',
          },

          id: {
            type: 'string',
            format: 'uuid',
          },
        },

        required: ['listId', 'id'],
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

        403: {
          $ref: 'Error#',
        },

        404: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { listId, id } = request.params

    const list = await getListOrDeny(request, reply, listId)
    if (!list) return

    const {
      title,
      description,
      completed = false,
    } = request.body

    const ok =
      await database.updateTodo(id, {
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
  '/lists/:listId/todos/:id',
  {
    preHandler: [
      server.authenticate,
    ],

    schema: {
      tags: ['Todos'],
      summary: 'Remove uma tarefa',
      description:
        'Remove uma tarefa existente pelo ID, dentro de uma lista. Requer acesso à lista.',

      security: [
        {
          bearerAuth: [],
        },
      ],

      params: {
        type: 'object',

        properties: {
          listId: {
            type: 'string',
            format: 'uuid',
          },

          id: {
            type: 'string',
            format: 'uuid',
          },
        },

        required: ['listId', 'id'],
      },

      response: {
        200: {
          $ref: 'MessageResponse#',
        },

        401: {
          $ref: 'Error#',
        },

        403: {
          $ref: 'Error#',
        },

        404: {
          $ref: 'Error#',
        },
      },
    },
  },

  async (request, reply) => {
    const { listId, id } = request.params

    const list = await getListOrDeny(request, reply, listId)
    if (!list) return

    await database.deleteTodo(id)

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