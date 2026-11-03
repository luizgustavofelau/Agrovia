const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const path = require('node:path');

// Banco em memória com as tabelas usadas pela integração. Nenhum banco real é acessado.
const fixture = `
  const { pool } = require('./db');
  const hoje = () => new Date();
  const db = {
    dispositivos: [
      { id_dispositivo: 1, nome_dispositivo: 'ESP32 Teste', mac_address: '02:00:00:00:00:01', id_fazenda_fk: 10,
        id_campo: 1, deleted_at: null, chave_hash: null, ultima_leitura_umidade: null, ultima_atualizacao: null },
      { id_dispositivo: 2, nome_dispositivo: 'ESP32 Alheio', mac_address: '02:00:00:00:00:02', id_fazenda_fk: 20,
        id_campo: 1, deleted_at: null, chave_hash: null, ultima_leitura_umidade: null, ultima_atualizacao: null },
    ],
    fazendas: [{ id_fazenda: 10, id_usuario_fk: 7, nome_fazenda: 'Fazenda Teste' }, { id_fazenda: 20, id_usuario_fk: 8, nome_fazenda: 'Outra' }],
    historico: [],
    comandos: [],
  };
  const dono = (d) => db.fazendas.find((f) => f.id_fazenda === d.id_fazenda_fk).id_usuario_fk;
  process.on('message', (m) => {
    if (m === 'expirar') db.comandos.forEach((c) => { c.expira_em = new Date(Date.now() - 1000); });
    if (m === 'estado') process.send({ estado: db });
  });
  pool.query = async (sql, values) => {
    if (sql.startsWith("UPDATE COMANDOS_IRRIGACAO SET status = 'ENVIADO'")) {
      for (const c of db.comandos) if (values[0].includes(c.id_comando) && c.status === 'PENDENTE') { c.status = 'ENVIADO'; c.entregue_em = hoje(); }
      return [{ affectedRows: 1 }];
    }
    return [[{ ok: 1 }]];
  };
  pool.execute = async (sql, v = []) => {
    if (sql.includes('WHERE d.chave_hash = ?')) {
      const d = db.dispositivos.find((x) => x.chave_hash === v[0] && !x.deleted_at);
      return [d ? [{ id_dispositivo: d.id_dispositivo, nome_dispositivo: d.nome_dispositivo, id_usuario_fk: dono(d) }] : []];
    }
    if (sql.includes('WHERE d.id_dispositivo = ? AND f.id_usuario_fk = ?')) {
      const d = db.dispositivos.find((x) => x.id_dispositivo === Number(v[0]) && dono(x) === v[1] && !x.deleted_at);
      return [d ? [{ id_dispositivo: d.id_dispositivo, nome_dispositivo: d.nome_dispositivo }] : []];
    }
    if (sql.includes("SET status = 'EXPIRADO'")) {
      for (const c of db.comandos) if (c.id_dispositivo_fk === v[0] && c.status === 'PENDENTE' && c.expira_em <= hoje()) c.status = 'EXPIRADO';
      return [{}];
    }
    if (sql.includes("SET status = 'CANCELADO'")) {
      for (const c of db.comandos) if (c.id_dispositivo_fk === v[0] && c.status === 'PENDENTE') c.status = 'CANCELADO';
      return [{}];
    }
    if (sql.startsWith('SELECT id_comando, acao, duracao_segundos FROM COMANDOS_IRRIGACAO')) {
      return [db.comandos.filter((c) => c.id_dispositivo_fk === v[0] && c.status === 'PENDENTE' && c.expira_em > hoje())];
    }
    if (sql.startsWith('INSERT INTO HISTORICO_UMIDADE')) {
      for (let i = 0; i < v.length; ) {
        db.historico.push({ id_dispositivo_fk: v[i], valor_umidade: v[i + 1], data_hora: hoje() });
        i += sql.includes('FROM_UNIXTIME') ? 3 : 2;
      }
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('SET ultima_leitura_umidade = ?')) {
      const d = db.dispositivos.find((x) => x.id_dispositivo === v[1]);
      d.ultima_leitura_umidade = v[0]; d.ultima_atualizacao = hoje();
      return [{}];
    }
    if (sql.startsWith('UPDATE DISPOSITIVOS SET ultima_atualizacao = NOW()')) {
      db.dispositivos.find((x) => x.id_dispositivo === v[0]).ultima_atualizacao = hoje();
      return [{}];
    }
    if (sql.startsWith('UPDATE DISPOSITIVOS SET chave_hash = ?')) {
      db.dispositivos.find((x) => x.id_dispositivo === v[1]).chave_hash = v[0];
      return [{}];
    }
    if (sql.includes('SET status = ?, mensagem = ?, concluido_em = NOW()')) {
      const c = db.comandos.find((x) => x.id_comando === Number(v[2]) && x.id_dispositivo_fk === v[3] && ['ENVIADO', 'PENDENTE'].includes(x.status));
      if (c) { c.status = v[0]; c.mensagem = v[1]; c.concluido_em = hoje(); }
      return [{ affectedRows: c ? 1 : 0 }];
    }
    if (sql.startsWith('INSERT INTO COMANDOS_IRRIGACAO')) {
      const c = { id_comando: db.comandos.length + 1, id_dispositivo_fk: v[0], id_usuario_fk: v[1], acao: v[2],
        duracao_segundos: v[3], status: 'PENDENTE', mensagem: null, criado_em: hoje(),
        expira_em: new Date(Date.now() + 120000), entregue_em: null, concluido_em: null };
      db.comandos.push(c);
      return [{ insertId: c.id_comando }];
    }
    if (sql.includes('FROM COMANDOS_IRRIGACAO WHERE id_comando = ?')) return [db.comandos.filter((c) => c.id_comando === v[0])];
    if (sql.includes('FROM COMANDOS_IRRIGACAO WHERE id_dispositivo_fk = ? ORDER BY')) {
      return [db.comandos.filter((c) => c.id_dispositivo_fk === v[0]).slice().reverse()];
    }
    if (sql.startsWith('SELECT valor_umidade AS umidade')) {
      return [db.historico.filter((h) => h.id_dispositivo_fk === v[0]).map((h) => ({ umidade: h.valor_umidade, dataHora: h.data_hora })).reverse()];
    }
    if (sql.includes('AS chaveConfigurada')) {
      return [db.dispositivos.filter((d) => dono(d) === v[0]).map((d) => ({
        id: d.id_dispositivo, nome: d.nome_dispositivo, mac: d.mac_address, id_fazenda: d.id_fazenda_fk, id_campo: d.id_campo,
        fazenda: 'Fazenda Teste', ultimaUmidade: d.ultima_leitura_umidade,
        // Como no SQL real: último contato = leitura mais recente do histórico.
        ...(() => {
          const ultima = db.historico.filter((h) => h.id_dispositivo_fk === d.id_dispositivo).map((h) => h.data_hora).sort((a, b) => b - a)[0] || null;
          return { ultimaAtualizacao: ultima, conectado: ultima && Date.now() - ultima < 180000 ? 1 : 0 };
        })(),
        chaveConfigurada: d.chave_hash ? 1 : 0 }))];
    }
    throw Error('UNEXPECTED_SQL ' + sql.slice(0, 60));
  };
  require('./server');
`;

const SECRET = 'segredo-exclusivo-para-testes-automatizados';
const PORT = 15065;
const base = `http://127.0.0.1:${PORT}`;
const tokenDe = (sub) => {
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
  return payload + '.' + crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
};

test('ESP32 simulado: chave, leituras, comando de irrigação executado e confirmado', { timeout: 60000 }, async (t) => {
  const backend = path.resolve(__dirname, '..');
  const server = spawn(process.execPath, ['-e', fixture], {
    cwd: backend,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT),
      DATABASE_URL: 'mysql://test:test@127.0.0.1:1/test', AUTH_TOKEN_SECRET: SECRET,
      FRONTEND_URL: 'https://frontend.example', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  t.after(async () => { if (server.exitCode === null) { server.kill(); await once(server, 'exit'); } });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('START_TIMEOUT')), 10000);
    server.once('exit', () => { clearTimeout(timer); reject(Error('START_FAILED')); });
    server.stdout.on('data', (d) => { if (String(d).includes('Servidor Agrovia iniciado')) { clearTimeout(timer); resolve(); } });
  });
  const estado = () => new Promise((resolve) => { server.once('message', (m) => resolve(m.estado)); server.send('estado'); });
  const user = { Authorization: `Bearer ${tokenDe(7)}`, 'Content-Type': 'application/json' };
  const api = (metodo, caminho, corpo, headers = user) =>
    fetch(base + caminho, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });

  // Chave do dispositivo: só o dono gera, e o banco guarda apenas o hash.
  assert.equal((await api('POST', '/api/dispositivos/2/chave')).status, 404, 'dispositivo de outro usuário');
  let response = await api('POST', '/api/dispositivos/1/chave');
  assert.equal(response.status, 201);
  const { chave } = await response.json();
  assert.match(chave, /^agv_[A-Za-z0-9_-]{43}$/);
  assert.equal((await estado()).dispositivos[0].chave_hash, crypto.createHash('sha256').update(chave).digest('hex'));

  // Aparelho sem chave válida não entra; rotas do aparelho não aceitam sessão de usuário.
  const device = (k) => ({ 'X-Device-Key': k, 'Content-Type': 'application/json' });
  assert.equal((await api('POST', '/api/iot/leituras', { umidade: 40 }, device('agv_' + 'x'.repeat(43)))).status, 401);
  assert.equal((await api('POST', '/api/iot/leituras', { umidade: 40 })).status, 401);

  // Validações do comando.
  assert.equal((await api('POST', '/api/dispositivos/1/comandos', { acao: 'LIGAR', duracao_segundos: 2 })).status, 400);
  assert.equal((await api('POST', '/api/dispositivos/1/comandos', { acao: 'LIGAR', duracao_segundos: 4000 })).status, 400);
  assert.equal((await api('POST', '/api/dispositivos/1/comandos', { acao: 'ABRIR' })).status, 400);
  assert.equal((await api('POST', '/api/dispositivos/2/comandos', { acao: 'LIGAR', duracao_segundos: 30 })).status, 404);

  // Comando expirado não chega ao aparelho.
  assert.equal((await api('POST', '/api/dispositivos/1/comandos', { acao: 'LIGAR', duracao_segundos: 30 })).status, 201);
  server.send('expirar');
  response = await api('GET', '/api/iot/comandos', null, device(chave));
  assert.deepEqual((await response.json()).comandos, [], 'comando vencido não é entregue');

  // Novo comando substitui o pendente anterior.
  await api('POST', '/api/dispositivos/1/comandos', { acao: 'LIGAR', duracao_segundos: 20 });
  response = await api('POST', '/api/dispositivos/1/comandos', { acao: 'LIGAR', duracao_segundos: 45 });
  assert.equal(response.status, 201);
  const comando = await response.json();
  assert.equal(comando.status, 'PENDENTE');

  // O simulador faz o papel do ESP32: envia leituras, recebe o comando, executa e confirma.
  const simulador = spawn(process.execPath, ['tools/simulador-esp32.js', '--intervalo=5', '--ciclos=2', '--umidade=30'], {
    cwd: backend, env: { ...process.env, AGROVIA_API: base, AGROVIA_DEVICE_KEY: chave }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let saida = '';
  simulador.stdout.on('data', (d) => { saida += d; });
  simulador.stderr.on('data', (d) => { saida += d; });
  await once(simulador, 'exit');
  assert.match(saida, /Comando #\d+ LIGAR: Válvula aberta por 45 s/);
  assert.doesNotMatch(saida, /Falha na comunicação/);

  response = await api('GET', '/api/dispositivos/1/comandos');
  const historicoComandos = await response.json();
  assert.equal(historicoComandos[0].id, comando.id);
  assert.equal(historicoComandos[0].status, 'EXECUTADO');
  assert.deepEqual(historicoComandos.slice(1).map((c) => c.status), ['CANCELADO', 'EXPIRADO']);

  response = await api('GET', '/api/dispositivos/1/leituras');
  const leituras = await response.json();
  assert.equal(leituras.length, 2);
  assert.ok(leituras[1].umidade > leituras[0].umidade, 'umidade sobe com a válvula aberta');

  response = await api('GET', '/api/dispositivos?id_usuario=7');
  const [lista] = await response.json();
  assert.equal(lista.online, true);
  assert.equal(lista.status, 'ON');
  assert.equal(lista.chaveConfigurada, true);
  assert.equal(lista.ultimaUmidade, leituras[1].umidade);

  // Validações das leituras e limite de frequência.
  assert.equal((await api('POST', '/api/iot/leituras', { umidade: 150 }, device(chave))).status, 429, 'envio logo após o anterior');
  await new Promise((r) => setTimeout(r, 5100));
  assert.equal((await api('POST', '/api/iot/leituras', { umidade: 150 }, device(chave))).status, 400);
  assert.equal((await api('POST', '/api/iot/leituras', { leituras: [{ umidade: 40, timestamp: Math.floor(Date.now() / 1000) + 3600 }] }, device(chave))).status, 400, 'horário no futuro');

  // Gerar outra chave invalida a anterior.
  await api('POST', '/api/dispositivos/1/chave');
  assert.equal((await api('GET', '/api/iot/comandos', null, device(chave))).status, 401);
});
