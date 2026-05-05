const { pool } = require('./db');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Conexão bem-sucedida. Resultado:', rows[0].result);
  } catch (error) {
    console.error('Falha na conexão:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
