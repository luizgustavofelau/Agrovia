const fs = require('fs/promises');
const path = require('path');

function selectMigrations(files, args) {
  const unknown = args.filter((arg) => arg !== '--dry-run' && !/^--from=\d{3}$/.test(arg));
  const starts = args.filter((arg) => arg.startsWith('--from='));
  if (unknown.length || starts.length > 1) throw new Error('MIGRATION_ARGUMENTS');
  const sorted = files.filter((file) => /^\d+_[a-z0-9_-]+\.sql$/i.test(file)).sort();
  if (!starts.length) return sorted;
  const prefix = starts[0].slice('--from='.length) + '_';
  const index = sorted.findIndex((file) => file.startsWith(prefix));
  if (index < 0) throw new Error('MIGRATION_NOT_FOUND');
  return sorted.slice(index);
}

async function applyMigrations() {
  let pool;
  let connection;
  let activeFile;
  let activeStatement;
  try {
    const migrationDirectory = path.join(__dirname, 'migrations');
    const migrationFiles = selectMigrations(await fs.readdir(migrationDirectory), process.argv.slice(2));

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

    ({ pool } = require('./db'));
    connection = await pool.getConnection();
    for (const migration of migrations) {
      activeFile = migration.file;
      for (const [index, statement] of migration.statements.entries()) {
        activeStatement = index + 1;
        await connection.query(statement);
      }
      console.log(`[MIGRATION] Conferida/aplicada: ${migration.file}`);
    }

    console.log('[MIGRATION] Todas as migrações terminaram. Execute npm run test-db para conferir o schema.');
  } catch (error) {
    console.error('[MIGRATION] Falha ao aplicar migrações:', error.code || 'DB_ERROR');
    if (activeFile) console.error(`[MIGRATION] Arquivo: ${activeFile}, instrução: ${activeStatement}. DDL anterior pode ter sido aplicado; revise antes de repetir.`);
    else console.error('[MIGRATION] Confira DATABASE_URL e argumentos: --dry-run e/ou --from=NNN.');
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    if (pool) await pool.end();
  }
}

if (require.main === module) applyMigrations();
module.exports = { selectMigrations };
