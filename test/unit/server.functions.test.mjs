import { test } from 'node:test'
import assert from 'node:assert/strict'

// Reimplementation of the small helpers from server.js for unit testing
function isAdmin(request) {
  return request.user.role === 'admin'
}

async function getListOrDeny(request, reply, listId, database) {
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

// --- Tests ---

test('isAdmin returns true for admin role', () => {
  const req = { user: { role: 'admin' } }
  assert.strictEqual(isAdmin(req), true)
})

test('isAdmin returns false for non-admin role', () => {
  const req = { user: { role: 'user' } }
  assert.strictEqual(isAdmin(req), false)
})

test('getListOrDeny returns null and 404 when list not found', async () => {
  const database = {
    findListById: async () => null,
  }

  const reply = {
    statusCode: null,
    sent: null,
    status(code) { this.statusCode = code; return this },
    send(payload) { this.sent = payload; return this },
  }

  const req = { user: { userId: 'u1', role: 'user' } }

  const result = await getListOrDeny(req, reply, 'list-1', database)
  assert.strictEqual(result, null)
  assert.strictEqual(reply.statusCode, 404)
  assert.deepStrictEqual(reply.sent, { message: 'List not found' })
})

test('getListOrDeny returns list when owner matches', async () => {
  const expected = { id: 'list-1', user_id: 'u1', name: 'L' }
  const database = {
    findListById: async () => expected,
  }

  const reply = { statusCode: null, sent: null, status() { return this }, send() { return this } }
  const req = { user: { userId: 'u1', role: 'user' } }

  const result = await getListOrDeny(req, reply, 'list-1', database)
  assert.strictEqual(result, expected)
})

test('getListOrDeny returns null and 403 when not owner and not admin', async () => {
  const expected = { id: 'list-1', user_id: 'u2', name: 'L' }
  const database = { findListById: async () => expected }

  const reply = {
    statusCode: null,
    sent: null,
    status(code) { this.statusCode = code; return this },
    send(payload) { this.sent = payload; return this },
  }

  const req = { user: { userId: 'u1', role: 'user' } }

  const result = await getListOrDeny(req, reply, 'list-1', database)
  assert.strictEqual(result, null)
  assert.strictEqual(reply.statusCode, 403)
  assert.deepStrictEqual(reply.sent, { message: 'Forbidden' })
})

test('getListOrDeny returns list when requester is admin', async () => {
  const expected = { id: 'list-1', user_id: 'u2', name: 'L' }
  const database = { findListById: async () => expected }

  const reply = { status() { return this }, send() { return this } }
  const req = { user: { userId: 'u1', role: 'admin' } }

  const result = await getListOrDeny(req, reply, 'list-1', database)
  assert.strictEqual(result, expected)
})
