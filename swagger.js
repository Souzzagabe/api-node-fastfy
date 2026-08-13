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
                'API para gerenciamento de tarefas (todos), com cadastro de usuários e autenticação via JWT.',
            version: '1.0.0',
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
                name: 'Todos',
                description: 'Gerenciamento das tarefas (CRUD)',
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
                        token: {
                            type: 'string',
                            description: 'Token JWT a ser enviado no header Authorization',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
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
                        title: { type: 'string', example: 'Comprar leite' },
                        description: {
                            type: 'string',
                            example: 'Comprar leite integral no mercado',
                        },
                        completed: { type: 'boolean', example: false },
                        created_at: { type: 'string', format: 'date-time' },
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