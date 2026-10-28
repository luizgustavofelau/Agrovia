const { test } = require('node:test');
const assert = require('node:assert/strict');
const { seedConfig, seedTecnico } = require('../seed');
const { verifyPassword } = require('../password');
const config = seedConfig({ SEED_TECNICO_EMAIL: ' Tecnico@example.invalid ', SEED_TECNICO_SENHA: 'senha-apenas-para-teste' });

function fakePool(existing = [], failInsert = false) {
  const state = { writes: [], began: false, committed: false, rolledBack: false, released: false };
  const connection = {
    beginTransaction: async () => { state.began = true; },
    commit: async () => { state.committed = true; },
    rollback: async () => { state.rolledBack = true; },
    release: () => { state.released = true; },
    execute: async (sql, params) => {
      if (sql.startsWith('SELECT')) return [existing];
      if (failInsert) throw new Error('simulated');
      state.writes.push(params);
      return [{ insertId: 1 }];
    },
  };
  return { state, getConnection: async () => connection };
}

test('seed valida credenciais sem incluir valores no erro', () => {
  assert.equal(config.email, 'tecnico@example.invalid');
  for (const senha of ['', 'curta', ' senha-apenas-para-teste ', 'a'.repeat(129)]) {
    assert.throws(() => seedConfig({ SEED_TECNICO_EMAIL: 'tecnico@example.invalid', SEED_TECNICO_SENHA: senha }), /SEED_CONFIG_INVALID/);
  }
});

test('seed diagnóstico não escreve nem abre transação', async () => {
  const pool = fakePool();
  assert.equal(await seedTecnico(pool, config), 'pending');
  assert.equal(pool.state.writes.length, 0);
  assert.equal(pool.state.began, false);
  assert.equal(pool.state.released, true);
});

test('seed cria TECNICO com hash compatível com login em produção', async () => {
  const pool = fakePool();
  assert.equal(await seedTecnico(pool, config, true), 'created');
  const [nome, email, hash, role] = pool.state.writes[0];
  assert.equal(nome, config.nome);
  assert.equal(email, config.email);
  assert.equal(role, 'TECNICO');
  assert.notEqual(hash, config.senha);
  assert.equal(await verifyPassword(config.senha, hash), true);
  assert.equal(pool.state.committed, true);
  assert.equal(pool.state.released, true);
});

test('seed repetida preserva conta e senha existentes', async () => {
  const pool = fakePool([{ id_usuario: 1, tipo_usuario: 'TECNICO' }]);
  assert.equal(await seedTecnico(pool, config, true), 'existing');
  assert.equal(pool.state.writes.length, 0);
  assert.equal(pool.state.released, true);
});

test('seed não promove conta e faz rollback em falha', async () => {
  for (const pool of [fakePool([{ id_usuario: 1, tipo_usuario: 'AGRICULTOR' }]), fakePool([], true)]) {
    await assert.rejects(seedTecnico(pool, config, true));
    assert.equal(pool.state.committed, false);
    assert.equal(pool.state.rolledBack, true);
    assert.equal(pool.state.released, true);
  }
});
