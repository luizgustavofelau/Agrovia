const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const path = require('node:path');
const { hashPassword, verifyPassword } = require('../password');

test('recuperação de senha: link de uso único, expiração, assinatura e resposta que não revela contas', { timeout: 60000 }, async (t) => {
  const SECRET = 'segredo-exclusivo-para-testes-automatizados';
  const senhaAntiga = 'senhaAntiga123';
  const hashInicial = await hashPassword(senhaAntiga);
  // Banco em memória com um usuário. Nenhum banco real é acessado.
  const fixture = `
    const { pool } = require('./db');
    const usuarios = [{ id_usuario: 3, nome: 'Produtor', email: 'produtor@example.invalid', telefone: null,
      tipo_usuario: 'AGRICULTOR', senha: process.env.HASH_INICIAL }];
    process.on('message', () => process.send({ senha: usuarios[0].senha }));
    pool.query = async () => [[{ ok: 1 }]];
    pool.execute = async (sql, v) => {
      if (sql.includes('FROM USUARIO WHERE email = ?')) return [usuarios.filter((u) => u.email === v[0])];
      if (sql.includes('FROM USUARIO WHERE id_usuario = ?')) return [usuarios.filter((u) => u.id_usuario === v[0])];
      if (sql.startsWith('UPDATE USUARIO SET senha = ?')) {
        const u = usuarios.find((x) => x.id_usuario === v[1] && x.senha === v[2]);
        if (u) u.senha = v[0];
        return [{ affectedRows: u ? 1 : 0 }];
      }
      throw Error('UNEXPECTED_SQL ' + sql.slice(0, 50));
    };
    require('./server');
  `;
  const server = spawn(process.execPath, ['-e', fixture], {
    cwd: path.resolve(__dirname, '..'),
    // Desenvolvimento: sem SMTP, o link é escrito no log (é assim que o teste o captura).
    env: { ...process.env, NODE_ENV: 'development', PORT: '15066', DATABASE_URL: 'mysql://test:test@127.0.0.1:1/test',
      AUTH_TOKEN_SECRET: SECRET, FRONTEND_URL: 'http://localhost:3000', FRONTEND_BASE_PATH: '/tecti/2026/gpec05',
      SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', HASH_INICIAL: hashInicial },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  t.after(async () => { if (server.exitCode === null) { server.kill(); await once(server, 'exit'); } });
  let log = '';
  server.stdout.on('data', (d) => { log += d; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('START_TIMEOUT')), 10000);
    server.once('exit', () => { clearTimeout(timer); reject(Error('START_FAILED')); });
    const check = () => { if (log.includes('Servidor Agrovia iniciado')) { clearTimeout(timer); resolve(); } else setTimeout(check, 50); };
    check();
  });
  const base = 'http://127.0.0.1:15066';
  const post = (caminho, corpo) => fetch(base + caminho, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  });
  const senhaAtual = () => new Promise((resolve) => { server.once('message', (m) => resolve(m.senha)); server.send('senha'); });
  const esperarLog = async (trecho) => {
    for (let i = 0; i < 40 && !log.includes(trecho); i += 1) await new Promise((r) => setTimeout(r, 50));
  };

  // E-mail inexistente e existente recebem exatamente a mesma resposta.
  let r = await post('/api/senha/esqueci', { email: 'ninguem@example.invalid' });
  assert.equal(r.status, 200);
  const respostaInexistente = await r.json();
  assert.equal(log.includes('redefinir-senha#token='), false, 'nenhum link para conta inexistente');
  r = await post('/api/senha/esqueci', { email: 'PRODUTOR@example.invalid' });
  const respostaExistente = await r.json();
  assert.deepEqual(respostaExistente, respostaInexistente);
  assert.equal(respostaExistente.envioConfigurado, false);
  assert.equal((await post('/api/senha/esqueci', { email: 'invalido' })).status, 400);

  await esperarLog('redefinir-senha#token=');
  const link = log.match(/http:\/\/localhost:3000\/tecti\/2026\/gpec05\/redefinir-senha#token=(\S+)/);
  assert.ok(link, 'link com o caminho público do site');
  const token = link[1];

  // Validação e assinatura.
  assert.equal((await (await post('/api/senha/validar', { token })).json()).valido, true);
  const [payload, assinatura] = token.split('.');
  const adulterado = Buffer.from(JSON.stringify({ sub: 3, exp: Math.floor(Date.now() / 1000) + 99999 })).toString('base64url') + '.' + assinatura;
  assert.equal((await post('/api/senha/validar', { token: adulterado })).status, 400, 'payload alterado');
  assert.equal((await post('/api/senha/validar', { token: payload + '.' + 'x'.repeat(assinatura.length) })).status, 400);
  // Token de sessão não vale como token de senha (chaves diferentes).
  const sessaoPayload = Buffer.from(JSON.stringify({ sub: 3, exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
  const tokenSessao = sessaoPayload + '.' + crypto.createHmac('sha256', SECRET).update(sessaoPayload).digest('base64url');
  assert.equal((await post('/api/senha/validar', { token: tokenSessao })).status, 400);
  // Expirado, mesmo com assinatura correta.
  const chave = crypto.createHmac('sha256', SECRET).update('agrovia:redefinir-senha').digest();
  const vencido = Buffer.from(JSON.stringify({ sub: 3, exp: Math.floor(Date.now() / 1000) - 1 })).toString('base64url');
  const tokenVencido = vencido + '.' + crypto.createHmac('sha256', chave).update(`${vencido}.${await senhaAtual()}`).digest('base64url');
  assert.equal((await post('/api/senha/redefinir', { token: tokenVencido, senha: 'NovaSenha2026' })).status, 400);

  // Senha fraca é recusada; a válida é gravada com bcrypt.
  assert.equal((await post('/api/senha/redefinir', { token, senha: 'fraca' })).status, 400);
  r = await post('/api/senha/redefinir', { token, senha: 'NovaSenha2026' });
  assert.equal(r.status, 200);
  const novoHash = await senhaAtual();
  assert.match(novoHash, /^\$2b\$12\$/);
  assert.equal(await verifyPassword('NovaSenha2026', novoHash), true);

  // Uso único: o mesmo link não funciona depois da troca.
  assert.equal((await post('/api/senha/redefinir', { token, senha: 'OutraSenha2026' })).status, 400);
  assert.equal((await post('/api/senha/validar', { token })).status, 400);

  // Login: a senha antiga deixa de valer e a nova entra.
  assert.equal((await post('/api/login', { email: 'produtor@example.invalid', senha: senhaAntiga })).status, 401);
  assert.equal((await post('/api/login', { email: 'produtor@example.invalid', senha: 'NovaSenha2026' })).status, 200);

  // Limite: no máximo 3 pedidos por e-mail por hora.
  await post('/api/senha/esqueci', { email: 'produtor@example.invalid' });
  await post('/api/senha/esqueci', { email: 'produtor@example.invalid' });
  assert.equal((await post('/api/senha/esqueci', { email: 'produtor@example.invalid' })).status, 429);
});
