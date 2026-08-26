// swagger.js
// Configuração centralizada da documentação Swagger/OpenAPI da API.
// Registrar em server.js com:
//   import fastifySwagger from '@fastify/swagger';
//   import fastifySwaggerUi from '@fastify/swagger-ui';
//   import { swaggerOptions, swaggerUiOptions } from './swagger.js';
//
//   await server.register(fastifySwagger, swaggerOptions);
//   await server.register(fastifySwaggerUi, swaggerUiOptions);
//
// Dependências necessárias:
//   npm install @fastify/swagger @fastify/swagger-ui

export const swaggerOptions = {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Todos API',
            description:
                'API para gerenciamento de tarefas organizadas em listas (users -> lists -> todos), com cadastro de usuários, autenticação via JWT e controle de acesso por role (admin/user).',
            version: '2.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor local',
            },
            {
                url: 'https://api-node-fastfy.onrender.com',
                description: 'Servidor de produção',
            },
        ],
        tags: [
            {
                name: 'Auth',
                description: 'Cadastro de usuários e autenticação',
            },
            {
                name: 'Lists',
                description:
                    'Gerenciamento das listas (CRUD). Admin vê todas; usuário comum vê apenas as próprias.',
            },
            {
                name: 'Todos',
                description: 'Gerenciamento das tarefas (CRUD), sempre dentro de uma lista',
            },
            {
                name: 'Admin',
                description:
                    'Gerenciamento de usuários (listar com estatísticas, alterar role, excluir). Restrito a administradores.',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtido através da rota /login',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Mensagem de erro' },
                    },
                },

                // ----- Users / Auth -----
                CreateUser: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'gabriel' },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'minhaSenhaForte123',
                        },
                    },
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', example: 'gabriel' },
                        role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
                    },
                },
                UserWithStats: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', example: 'gabriel' },
                        role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
                        created_at: { type: 'string', format: 'date-time' },
                        total_todos: { type: 'integer', example: 12 },
                        completed_todos: { type: 'integer', example: 7 },
                    },
                },
                UpdateRole: {
                    type: 'object',
                    required: ['role'],
                    properties: {
                        role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
                    },
                },
                Login: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'gabriel' },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'minhaSenhaForte123',
                        },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Login realizado com sucesso',
                        },
                    },
                },

                // ----- Lists -----
                CreateList: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Compras da semana' },
                    },
                },
                List: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'Compras da semana' },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },

                // ----- Todos -----
                CreateTodo: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                        title: { type: 'string', example: 'Comprar leite' },
                        description: {
                            type: 'string',
                            example: 'Comprar leite integral no mercado',
                        },
                        completed: { type: 'boolean', default: false },
                    },
                },
                Todo: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        list_id: { type: 'string', format: 'uuid' },
                        title: { type: 'string', example: 'Comprar leite' },
                        description: {
                            type: 'string',
                            example: 'Comprar leite integral no mercado',
                        },
                        completed: { type: 'boolean', example: false },
                        position: { type: 'integer', example: 0 },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                ReorderTodos: {
                    type: 'object',
                    required: ['orderedIds'],
                    properties: {
                        orderedIds: {
                            type: 'array',
                            items: { type: 'string', format: 'uuid' },
                            example: ['id-da-tarefa-1', 'id-da-tarefa-2'],
                        },
                    },
                },
                CreatedResponse: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                    },
                },
                MessageResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Operação realizada com sucesso' },
                    },
                },
            },
        },
    },
};

export const swaggerUiOptions = {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
    },
    staticCSP: true,
};