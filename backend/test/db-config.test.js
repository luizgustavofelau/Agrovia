const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseDatabaseUrl } = require('../db-config');

test('DATABASE_URL: porta padrão e credenciais codificadas', () => {
  assert.deepEqual(parseDatabaseUrl('mysql://user%40test:s%23nh%40%25@localhost/agrovia'), {
    host: 'localhost', port: 3306, user: 'user@test', password: 's#nh@%', database: 'agrovia',
  });
  assert.equal(parseDatabaseUrl('mysql://user:pass@localhost:3307/agrovia').port, 3307);
});

test('DATABASE_URL: configuração inválida falha sem revelar credenciais', () => {
  for (const value of [undefined, '', 'https://user:secret@localhost/db', 'mysql://user:secret@localhost', 'mysql://user:secret@localhost/db#fragment']) {
    assert.throws(() => parseDatabaseUrl(value), (error) =>
      error.message.startsWith('DATABASE_URL ausente ou inválida') && !error.message.includes('secret'));
  }
});

const { parseDatabaseVariables, resolveDatabaseConfig } = require('../db-config');

test('DB_HOST/DB_USER/DB_PASS/DB_NAME: senha com @ sem codificação e porta opcional', () => {
  const env = { DB_HOST: 'db.example', DB_USER: 'usuario', DB_PASS: 'se@nha', DB_NAME: 'banco' };
  assert.deepEqual(parseDatabaseVariables(env), {
    host: 'db.example', port: 3306, user: 'usuario', password: 'se@nha', database: 'banco',
  });
  assert.equal(resolveDatabaseConfig({ ...env, DB_PORT: '3307' }).port, 3307);
});

test('DATABASE_URL tem prioridade sobre as variáveis separadas', () => {
  const config = resolveDatabaseConfig({
    DATABASE_URL: 'mysql://url:senha@url.example/banco_url',
    DB_HOST: 'db.example', DB_USER: 'usuario', DB_PASS: 'x', DB_NAME: 'banco',
  });
  assert.equal(config.host, 'url.example');
});

test('variáveis separadas incompletas falham sem revelar a senha', () => {
  for (const env of [{}, { DB_HOST: 'h', DB_PASS: 'secret' }, { DB_HOST: 'h', DB_USER: 'u', DB_NAME: 'n' },
    { DB_HOST: 'h', DB_USER: 'u', DB_NAME: 'n', DB_PASS: 'secret', DB_PORT: 'abc' }]) {
    assert.throws(() => resolveDatabaseConfig(env), (error) =>
      error.message.startsWith('Configuração do banco incompleta') && !error.message.includes('secret'));
  }
});
