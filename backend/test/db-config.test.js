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
