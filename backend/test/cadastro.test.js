const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

test('cadastro cria AGRICULTOR com bcrypt, recusa duplicado e permite login', async (t) => {
  // Pool substituído apenas neste processo de teste: nenhum banco real é acessado.
  const fixture = `
    const { pool } = require('./db');
    const users = [];
    pool.query = async () => [[{ ok: 1 }]];
    pool.execute = async (sql, values) => {
      if (sql.startsWith('INSERT INTO USUARIO')) {
        if (users.some((u) => u.email === values[1])) throw Object.assign(Error('dup'), { code: 'ER_DUP_ENTRY' });
        const user = { id_usuario: users.length + 1, nome: values[0], email: values[1], telefone: values[2], tipo_usuario: 'AGRICULTOR', senha: values[3] };
        users.push(user);
        process.send({ senha: user.senha, tipo: user.tipo_usuario });
        return [{ insertId: user.id_usuario }];
      }
      if (sql.includes('FROM USUARIO WHERE email = ?')) return [users.filter((u) => u.email === values[0])];
      throw Error('UNEXPECTED_SQL');
    };
    require('./server');
  `;
  const child = spawn(process.execPath, ['-e', fixture], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', PORT: '15063',
      DATABASE_URL: 'mysql://test:test@127.0.0.1:1/test',
      AUTH_TOKEN_SECRET: 'segredo-exclusivo-para-testes-automatizados',
      FRONTEND_URL: 'https://frontend.example', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } });
  const stored = [];
  child.on('message', (message) => stored.push(message));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('START_TIMEOUT')), 10000);
    child.once('exit', () => { clearTimeout(timer); reject(Error('START_FAILED')); });
    child.stdout.on('data', (data) => {
      if (String(data).includes('Servidor Agrovia iniciado')) { clearTimeout(timer); resolve(); }
    });
  });
  const base = 'http://127.0.0.1:15063';
  const post = (path, body) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const conta = { nome: 'Produtor Teste', email: 'Produtor@Example.invalid', telefone: '', senha: 'senhaForte123' };

  for (const [body, motivo] of [
    [{ ...conta, nome: '' }, 'nome vazio'],
    [{ ...conta, email: 'invalido' }, 'e-mail inválido'],
    [{ ...conta, senha: 'curta1' }, 'senha curta'],
    [{ ...conta, senha: 'somenteletras' }, 'senha sem número'],
    [{ ...conta, nome: 'x'.repeat(101) }, 'nome longo'],
  ]) {
    assert.equal((await post('/api/cadastro', body)).status, 400, motivo);
  }
  assert.equal(stored.length, 0, 'nada gravado com dados inválidos');

  let response = await post('/api/cadastro', conta);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.ok(body.accessToken);
  assert.equal(body.usuario.email, 'produtor@example.invalid');
  assert.equal(body.usuario.tipo, 'AGRICULTOR');
  assert.equal(JSON.stringify(body).includes('$2b$'), false, 'hash não é devolvido');
  assert.match(stored[0].senha, /^\$2b\$12\$/);
  assert.equal(stored[0].tipo, 'AGRICULTOR');

  // Mesmo e-mail com outra capitalização é duplicado.
  response = await post('/api/cadastro', { ...conta, email: 'produtor@example.INVALID' });
  assert.equal(response.status, 409);

  // Perfil enviado pelo cliente é ignorado: não é possível se cadastrar como TECNICO.
  response = await post('/api/cadastro', { ...conta, email: 'outro@example.invalid', tipo_usuario: 'TECNICO' });
  assert.equal(response.status, 201);
  assert.equal(stored[1].tipo, 'AGRICULTOR');

  response = await post('/api/login', { email: conta.email, senha: conta.senha });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).usuario.tipo, 'AGRICULTOR');

  // Limite de 10 tentativas por IP por hora (8 já foram usadas acima).
  await post('/api/cadastro', { ...conta, email: 'a@example.invalid' });
  await post('/api/cadastro', { ...conta, email: 'b@example.invalid' });
  assert.equal((await post('/api/cadastro', { ...conta, email: 'c@example.invalid' })).status, 429);
});
