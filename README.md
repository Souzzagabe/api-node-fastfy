# API de Vídeos

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
11. [Autenticação e autorização](#autenticação-e-autorização)
12. [CRUD de vídeos](#crud-de-vídeos)
13. [Códigos HTTP](#códigos-http)
14. [Tratamento de erros](#tratamento-de-erros)
15. [Exemplos de consumo](#exemplos-de-consumo)
16. [Testando a API](#testando-a-api)
17. [Testes automatizados](#testes-automatizados)
18. [Segurança](#segurança)
19. [Banco de dados e queries](#banco-de-dados-e-queries)
20. [Deploy](#deploy)
21. [Fluxo da aplicação](#fluxo-da-aplicação)
22. [Decisões arquiteturais](#decisões-arquiteturais)
23. [Melhorias futuras](#melhorias-futuras)
24. [Checklist de execução](#checklist-de-execução)

---

## Visão Geral

Esta API fornece um serviço REST para gerenciar vídeos. Ela permite criar, listar, buscar, atualizar e excluir vídeos armazenados em um banco PostgreSQL.

### Problema que resolve

Permite gerenciar um catálogo de vídeos com operações básicas de CRUD, servindo como backend para aplicações que precisam armazenar e consultar metadados de vídeos.

### Principais funcionalidades

- Criar novo vídeo
- Listar todos os vídeos
- Buscar vídeos por termo no título
- Atualizar vídeo por `id`
- Excluir vídeo por `id`

### Arquitetura geral

A aplicação é uma API REST minimalista em Node.js com Fastify. A lógica de rotas está em `server.js`, enquanto o acesso ao banco está centralizado em `database-postgres.js`. Há uma migration SQL para criar a tabela `videos`.

---

## Stack Tecnológica

- Node.js
- JavaScript (ES Modules)
- Fastify
- PostgreSQL
- `postgres` (cliente SQL)
- `dotenv`
- `crypto` (módulo nativo do Node.js)

---

## Pré-requisitos

- Node.js instalado
- npm disponível
- PostgreSQL ou serviço compatível com PostgreSQL
- Arquivo `.env` configurado com `DATABASE_URL`

Verifique as versões com:

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

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL=
PORT=
```

### Variáveis

- `DATABASE_URL`
  - O que representa: string de conexão com o banco PostgreSQL.
  - Obrigatória: sim.
  - Onde é utilizada: `database-postgres.js`, `db.js`.
  - Exemplo: `postgresql://usuario:senha@host:porta/banco?sslmode=require`

- `PORT`
  - O que representa: porta em que o servidor escuta.
  - Obrigatória: não.
  - Onde é utilizada: `server.js`.
  - Exemplo: `3000`

> Não inclua credenciais reais no repositório.

---

## Banco de dados

### Banco utilizado

- PostgreSQL

### Como criar/configurar o banco

1. Crie um banco PostgreSQL local ou em nuvem.
2. Obtenha a connection string (URL) no formato:

```text
postgresql://usuario:senha@host:porta/banco?sslmode=require
```

3. Configure `DATABASE_URL` no `.env`.

### Como conectar a aplicação

A aplicação se conecta ao banco usando `postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false }})`.

### Executar criação de tabelas

Rode a migration:

```bash
npm run migrate
```

### Schema do banco

Tabela: `videos`

| Coluna       | Tipo         | Atributos                    |
|--------------|--------------|------------------------------|
| `id`         | `uuid`       | `PRIMARY KEY`                |
| `title`      | `text`       | `NOT NULL`                   |
| `description`| `text`       | `NOT NULL`                   |
| `duration`   | `integer`    | `NOT NULL`                   |
| `created_at` | `timestamptz`| `NOT NULL DEFAULT now()`     |

---

## Estrutura do projeto

```
.
├── .env
├── database-postgres.js
├── db.js
├── db-mem.js
├── migrate.js
├── migrations/
│   └── 001-create-videos-table.sql
├── node_modules/
├── package.json
├── package-lock.json
├── routes.http
└── server.js
```

### Responsabilidade dos arquivos

- `server.js`: servidor Fastify e definição de rotas.
- `database-postgres.js`: conexão com PostgreSQL e consultas SQL.
- `db.js`: conexão de banco para migration e funções auxiliares.
- `db-mem.js`: implementação em memória para testes manuais (não utilizada no servidor atual).
- `migrate.js`: executa a migration para criar a tabela.
- `migrations/001-create-videos-table.sql`: cria a tabela `videos`.
- `routes.http`: exemplos de requisições REST para o VS Code REST Client.

---

## Executando a aplicação

### Iniciar em desenvolvimento

```bash
npm run dev
```

### Iniciar em produção

```bash
npm start
```

### Executar migration

```bash
npm run migrate
```

### Scripts disponíveis

- `npm start`: inicia `node server.js`.
- `npm run dev`: inicia `node --watch server.js`.
- `npm run migrate`: executa `node migrate.js`.

---

## URL da API

Base local:

```text
http://localhost:3000
```

Não há prefixo adicional de rota.

---

## Endpoints

### `POST /videos`

- Método: `POST`
- URL: `/videos`
- Objetivo: criar novo vídeo.
- Autenticação: não.
- Headers:
  - `Content-Type: application/json`

#### Body

```json
{
  "title": "node",
  "description": "This is a description of my first video.",
  "duration": 120
}
```

- `title`: obrigatório, string.
- `description`: obrigatório, string.
- `duration`: obrigatório, inteiro.

#### Resposta de sucesso

Status: `201`

```json
{
  "id": "uuid-gerado"
}
```

#### Possíveis erros

- `500` em erro interno do servidor ou do banco.

---

### `GET /videos`

- Método: `GET`
- URL: `/videos`
- Objetivo: listar vídeos.
- Autenticação: não.
- Query parameters:
  - `search` (opcional): filtra vídeos por título.

#### Exemplo

```http
GET /videos?search=node
```

#### Resposta de sucesso

Status: `200`

```json
[
  {
    "id": "uuid",
    "title": "node",
    "description": "This is a description of my first video.",
    "duration": 120,
    "created_at": "2026-08-12T00:00:00.000Z"
  }
]
```

---

### `PUT /videos/:id`

- Método: `PUT`
- URL: `/videos/:id`
- Objetivo: atualizar vídeo existente.
- Autenticação: não.
- Parâmetros de rota:
  - `id`: UUID do vídeo.

#### Body

```json
{
  "title": "Updated Video Title",
  "description": "This is an updated description.",
  "duration": 150
}
```

#### Resposta de sucesso

Status: `200`

```json
{
  "message": "Video updated successfully!"
}
```

#### Possíveis erros

- `404` se o vídeo não existir.

```json
{
  "message": "Video not found"
}
```

- `500` em erro interno.

---

### `DELETE /videos/:id`

- Método: `DELETE`
- URL: `/videos/:id`
- Objetivo: remover vídeo.
- Autenticação: não.
- Parâmetros de rota:
  - `id`: UUID do vídeo.

#### Resposta de sucesso

Status: `200`

```json
{
  "message": "Video deleted successfully!"
}
```

#### Possíveis erros

- `500` em erro interno.

---

## Autenticação e autorização

A aplicação atual não implementa autenticação ou autorização. Todas as rotas são públicas.

---

## CRUD de vídeos

Os recursos implementados são:

- `CREATE` — `POST /videos`
- `READ` — `GET /videos`
- `UPDATE` — `PUT /videos/:id`
- `DELETE` — `DELETE /videos/:id`

> Não há endpoint `GET /videos/:id` no projeto atual.

---

## Códigos HTTP

A API utiliza os seguintes códigos reais:

- `200 OK` — sucesso em listagem, atualização e exclusão.
- `201 Created` — vídeo criado.
- `404 Not Found` — vídeo não encontrado em atualização.
- `500 Internal Server Error` — erro de execução.

> Os códigos `400`, `401`, `403`, `409` não são tratados explicitamente no código atual.

---

## Tratamento de erros

O tratamento de erros é simples. O código retorna mensagens com o formato padrão do Fastify ou as mensagens definidas no próprio endpoint.

Exemplo de erro real:

```json
{
  "message": "Video not found"
}
```

---

## Exemplos de consumo

### cURL

#### Criar vídeo

```bash
curl -X POST http://localhost:3000/videos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "node",
    "description": "This is a description of my first video.",
    "duration": 120
  }'
```

#### Listar vídeos

```bash
curl http://localhost:3000/videos
```

#### Buscar vídeos

```bash
curl "http://localhost:3000/videos?search=node"
```

#### Atualizar vídeo

```bash
curl -X PUT http://localhost:3000/videos/<VIDEO_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Video Title",
    "description": "This is an updated description.",
    "duration": 150
  }'
```

#### Excluir vídeo

```bash
curl -X DELETE http://localhost:3000/videos/<VIDEO_ID>
```

### JavaScript / Fetch

```js
const baseUrl = 'http://localhost:3000';

async function createVideo(video) {
  const response = await fetch(`${baseUrl}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video),
  });
  return response.json();
}

async function getVideos(search) {
  const url = new URL(`${baseUrl}/videos`);
  if (search) url.searchParams.set('search', search);
  const response = await fetch(url);
  return response.json();
}
```

> Axios não está presente no projeto atual.

---

## Testando a API

### Usando o REST Client do VS Code

Abra o arquivo `routes.http` e envie cada bloco de requisição.

### Usando Postman ou Insomnia

Crie as requisições para os endpoints:

- `POST http://localhost:3000/videos`
- `GET http://localhost:3000/videos`
- `PUT http://localhost:3000/videos/:id`
- `DELETE http://localhost:3000/videos/:id`

---

## Testes automatizados

O projeto não possui testes automatizados configurados.

---

## Segurança

### Implementações atuais

- Uso de variáveis de ambiente para a conexão com o banco.
- SSL habilitado no cliente PostgreSQL (`rejectUnauthorized: false`).

### Melhorias de segurança recomendadas

- Adicionar validação de entrada com Zod ou Joi.
- Implementar autenticação e autorização.
- Validar e sanitizar dados do request.
- Configurar CORS corretamente.
- Adicionar rate limiting.
- Adotar logging estruturado.

---

## Banco de dados e queries

A aplicação usa o cliente `postgres` para executar queries SQL diretamente.

### Operações reais

#### Listar vídeos

```sql
SELECT id, title, description, duration, created_at
FROM videos
ORDER BY created_at DESC
```

#### Buscar vídeos

```sql
SELECT id, title, description, duration, created_at
FROM videos
WHERE title ILIKE ${pattern}
ORDER BY created_at DESC
```

#### Inserir vídeo

```sql
INSERT INTO videos (id, title, description, duration)
VALUES (${id}, ${title}, ${description}, ${duration})
```

#### Atualizar vídeo

```sql
UPDATE videos
SET title = ${title},
    description = ${description},
    duration = ${duration}
WHERE id = ${id}
```

#### Excluir vídeo

```sql
delete from videos
where id = ${id}
```

---

## Deploy

O projeto não inclui configuração de deploy específica.

### Sugestão de deploy

- Configure `DATABASE_URL` no ambiente de produção.
- Configure `PORT` conforme necessário.
- Execute `npm install`.
- Execute `npm run migrate`.
- Execute `npm start`.

---

## Fluxo da aplicação

1. Cliente envia requisição HTTP.
2. `server.js` recebe a requisição.
3. A rota processa o corpo, parâmetros e query.
4. A rota chama métodos em `DatabasePostgres`.
5. `DatabasePostgres` executa a query no PostgreSQL.
6. O servidor retorna a resposta ao cliente.

---

## Decisões arquiteturais

- Fastify é usado para criar um servidor HTTP leve.
- `postgres` é usado como cliente SQL direto, sem ORM.
- A lógica de banco está isolada em `database-postgres.js`.
- O projeto adota migração SQL manual para criar a tabela.
- Não há middleware de autenticação ou validação de entrada no estado atual.

---

## 🚀 Melhorias futuras

- Adicionar validação de dados com Zod/Joi.
- Implementar Swagger/OpenAPI.
- Escrever testes unitários e de integração.
- Implementar autenticação JWT.
- Adicionar refresh token.
- Incluir rate limiting.
- Configurar Docker.
- Criar pipeline de CI/CD.
- Adotar uma ferramenta de migrations dedicada.
- Implementar paginação e filtros avançados.
- Adicionar cache.

---

## Checklist de execução

- [ ] Clonar o repositório
- [ ] Entrar na pasta do projeto
- [ ] Instalar dependências
- [ ] Criar arquivo `.env`
- [ ] Configurar `DATABASE_URL`
- [ ] Executar `npm run migrate`
- [ ] Iniciar a aplicação
- [ ] Testar o endpoint `http://localhost:3000/videos`
