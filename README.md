# API de Todos

## Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação](#instalação)
5. [Variáveis de ambiente](#variáveis-de-ambiente)
6. [Banco de dados](#banco-de-dados)
7. [Estrutura do projeto](#estrutura-do-projeto)
8. [Executando a aplicação](#executando-a-aplicação)
9. [URL da API](#url-da-api)
10. [Endpoints](#endpoints)
11. [Criação de usuário](#criação-de-usuário)
12. [Autenticação e login](#autenticação-e-login)
13. [CRUD de todos](#crud-de-todos)
14. [Códigos HTTP](#códigos-http)
15. [Tratamento de erros](#tratamento-de-erros)
16. [Exemplos de consumo](#exemplos-de-consumo)
17. [Testando a API](#testando-a-api)
18. [Testes automatizados](#testes-automatizados)
19. [Segurança](#segurança)
20. [Banco de dados e queries](#banco-de-dados-e-queries)
21. [Deploy](#deploy)
22. [Fluxo da aplicação](#fluxo-da-aplicação)
23. [Decisões arquiteturais](#decisões-arquiteturais)
24. [Melhorias futuras](#melhorias-futuras)
25. [Checklist de execução](#checklist-de-execução)

---

## Visão Geral

Esta API fornece um serviço REST para gerenciamento de tarefas (todos).

A aplicação permite criar, listar, buscar, atualizar e excluir tarefas armazenadas em um banco PostgreSQL.

O acesso às operações de todos é protegido por autenticação JWT.

### Principais funcionalidades

* Criar usuário
* Login com JWT
* Criar tarefa
* Listar tarefas
* Buscar tarefas por título
* Atualizar tarefa
* Excluir tarefa
* Persistência dos dados em PostgreSQL
* Proteção das rotas de tarefas com JWT

### Arquitetura geral

A aplicação é uma API REST desenvolvida com Node.js e Fastify.

A responsabilidade das rotas está centralizada em `server.js`, enquanto o acesso ao PostgreSQL está isolado em `database-postgres.js`.

A autenticação utiliza JWT e as senhas dos usuários são armazenadas utilizando hash com `bcryptjs`.

---

## Stack Tecnológica

* Node.js
* JavaScript (ES Modules)
* Fastify
* `@fastify/jwt`
* PostgreSQL
* `postgres`
* `bcryptjs`
* `dotenv`
* `crypto` — módulo nativo do Node.js

---

## Pré-requisitos

* Node.js instalado
* npm disponível
* PostgreSQL ou serviço compatível com PostgreSQL
* Arquivo `.env` configurado com `DATABASE_URL`
* `JWT_SECRET` configurado em ambiente de produção

Verifique as versões:

```bash
node --version
npm --version
```

---

## Instalação

1. Clone o repositório:

```bash
git clone <URL_DO_REPOSITÓRIO>
```

2. Acesse a pasta do projeto:

```bash
cd api-node-fastfy
```

3. Instale as dependências:

```bash
npm install
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=
PORT=3000
JWT_SECRET=
```

### `DATABASE_URL`

String de conexão com o banco PostgreSQL.

Exemplo:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/banco?sslmode=require
```

Obrigatória: **sim**.

---

### `JWT_SECRET`

Segredo utilizado para assinar os tokens JWT.

Exemplo:

```env
JWT_SECRET=uma-chave-secreta-segura
```

Obrigatória: **não em desenvolvimento**, pois a aplicação possui `supersecret` como fallback.

> Em produção, recomenda-se configurar uma chave forte através das variáveis de ambiente.

---

### `PORT`

Porta utilizada pelo servidor.

Exemplo:

```env
PORT=3000
```

Caso não seja informada, a aplicação utiliza a porta `3000`.

---

> **Importante:** nunca envie o arquivo `.env` para o GitHub.

---

## Banco de dados

### Banco utilizado

PostgreSQL.

A aplicação utiliza duas tabelas principais:

* `users`
* `todos`

### Tabela `users`

```sql
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

| Coluna          | Tipo          | Atributos                |
| --------------- | ------------- | ------------------------ |
| `id`            | `uuid`        | `PRIMARY KEY`            |
| `username`      | `text`        | `NOT NULL UNIQUE`        |
| `password_hash` | `text`        | `NOT NULL`               |
| `created_at`    | `timestamptz` | `NOT NULL DEFAULT now()` |

### Tabela `todos`

```sql
CREATE TABLE IF NOT EXISTS todos (
    id uuid PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

| Coluna        | Tipo          | Atributos                |
| ------------- | ------------- | ------------------------ |
| `id`          | `uuid`        | `PRIMARY KEY`            |
| `title`       | `text`        | `NOT NULL`               |
| `description` | `text`        | `NOT NULL`               |
| `completed`   | `boolean`     | `NOT NULL DEFAULT false` |
| `created_at`  | `timestamptz` | `NOT NULL DEFAULT now()` |

---

## Estrutura do projeto

```text
.
├── .env
├── database-postgres.js
├── migrations/
│   ├── 001-create-todos-table.sql
│   └── 002-create-users-table.sql
├── node_modules/
├── package.json
├── package-lock.json
├── routes.http
└── server.js
```

### Responsabilidade dos arquivos

* `server.js`: servidor Fastify, autenticação JWT e definição das rotas.
* `database-postgres.js`: conexão com PostgreSQL e execução das queries.
* `migrations/001-create-todos-table.sql`: criação da tabela `todos`.
* `migrations/002-create-users-table.sql`: criação da tabela `users`.
* `routes.http`: exemplos de requisições para o VS Code REST Client.
* `.env`: variáveis de ambiente.

---

## Executando a aplicação

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm start
```

### Scripts disponíveis

```text
npm start
npm run dev
```

A aplicação também executa a criação das tabelas durante a inicialização através de:

```js
await database.init();
```

---

## URL da API

### Local

```text
http://localhost:3000
```

### Produção

```text
https://api-node-fastfy.onrender.com
```

---

# Endpoints

## Usuários

| Método | Endpoint | Autenticação |
| ------ | -------- | ------------ |
| `POST` | `/users` | Não          |
| `POST` | `/login` | Não          |

## Todos

| Método   | Endpoint     | Autenticação |
| -------- | ------------ | ------------ |
| `POST`   | `/todos`     | JWT          |
| `GET`    | `/todos`     | JWT          |
| `PUT`    | `/todos/:id` | JWT          |
| `DELETE` | `/todos/:id` | JWT          |

---

# Criação de usuário

## `POST /users`

Cria um novo usuário.

### Autenticação

Não requer autenticação.

### Requisição

```http
POST /users
Content-Type: application/json
```

### Body

```json
{
    "username": "gabriel",
    "password": "123456"
}
```

### Campos

| Campo      | Tipo   | Obrigatório |
| ---------- | ------ | ----------- |
| `username` | string | Sim         |
| `password` | string | Sim         |

### Funcionamento

A senha recebida não é armazenada diretamente no banco.

Antes de ser salva, ela é transformada em um hash utilizando `bcryptjs`.

```text
Senha
  ↓
bcrypt.hash()
  ↓
password_hash
  ↓
PostgreSQL
```

### Resposta de sucesso

Status:

```text
201 Created
```

Resposta:

```json
{
    "id": "uuid-gerado",
    "username": "gabriel"
}
```

### Usuário já existente

Se o username já estiver cadastrado:

```text
409 Conflict
```

Resposta:

```json
{
    "message": "Username already exists"
}
```

### Dados obrigatórios ausentes

```text
400 Bad Request
```

Resposta:

```json
{
    "message": "Username and password are required"
}
```

---

# Autenticação e login

## `POST /login`

Realiza a autenticação do usuário e retorna um token JWT.

### Autenticação

Não requer autenticação.

### Requisição

```http
POST /login
Content-Type: application/json
```

### Body

```json
{
    "username": "gabriel",
    "password": "123456"
}
```

### Funcionamento

O fluxo de autenticação é:

```text
Username + Password
        ↓
Busca usuário no PostgreSQL
        ↓
bcrypt.compare()
        ↓
Credenciais válidas?
        ↓
server.jwt.sign()
        ↓
JWT Token
```

### Resposta de sucesso

Status:

```text
200 OK
```

Resposta:

```json
{
    "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Credenciais inválidas

Status:

```text
401 Unauthorized
```

Resposta:

```json
{
    "message": "Invalid credentials"
}
```

### Dados obrigatórios ausentes

Status:

```text
400 Bad Request
```

Resposta:

```json
{
    "message": "Username and password are required"
}
```

---

# Autorização das rotas

As rotas de todos exigem um JWT válido.

Envie o token no header:

```http
Authorization: Bearer <TOKEN>
```

Exemplo:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Se o token não for válido, a API retorna:

```text
401 Unauthorized
```

```json
{
    "message": "Unauthorized"
}
```

---

# CRUD de todos

## `POST /todos`

Cria uma nova tarefa.

### Autenticação

JWT obrigatório.

### Headers

```http
Content-Type: application/json
Authorization: Bearer <TOKEN>
```

### Body

```json
{
    "title": "Comprar leite",
    "description": "Comprar leite integral no mercado.",
    "completed": false
}
```

### Resposta

Status:

```text
201 Created
```

```json
{
    "id": "uuid-gerado"
}
```

---

## `GET /todos`

Lista todas as tarefas.

### Autenticação

JWT obrigatório.

### Requisição

```http
GET /todos
Authorization: Bearer <TOKEN>
```

### Busca por título

É possível utilizar o parâmetro `search`:

```http
GET /todos?search=leite
Authorization: Bearer <TOKEN>
```

### Resposta

```json
[
    {
        "id": "uuid",
        "title": "Comprar leite",
        "description": "Comprar leite integral no mercado.",
        "completed": false,
        "created_at": "2026-08-12T00:00:00.000Z"
    }
]
```

---

## `PUT /todos/:id`

Atualiza uma tarefa existente.

### Autenticação

JWT obrigatório.

### Requisição

```http
PUT /todos/<TODO_ID>
Content-Type: application/json
Authorization: Bearer <TOKEN>
```

### Body

```json
{
    "title": "Comprar leite",
    "description": "Comprar leite integral no mercado.",
    "completed": true
}
```

### Sucesso

Status:

```text
200 OK
```

```json
{
    "message": "Todo updated successfully!"
}
```

### Todo não encontrado

Status:

```text
404 Not Found
```

```json
{
    "message": "Todo not found"
}
```

---

## `DELETE /todos/:id`

Exclui uma tarefa.

### Autenticação

JWT obrigatório.

### Requisição

```http
DELETE /todos/<TODO_ID>
Authorization: Bearer <TOKEN>
```

### Resposta

Status:

```text
200 OK
```

```json
{
    "message": "Todo deleted successfully!"
}
```

---

# Códigos HTTP

A API utiliza os seguintes códigos:

| Código | Significado                              |
| ------ | ---------------------------------------- |
| `200`  | Operação realizada com sucesso           |
| `201`  | Recurso criado                           |
| `400`  | Dados obrigatórios ausentes              |
| `401`  | Não autenticado ou credenciais inválidas |
| `404`  | Recurso não encontrado                   |
| `409`  | Username já cadastrado                   |
| `500`  | Erro interno do servidor                 |

---

# Tratamento de erros

Os endpoints possuem respostas específicas para alguns erros.

### Login

```json
{
    "message": "Invalid credentials"
}
```

### Autenticação

```json
{
    "message": "Unauthorized"
}
```

### Usuário já existente

```json
{
    "message": "Username already exists"
}
```

### Todo não encontrado

```json
{
    "message": "Todo not found"
}
```

---

# Exemplos de consumo

## Criar usuário

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gabriel",
    "password": "123456"
  }'
```

---

## Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gabriel",
    "password": "123456"
  }'
```

A resposta será:

```json
{
    "token": "SEU_TOKEN_JWT"
}
```

---

## Criar todo autenticado

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "title": "Comprar leite",
    "description": "Comprar leite integral no mercado.",
    "completed": false
  }'
```

---

## Listar todos

```bash
curl http://localhost:3000/todos \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

## Buscar todos

```bash
curl "http://localhost:3000/todos?search=leite" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

## Atualizar todo

```bash
curl -X PUT http://localhost:3000/todos/<TODO_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "title": "Comprar leite",
    "description": "Comprar leite integral no mercado.",
    "completed": true
  }'
```

---

## Excluir todo

```bash
curl -X DELETE http://localhost:3000/todos/<TODO_ID> \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

# JavaScript / Fetch

### Criar usuário

```js
const baseUrl = 'http://localhost:3000';

async function createUser(username, password) {
    const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    return response.json();
}
```

### Login

```js
async function login(username, password) {
    const response = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    return response.json();
}
```

### Listar todos autenticados

```js
async function getTodos(token, search) {
    const url = new URL(`${baseUrl}/todos`);

    if (search) {
        url.searchParams.set('search', search);
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.json();
}
```

---

# Testando a API

## VS Code REST Client

O projeto possui um arquivo:

```text
routes.http
```

Nele estão disponíveis exemplos para:

* Criar usuário
* Login
* Criar todo
* Listar todos
* Buscar todos
* Atualizar todo
* Excluir todo

### Fluxo recomendado

Primeiro crie o usuário:

```http
POST http://localhost:3000/users
```

Depois faça login:

```http
POST http://localhost:3000/login
```

Copie o token retornado e utilize nas requisições protegidas:

```http
Authorization: Bearer <TOKEN>
```

---

## Postman ou Insomnia

Configure as seguintes requisições:

```text
POST   http://localhost:3000/users
POST   http://localhost:3000/login

POST   http://localhost:3000/todos
GET    http://localhost:3000/todos
GET    http://localhost:3000/todos?search=leite
PUT    http://localhost:3000/todos/:id
DELETE http://localhost:3000/todos/:id
```

As cinco últimas requisições precisam do JWT.

---

# Testes automatizados

O projeto atualmente não possui testes automatizados configurados.

Como melhoria futura, podem ser adicionados testes com:

* Vitest
* Jest
* Fastify inject
* Testcontainers

---

# Segurança

### Implementações atuais

* Autenticação baseada em JWT.
* Senhas protegidas com `bcryptjs`.
* Credenciais do banco armazenadas em variáveis de ambiente.
* Rotas de todos protegidas por JWT.
* `username` possui restrição `UNIQUE` no PostgreSQL.
* SSL habilitado na conexão PostgreSQL.

### Fluxo da senha

A senha nunca é armazenada diretamente:

```text
123456
   ↓
bcrypt.hash()
   ↓
$2a$10$...
   ↓
PostgreSQL
```

Durante o login:

```text
Senha informada
      ↓
bcrypt.compare()
      ↓
Hash armazenado
      ↓
Credenciais válidas
      ↓
JWT
```

### Melhorias de segurança recomendadas

* Remover o fallback `supersecret` em produção.
* Utilizar um `JWT_SECRET` forte e aleatório.
* Adicionar validação de entrada com Zod ou JSON Schema.
* Adicionar rate limiting.
* Configurar CORS.
* Implementar expiração dos tokens.
* Implementar refresh tokens.
* Adicionar logging estruturado.
* Não retornar informações sensíveis em mensagens de erro.

---

# Banco de dados e queries

A aplicação utiliza o cliente `postgres` para executar SQL diretamente.

## Usuários

### Buscar usuário pelo username

```sql
SELECT id, username, password_hash
FROM users
WHERE username = ${username}
LIMIT 1
```

### Criar usuário

```sql
INSERT INTO users (id, username, password_hash)
VALUES (${id}, ${username}, ${password_hash})
RETURNING id, username
```

---

## Todos

### Listar todos

```sql
SELECT id, title, description, completed, created_at
FROM todos
ORDER BY created_at DESC
```

### Buscar todos

```sql
SELECT id, title, description, completed, created_at
FROM todos
WHERE title ILIKE ${pattern}
ORDER BY created_at DESC
```

### Criar todo

```sql
INSERT INTO todos (id, title, description, completed)
VALUES (${id}, ${title}, ${description}, ${completed})
```

### Atualizar todo

```sql
UPDATE todos
SET title = ${title},
    description = ${description},
    completed = ${completed}
WHERE id = ${id}
```

### Excluir todo

```sql
DELETE FROM todos
WHERE id = ${id}
```

---

# Deploy

A aplicação pode ser hospedada em serviços compatíveis com Node.js.

Exemplo de produção:

```text
https://api-node-fastfy.onrender.com
```

Configure no ambiente de produção:

```env
DATABASE_URL=...
JWT_SECRET=...
PORT=...
```

### Deploy

1. Instalar dependências:

```bash
npm install
```

2. Configurar variáveis de ambiente.

3. Iniciar a aplicação:

```bash
npm start
```

A aplicação executa a inicialização das tabelas através de:

```js
await database.init();
```

---

# Fluxo da aplicação

## Cadastro

```text
Cliente
  ↓
POST /users
  ↓
Fastify
  ↓
bcrypt.hash()
  ↓
PostgreSQL
  ↓
Usuário criado
```

## Login

```text
Cliente
  ↓
POST /login
  ↓
Fastify
  ↓
PostgreSQL
  ↓
bcrypt.compare()
  ↓
JWT
  ↓
Cliente
```

## Requisição autenticada

```text
Cliente
  ↓
Authorization: Bearer JWT
  ↓
Fastify
  ↓
jwtVerify()
  ↓
/todos
  ↓
PostgreSQL
  ↓
Resposta
```

---

# Decisões arquiteturais

* **Fastify** é utilizado como framework HTTP.
* **PostgreSQL** é utilizado como banco de dados relacional.
* O pacote `postgres` é utilizado para comunicação com o banco sem ORM.
* A lógica de acesso ao banco está isolada em `database-postgres.js`.
* O projeto utiliza SQL diretamente.
* **JWT** é utilizado para autenticação.
* **bcryptjs** é utilizado para armazenamento seguro das senhas.
* As rotas protegidas utilizam um `preHandler` de autenticação.
* As tabelas são inicializadas automaticamente através das migrations SQL.

---

# 🚀 Melhorias futuras

* Adicionar validação de dados com Zod ou JSON Schema.
* Implementar Swagger/OpenAPI.
* Adicionar testes unitários e de integração.
* Implementar refresh token.
* Adicionar expiração de JWT.
* Implementar rate limiting.
* Configurar Docker.
* Criar pipeline de CI/CD.
* Adotar uma ferramenta de migrations dedicada.
* Implementar paginação.
* Adicionar filtros avançados.
* Adicionar ordenação.
* Adicionar relação entre usuários e todos.
* Fazer cada usuário visualizar apenas seus próprios todos.
* Adicionar recuperação de senha.
* Adicionar roles e permissões.
* Adicionar logs estruturados.

---

# Checklist de execução

* [ ] Clonar o repositório
* [ ] Entrar na pasta do projeto
* [ ] Instalar dependências
* [ ] Criar arquivo `.env`
* [ ] Configurar `DATABASE_URL`
* [ ] Configurar `JWT_SECRET`
* [ ] Iniciar a aplicação
* [ ] Criar um usuário através de `POST /users`
* [ ] Fazer login através de `POST /login`
* [ ] Copiar o JWT retornado
* [ ] Enviar o JWT no header `Authorization`
* [ ] Criar um todo
* [ ] Listar os todos
* [ ] Buscar um todo
* [ ] Atualizar um todo
* [ ] Excluir um todo
