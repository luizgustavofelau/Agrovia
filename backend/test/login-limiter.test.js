const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoginLimiter } = require('../login-limiter');

test('limitador bloqueia após falhas repetidas e libera ao fim da janela', () => {
  let clock = 0;
  const limiter = createLoginLimiter({ windowMs: 1000, maxPerAccount: 3, maxPerIp: 10, now: () => clock });
  const identity = { ip: '1.1.1.1', email: 'a@example.com' };
  for (let i = 0; i < 3; i += 1) {
    assert.equal(limiter.check(identity), 0);
    limiter.fail(identity);
  }
  assert.equal(limiter.check(identity), 1);
  assert.equal(limiter.check({ ...identity, email: 'b@example.com' }), 0, 'outra conta segue liberada');
  clock = 1001;
  assert.equal(limiter.check(identity), 0);
});

test('limitador por IP cobre várias contas e login correto zera a conta', () => {
  const limiter = createLoginLimiter({ maxPerAccount: 2, maxPerIp: 3 });
  const ip = '2.2.2.2';
  limiter.fail({ ip, email: 'a@example.com' });
  limiter.reset({ ip, email: 'a@example.com' });
  limiter.fail({ ip, email: 'a@example.com' });
  assert.equal(limiter.check({ ip, email: 'a@example.com' }), 0);
  limiter.fail({ ip, email: 'b@example.com' });
  limiter.fail({ ip, email: 'c@example.com' });
  assert.ok(limiter.check({ ip, email: 'd@example.com' }) > 0);
});
