// Revisão por padrão. --apply exige execução manual após backup e revisão.
const { pool } = require('./db');
const { hashPassword } = require('./password');
async function main() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [users] = await connection.execute('SELECT id_usuario, senha FROM USUARIO FOR UPDATE');
    const pending = users.filter((user) => !String(user.senha || '').startsWith('scrypt$'));
    console.log(`Contas com senha legada: ${pending.length}`);
    if (process.argv.includes('--apply')) {
      for (const user of pending) {
        if (!String(user.senha || '').trim()) throw new Error('EMPTY_PASSWORD');
        const hash = await hashPassword(String(user.senha).trim());
        await connection.execute('UPDATE USUARIO SET senha = ? WHERE id_usuario = ?', [hash, user.id_usuario]);
      }
      await connection.commit();
      console.log('Conversão concluída.');
    } else {
      await connection.rollback();
      console.log('Somente diagnóstico; nenhum dado alterado.');
    }
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('Conversão não concluída:', error.code || 'PASSWORD_ERROR');
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}
main();
