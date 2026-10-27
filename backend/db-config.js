function parseDatabaseUrl(value) {
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    const database = decodeURIComponent(url.pathname.slice(1));
    if (url.protocol !== 'mysql:' || !url.hostname || !url.username || !database
      || database.includes('/') || url.search || url.hash) throw new Error();
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  } catch {
    // Nunca propagar a URL ou o erro original: ambos podem conter credenciais.
    throw new Error('DATABASE_URL ausente ou inválida. Use mysql://usuario:senha@host/banco, com caracteres especiais codificados.');
  }
}

module.exports = { parseDatabaseUrl };
