const path = require('node:path');
const { hashPassword } = require('./password');

function seedConfig(env) {
  const email = String(env.SEED_TECNICO_EMAIL || '').trim().toLowerCase();
  const nome = String(env.SEED_TECNICO_NOME || 'Técnico Agrovia').trim();
  const senha = String(env.SEED_TECNICO_SENHA || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100
    || !nome || nome.length > 100 || senha.length < 12 || senha.length > 128
    || senha !== senha.trim()) {
    throw new Error('SEED_CONFIG_INVALID');
  }
  return { email, nome, senha };
}

async function seedTecnico(pool, config, apply = false) {
  const connection = await pool.getConnection();
  let transaction = false;
  try {
    if (apply) {
      await connection.beginTransaction();
      transaction = true;
    }
    const [existing] = await connection.execute(
      'SELECT id_usuario, tipo_usuario FROM USUARIO WHERE LOWER(email) = ?' + (apply ? ' FOR UPDATE' : ''),
      [config.email],
    );
    if (existing.length) {
      if (existing.length !== 1 || existing[0].tipo_usuario !== 'TECNICO') throw new Error('SEED_EMAIL_CONFLICT');
      if (transaction) { await connection.commit(); transaction = false; }
      return 'existing';
    }
    if (!apply) return 'pending';
    const hash = await hashPassword(config.senha);
    await connection.execute(
      'INSERT INTO USUARIO (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
      [config.nome, config.email, hash, 'TECNICO'],
    );
    await connection.commit();
    transaction = false;
    return 'created';
  } catch (error) {
    if (transaction) await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

async function main() {
  let pool;
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.some((arg) => !['--apply', '--dry-run'].includes(arg))) {
      throw new Error('SEED_ARGUMENTS');
    }
    require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
    const config = seedConfig(process.env);
    ({ pool } = require('./db'));
    const { inspectSchema } = require('./schema-check');
    if (!(await inspectSchema(pool)).ready) throw new Error('SEED_SCHEMA_INCOMPLETE');
    const status = await seedTecnico(pool, config, args.includes('--apply'));
    const messages = {
      existing: 'Conta TECNICO já existe; senha e dados preservados.',
      pending: 'Diagnóstico: conta TECNICO será criada. Execute com --apply para gravar.',
      created: 'Conta TECNICO criada com hash scrypt. Acesso configurado no .env local.',
    };
    console.log('[SEED]', messages[status]);
  } catch (error) {
    const safe = ['SEED_CONFIG_INVALID', 'SEED_EMAIL_CONFLICT', 'SEED_ARGUMENTS', 'SEED_SCHEMA_INCOMPLETE'];
    console.error('[SEED] Falha:', safe.includes(error.message) ? error.message : error.code || 'SEED_ERROR');
    process.exitCode = 1;
  } finally {
    if (pool) await pool.end();
  }
}

if (require.main === module) main();
module.exports = { seedConfig, seedTecnico };
