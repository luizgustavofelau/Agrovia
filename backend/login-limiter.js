// Limite de tentativas de login em memória (instância única no Render).
// Conta apenas falhas: login correto zera o contador da combinação IP + e-mail.
function createLoginLimiter({
  windowMs = 15 * 60 * 1000,
  maxPerAccount = 8,
  maxPerIp = 40,
  now = () => Date.now(),
} = {}) {
  const failures = new Map();

  const keys = ({ ip, email }) => [
    { key: `ip:${ip || 'desconhecido'}`, max: maxPerIp },
    { key: `conta:${ip || 'desconhecido'}:${email}`, max: maxPerAccount },
  ];

  const current = (key) => {
    const entry = failures.get(key);
    if (entry && entry.resetAt <= now()) {
      failures.delete(key);
      return null;
    }
    return entry || null;
  };

  // Retorna os segundos restantes de bloqueio, ou 0 quando a tentativa é permitida.
  function check(identity) {
    let wait = 0;
    for (const { key, max } of keys(identity)) {
      const entry = current(key);
      if (entry && entry.count >= max) wait = Math.max(wait, Math.ceil((entry.resetAt - now()) / 1000));
    }
    return wait;
  }

  function fail(identity) {
    for (const { key } of keys(identity)) {
      const entry = current(key);
      if (entry) entry.count += 1;
      else failures.set(key, { count: 1, resetAt: now() + windowMs });
    }
  }

  function reset(identity) {
    failures.delete(keys(identity)[1].key);
  }

  // Remove entradas vencidas para o mapa não crescer indefinidamente.
  const sweeper = setInterval(() => {
    for (const key of failures.keys()) current(key);
  }, windowMs);
  sweeper.unref();

  return { check, fail, reset };
}

module.exports = { createLoginLimiter };
