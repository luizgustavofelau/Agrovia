const fs = require('fs/promises');
const path = require('path');
const { pool } = require('./db');

async function applyMigrations() {
  let connection;
  try {
    const migrationDirectory = path.join(__dirname, 'migrations');
    const migrationFiles = (await fs.readdir(migrationDirectory))
      .filter((file) => /^\d+_[a-z0-9_-]+\.sql$/i.test(file))
      .sort((left, right) => left.localeCompare(right, 'en'));

    const migrations = await Promise.all(migrationFiles.map(async (file) => ({
      file,
      statements: (await fs.readFile(path.join(migrationDirectory, file), 'utf8'))
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean),
    })));

    if (process.argv.includes('--dry-run')) {
      for (const migration of migrations) {
        console.log(`[MIGRATION] Dry-run: ${migration.file} (${migration.statements.length} comandos)`);
      }
      return;
    }

    connection = await pool.getConnection();
    for (const migration of migrations) {
      for (const statement of migration.statements) await connection.query(statement);
      console.log(`[MIGRATION] Conferida/aplicada: ${migration.file}`);
    }

    console.log('[MIGRATION] Todas as migrações terminaram. Execute npm run test-db para conferir o schema.');
  } catch (error) {
    console.error('[MIGRATION] Falha ao aplicar migrações:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

applyMigrations();