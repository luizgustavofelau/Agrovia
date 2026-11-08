const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const mysql = require('mysql2/promise');

const { resolveDatabaseConfig } = require('./db-config');

const dbConfig = {
  ...resolveDatabaseConfig(process.env),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 50,
  connectTimeout: 10000,
  enableKeepAlive: true,
  // O MySQL da hospedagem encerra conexões paradas após 300 s (wait_timeout). Por padrão o pool
  // guarda as ociosas para sempre e depois entrega uma conexão morta (ECONNRESET): a primeira
  // requisição após um período parado falhava. Fechamos as ociosas antes do servidor, em 60 s.
  maxIdle: 0,
  idleTimeout: 60000,
  // DECIMAL (área, umidade) chega como número; sem isso o mysql2 devolve texto e
  // somas no frontend viram concatenação ("12.50" + "3.00").
  decimalNumbers: true,
  // Datas trafegam em UTC nas duas pontas (a sessão também é fixada em UTC abaixo);
  // sem isso o driver lê DATETIME no fuso do computador e desloca horários em 3 h.
  timezone: 'Z',
};

const pool = mysql.createPool(dbConfig);

// A base institucional usa sql_mode não estrito, que trunca textos longos sem erro.
// O modo estrito vale só para as sessões da API; nenhuma configuração global é alterada.
pool.pool.on('connection', (connection) => {
  connection.query("SET SESSION sql_mode = CONCAT_WS(',', NULLIF(@@SESSION.sql_mode, ''), 'STRICT_TRANS_TABLES'), time_zone = '+00:00'", (error) => {
    if (error) console.warn('[DB] Não foi possível ativar o modo estrito da sessão:', error.code || 'DB_ERROR');
  });
});

// Se mesmo assim uma conexão chegar morta (queda de rede, reinício do servidor), repete a
// consulta uma única vez: o pool descarta a conexão quebrada e abre outra.
const CONEXAO_PERDIDA = new Set(['ECONNRESET', 'EPIPE', 'PROTOCOL_CONNECTION_LOST']);
for (const metodo of ['execute', 'query']) {
  const original = pool[metodo].bind(pool);
  pool[metodo] = async (...args) => {
    try {
      return await original(...args);
    } catch (error) {
      if (!CONEXAO_PERDIDA.has(error?.code)) throw error;
      console.warn(`[DB] Conexão perdida (${error.code}); repetindo a consulta em uma conexão nova.`);
      return original(...args);
    }
  };
}

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  pool,
  query,
};
