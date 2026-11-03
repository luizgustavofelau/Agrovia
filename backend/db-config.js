const INVALID_URL = 'DATABASE_URL ausente ou inválida. Use mysql://usuario:senha@host/banco, com caracteres especiais codificados.';
const INVALID_VARIABLES = 'Configuração do banco incompleta. Defina DATABASE_URL ou DB_HOST, DB_USER, DB_PASS e DB_NAME (DB_PORT opcional).';

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
    throw new Error(INVALID_URL);
  }
}

// Formato usado pela hospedagem (DB_HOST/DB_USER/DB_PASS/DB_NAME/DB_PORT).
// Dispensa codificar caracteres especiais da senha, como "@".
function parseDatabaseVariables(env) {
  const host = String(env.DB_HOST || '').trim();
  const user = String(env.DB_USER || '').trim();
  const database = String(env.DB_NAME || '').trim();
  const password = env.DB_PASS ?? env.DB_PASSWORD;
  const port = env.DB_PORT ? Number(env.DB_PORT) : 3306;
  if (!host || !user || !database || typeof password !== 'string'
    || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error(INVALID_VARIABLES);
  return { host, port, user, password, database };
}

// DATABASE_URL tem prioridade; as variáveis separadas são o formato alternativo.
function resolveDatabaseConfig(env = process.env) {
  if (env.DATABASE_URL) return parseDatabaseUrl(env.DATABASE_URL);
  if (env.DB_HOST || env.DB_USER || env.DB_NAME) return parseDatabaseVariables(env);
  throw new Error(INVALID_VARIABLES);
}

function hasDatabaseConfig(env = process.env) {
  try {
    resolveDatabaseConfig(env);
    return true;
  } catch {
    return false;
  }
}

module.exports = { parseDatabaseUrl, parseDatabaseVariables, resolveDatabaseConfig, hasDatabaseConfig };
