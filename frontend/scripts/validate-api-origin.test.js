const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateApiOrigin } = require('./validate-api-origin');

test('origem da API: HTTPS remoto e HTTP local, sem barra final', () => {
  assert.equal(validateApiOrigin(' https://api.example.invalid/ '), 'https://api.example.invalid');
  assert.equal(validateApiOrigin('http://localhost:5000'), 'http://localhost:5000');
});

test('rejeita configurações que duplicam /api ou expõem credenciais', () => {
  for (const value of [undefined, '', 'https://api.example.invalid/api',
    'https://api.example.invalid/api/login', 'http://api.example.invalid',
    'https://user:secret@api.example.invalid', 'https://api.example.invalid/?token=secret',
    'https://api.example.invalid/#fragment', 'not-a-url']) {
    assert.throws(() => validateApiOrigin(value), (error) =>
      error.message.includes('REACT_APP_API_URL') && !error.message.includes('secret'));
  }
});
