const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const { hashPassword, verifyPassword } = require('../password');

test('hash: senha correta, incorreta, hash inválido e legado bloqueado em produção', async () => {
  const hash = await hashPassword('senha-de-teste');
  assert.equal(await verifyPassword('senha-de-teste', hash), true);
  assert.equal(await verifyPassword('outra', hash), false);
  assert.equal(await verifyPassword('x', 'scrypt$bad$hash'), false);
  assert.equal(await verifyPassword('legada', 'legada'), false);
  assert.equal(await verifyPassword('legada', 'legada', true), true);
});

test('API: health, CORS, autenticação, isolamento e falha do banco', async (t) => {
  const secret = 'segredo-exclusivo-para-testes-automatizados';
  const server = spawn(process.execPath, ['server.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', PORT: '15059',
      DB_HOST: '127.0.0.1', DB_PORT: '1', DB_USER: 'test', DB_PASS: 'test', DB_NAME: 'test',
      AUTH_TOKEN_SECRET: secret, FRONTEND_URL: 'https://frontend.example', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { if (server.exitCode === null) { server.kill(); await once(server, 'exit'); } });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Startup timeout')), 10000);
    server.once('exit', () => { clearTimeout(timeout); reject(new Error('Startup failed')); });
    server.stdout.on('data', (data) => { if (String(data).includes('Servidor Agrovia iniciado')) { clearTimeout(timeout); resolve(); } });
  });
  const base = 'http://127.0.0.1:15059';
  let response = await fetch(base + '/health', { headers: { Origin: 'https://frontend.example' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://frontend.example');
  response = await fetch(base + '/health', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  response = await fetch(base + '/api/culturas');
  assert.equal(response.status, 401);
  const payload = Buffer.from(JSON.stringify({ sub: 1, exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const token = payload + '.' + crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  response = await fetch(base + '/api/usuario/2', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 403);
  response = await fetch(base + '/api/health');
  assert.equal(response.status, 503);
  response = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'teste@example.com', senha: 'teste' }) });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { mensagem: 'Banco de dados indisponível.' });
});
