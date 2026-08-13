import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const INSECURE = (process.env.INSECURE === '1' || process.env.INSECURE === 'true');

function doRequest(method, path, token, body) {
  const url = new URL(path, BASE);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const payload = body ? JSON.stringify(body) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

  const opts = {
    method,
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    headers,
  };

  if (isHttps && INSECURE) {
    opts.rejectUnauthorized = false; // allow self-signed when explicitly requested
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        const isJson = contentType.includes('application/json');
        try {
          const parsed = isJson && data ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing API at', BASE, 'insecure=', INSECURE);

  // Login
  const creds = { username: 'admin', password: '123456' };
  const loginRes = await doRequest('POST', '/login', null, creds).catch(e => ({ error: e }));
  if (loginRes.error) return console.error('Login request failed:', loginRes.error);
  if (loginRes.status !== 200) return console.error('Login failed:', loginRes.status, loginRes.body);
  const token = loginRes.body && loginRes.body.token;
  if (!token) return console.error('No token returned from login:', loginRes.body);
  console.log('Login OK, token received (truncated):', token.slice(0, 20));

  // Create todo
  const todo = { title: 'Teste automático', description: 'Criado pelo script de teste', completed: false };
  const createRes = await doRequest('POST', '/todos', token, todo).catch(e => ({ error: e }));
  if (createRes.error) return console.error('Create todo failed:', createRes.error);
  console.log('Create todo status:', createRes.status, 'body:', createRes.body);
  const id = createRes.body && createRes.body.id;

  // List todos
  const listRes = await doRequest('GET', '/todos', token).catch(e => ({ error: e }));
  if (listRes.error) return console.error('List todos failed:', listRes.error);
  console.log('List todos status:', listRes.status, 'count:', Array.isArray(listRes.body) ? listRes.body.length : 'n/a');

  // Update todo (if created)
  if (id) {
    const updateRes = await doRequest('PUT', `/todos/${id}`, token, { title: 'Atualizado', description: 'Atualizado pelo teste', completed: true }).catch(e => ({ error: e }));
    if (updateRes.error) return console.error('Update failed:', updateRes.error);
    console.log('Update status:', updateRes.status, 'body:', updateRes.body);

    // Delete
    const delRes = await doRequest('DELETE', `/todos/${id}`, token).catch(e => ({ error: e }));
    if (delRes.error) return console.error('Delete failed:', delRes.error);
    console.log('Delete status:', delRes.status, 'body:', delRes.body);
  }

  console.log('Test run finished.');
}

run().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
