const { pool } = require('./db');
const { inspectSchema } = require('./schema-check');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Conexão com MySQL bem-sucedida. Resultado:', rows[0].result);
    const schema = await inspectSchema(pool);
    if (!schema.ready) {
      console.error('Schema incompleto. Execute npm run db:migrate e tente novamente.');
      console.error('Colunas ausentes:', schema.missingColumns.join(', '));
      process.exitCode = 1;
    } else {
      console.log('Schema Agrovia pronto para a API.');
    }
  } catch (error) {
    console.error('Falha ao verificar MySQL/schema:', error.message || error.code || 'Erro sem mensagem fornecida pelo driver.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();
