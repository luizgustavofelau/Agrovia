const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');

test('fazenda pelo nome da cultura: registra cultura nova uma vez e reutiliza a existente', async (t) => {
  // Pool substituído apenas neste processo de teste: nenhum banco real é acessado.
  const fixture = `
    const { pool } = require('./db');
    const culturas = [];
    const fazendas = [];
    pool.query = async () => [[{ ok: 1 }]];
    pool.execute = async (sql, values) => {
      if (sql.startsWith('SELECT id_cultura FROM CULTURAS WHERE nome_cultura')) {
        return [culturas.filter((c) => c.nome.toLowerCase() === values[0].toLowerCase())];
      }
      if (sql.startsWith('INSERT INTO CULTURAS')) {
        culturas.push({ id_cultura: culturas.length + 1, nome: values[0] });
        process.send({ cultura: values[0] });
        return [{ insertId: culturas.length }];
      }
      if (sql.trim().startsWith('INSERT INTO FAZENDAS')) {
        fazendas.push({ id: fazendas.length + 1, nome: values[0], cultura: values[3], usuario: values[2] });
        return [{ insertId: fazendas.length }];
      }
      if (sql.includes('WHERE f.id_fazenda = ?')) {
        const f = fazendas[values[0] - 1];
        return [[{ id: f.id, nome: f.nome, id_cultura_fk: f.cultura,
          cultura: culturas[f.cultura - 1]?.nome, areaHa: 12.5, talhoes: 2, usuario: f.usuario }]];
      }
      throw Error('UNEXPECTED_SQL ' + sql.slice(0, 40));
    };
    require('./server');
  `;
  const secret = 'segredo-exclusivo-para-testes-automatizados';
  const child = spawn(process.execPath, ['-e', fixture], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', PORT: '15064',
      DATABASE_URL: 'mysql://test:test@127.0.0.1:1/test', AUTH_TOKEN_SECRET: secret,
      FRONTEND_URL: 'https://frontend.example', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  const criadas = [];
  child.on('message', (message) => criadas.push(message.cultura));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('START_TIMEOUT')), 10000);
    child.once('exit', () => { clearTimeout(timer); reject(Error('START_FAILED')); });
    child.stdout.on('data', (data) => {
      if (String(data).includes('Servidor Agrovia iniciado')) { clearTimeout(timer); resolve(); }
    });
  });
  const payload = Buffer.from(JSON.stringify({ sub: 7, exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const token = payload + '.' + crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const criar = (body) => fetch('http://127.0.0.1:15064/api/fazendas', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id_usuario: 7, localizacao: 'Cidade - SP', area_ha: 12.5, qtd_talhoes: 2, ...body }),
  });

  let response = await criar({ nome_fazenda: 'Fazenda A', cultura: 'Milho' });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).cultura, 'Milho');
  response = await criar({ nome_fazenda: 'Fazenda B', cultura: 'milho' });
  assert.equal(response.status, 201);
  assert.deepEqual(criadas, ['Milho'], 'cultura existente é reutilizada, sem duplicar');
  response = await criar({ nome_fazenda: 'Fazenda C', cultura: 'x'.repeat(51) });
  assert.equal(response.status, 400);
  response = await criar({ nome_fazenda: 'Fazenda D', cultura: 'Milho', id_usuario: 8 });
  assert.equal(response.status, 403, 'não cria fazenda para outro usuário');
});
