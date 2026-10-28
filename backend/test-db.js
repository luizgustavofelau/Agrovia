const { inspectSchema } = require('./schema-check');

async function testConnection() {
  let pool;
  try {
    ({ pool } = require('./db'));
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Conexão com MySQL bem-sucedida. Resultado:', rows[0].result);
    const schema = await inspectSchema(pool);
    if (!schema.ready) {
      console.error('Schema incompleto. Revise os SQL e a estrutura existente com o responsável antes de qualquer migração.');
      console.error('Colunas ausentes:', schema.missingColumns.join(', '));
      process.exitCode = 1;
    } else {
      console.log('Schema Agrovia pronto para a API.');
    }
  } catch (error) {
    console.error('Falha ao verificar MySQL/schema:', error.code || 'DB_CONFIG_OR_QUERY_ERROR');
    console.error('Confira DATABASE_URL e a conectividade a partir do ambiente da API. Não compartilhe credenciais.');
    process.exitCode = 1;
  } finally {
    if (pool) await pool.end();
  }
}

testConnection();
