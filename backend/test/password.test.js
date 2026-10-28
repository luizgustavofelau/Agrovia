const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scryptSync } = require('node:crypto');
const bcrypt = require('bcrypt');
const { hashPassword, verifyPassword, needsPasswordRehash, isEncodedPassword } = require('../password');

test('bcrypt usa custo 12, salt aleatório e rejeita senha incorreta', async () => {
  const first = await hashPassword('senha-de-teste');
  const second = await hashPassword('senha-de-teste');
  assert.match(first, /^\$2b\$12\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('senha-de-teste', first), true);
  assert.equal(await verifyPassword('incorreta', first), false);
  assert.equal(needsPasswordRehash(first), false);
  assert.equal(needsPasswordRehash(await bcrypt.hash('senha-de-teste', 4)), true);
});

test('limite de 72 bytes impede truncamento silencioso, inclusive Unicode', async () => {
  const password = 'á'.repeat(36);
  const hash = await hashPassword(password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword(password + 'x', hash), false);
  await assert.rejects(hashPassword('á'.repeat(37)), /PASSWORD_LENGTH_INVALID/);
  await assert.rejects(hashPassword(''), /PASSWORD_LENGTH_INVALID/);
});

test('scrypt existente continua válido e é candidato à atualização', async () => {
  for (const password of ['senha-legada', 'x'.repeat(80)]) {
    const salt = 'a'.repeat(32);
    const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
    assert.equal(await verifyPassword(password, hash), true);
    assert.equal(await verifyPassword('incorreta', hash), false);
    assert.equal(needsPasswordRehash(hash), true);
    assert.equal(isEncodedPassword(hash), true);
  }
});

test('hashes malformados nunca autenticam como texto puro', async () => {
  for (const hash of ['$2b$invalid', '$2y$invalid', 'scrypt$invalid']) {
    assert.equal(isEncodedPassword(hash), true);
    assert.equal(await verifyPassword(hash, hash, true), false);
  }
  assert.equal(await verifyPassword('senha', null), false);
  assert.equal(await verifyPassword('senha', 'senha'), false);
  assert.equal(await verifyPassword('senha', 'senha', true), true);
});
