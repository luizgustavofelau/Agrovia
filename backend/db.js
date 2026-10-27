const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

const { parseDatabaseUrl } = require('./db-config');

const dbConfig = {
  ...parseDatabaseUrl(process.env.DATABASE_URL),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 50,
  connectTimeout: 10000,
};


const pool = mysql.createPool(dbConfig);

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  pool,
  query,
};
