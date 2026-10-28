const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { scryptSync } = require('node:crypto');
const { verifyPassword } = require('../password');

test('login atualiza scrypt para bcrypt e autentica novamente sem expor hash', async (t) => {
  const password = 'senha-de-teste-integracao';
  const salt = 'b'.repeat(32);
  const legacyHash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
  // Apenas este processo de teste substitui o pool: nenhum banco real é acessado.
  const fixture = `
    const { pool } = require('./db');
    let stored = process.env.TEST_PASSWORD_HASH;
    pool.query = async () => [[{ ok: 1 }]];
    pool.execute = async (sql, values) => {
      if (sql.startsWith('SELECT * FROM USUARIO')) return [[{
        id_usuario: 1, nome: 'Teste', email: 'teste@example.invalid', senha: stored, tipo_usuario: 'TECNICO'
      }]];
      if (sql.startsWith('UPDATE USUARIO SET senha')) {
        if (values[2] !== stored) throw Error('INVALID_PREVIOUS_HASH');
        stored = values[0];
        process.send({ hash: stored });
        return [{ affectedRows: 1 }];
      }
      throw Error('UNEXPECTED_SQL');
    };
    require('./server');
  `;
  const child = spawn(process.execPath, ['-e', fixture], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', PORT: '15062',
      DATABASE_URL: 'mysql://test:test@127.0.0.1:1/test',
      AUTH_TOKEN_SECRET: 'segredo-exclusivo-para-testes-automatizados',
      FRONTEND_URL: 'https://frontend.example', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '',
      TEST_PASSWORD_HASH: legacyHash },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  const upgrades = [];
  child.on('message', (message) => upgrades.push(message.hash));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('START_TIMEOUT')), 10000);
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); reject(Error('START_FAILED')); });
    child.stdout.on('data', (data) => {
      if (String(data).includes('Servidor Agrovia iniciado')) { clearTimeout(timer); resolve(); }
    });
  });
  const login = (senha) => fetch('http://127.0.0.1:15062/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teste@example.invalid', senha }),
  });
  assert.equal((await login('senha-incorreta')).status, 401);
  assert.equal(upgrades.length, 0);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await login(password);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.accessToken);
    assert.equal(body.usuario.tipo, 'TECNICO');
    assert.equal(JSON.stringify(body).includes('scrypt$'), false);
    assert.equal(JSON.stringify(body).includes('$2b$'), false);
    assert.equal(body.usuario.senha, undefined);
  }
  assert.equal(upgrades.length, 1);
  assert.match(upgrades[0], /^\$2b\$12\$/);
  assert.equal(await verifyPassword(password, upgrades[0]), true);
});
