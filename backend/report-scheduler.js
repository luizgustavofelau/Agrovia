const nodemailer = require('nodemailer');
const { pool } = require('./db');

const isMailConfigured = () => Boolean(
  process.env.SMTP_HOST
  && process.env.SMTP_USER
  && process.env.SMTP_PASS
  && (process.env.SMTP_FROM || process.env.SMTP_USER),
);

const createTransport = () => {
  if (!isMailConfigured()) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const formatDate = (date = new Date()) => date.toLocaleString('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: process.env.TZ || 'America/Sao_Paulo',
});

async function buildReport(userId, nome, email) {
  const [fazendas] = await pool.execute(`SELECT f.nome_fazenda AS nome, f.localizacao,
      c.nome_cultura AS cultura
    FROM FAZENDAS f
    LEFT JOIN CULTURAS c ON c.id_cultura = f.id_cultura_fk
    WHERE f.id_usuario_fk = ? AND f.deleted_at IS NULL
    ORDER BY f.nome_fazenda`, [userId]);
  const [dispositivos] = await pool.execute(`SELECT d.nome_dispositivo AS nome,
      d.status_conexao AS status, f.nome_fazenda AS fazenda
    FROM DISPOSITIVOS d
    INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
    WHERE f.id_usuario_fk = ? AND f.deleted_at IS NULL AND d.deleted_at IS NULL
    ORDER BY f.nome_fazenda, d.nome_dispositivo`, [userId]);

  const conectados = dispositivos.filter((item) => item.status === 'ON').length;
  const desconectados = dispositivos.length - conectados;
  const linhasFazendas = fazendas.length
    ? fazendas.map((fazenda) => `- ${fazenda.nome} | Cultura: ${fazenda.cultura || 'não informada'} | Localização: ${fazenda.localizacao || 'não informada'}`)
    : ['- Nenhuma propriedade cadastrada.'];
  const linhasDispositivos = dispositivos.length
    ? dispositivos.map((item) => `- ${item.nome} | ${item.fazenda} | ${item.status === 'ON' ? 'Conectado' : 'Desconectado'}`)
    : ['- Nenhum dispositivo cadastrado.'];

  return {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Seu relatório automático Agrovia',
    text: [
      `Olá, ${nome}!`,
      '',
      `Resumo da sua operação em ${formatDate()}:`,
      '',
      `Propriedades cadastradas: ${fazendas.length}`,
      ...linhasFazendas,
      '',
      `Dispositivos: ${dispositivos.length} (${conectados} conectados, ${desconectados} desconectados)`,
      ...linhasDispositivos,
      '',
      'Leituras de solo e condições atuais da plantação: indisponíveis. A conta ainda não possui integração de telemetria com histórico de leituras; este relatório não faz diagnóstico nem recomenda manejo.',
      '',
      'Você pode alterar ou desativar a frequência de envio na seção Relatórios da Agrovia.',
    ].join('\n'),
  };
}

async function runDueReports() {
  const transport = createTransport();
  if (!transport) return;

  const [subscriptions] = await pool.execute(`SELECT r.id_usuario_fk, r.frequencia,
      u.nome, u.email
    FROM RELATORIO_AUTOMATICO r
    INNER JOIN USUARIO u ON u.id_usuario = r.id_usuario_fk
    WHERE r.ativo = 1 AND r.proximo_envio <= NOW()
    ORDER BY r.proximo_envio
    LIMIT 25`);

  for (const subscription of subscriptions) {
    const [claim] = await pool.execute(`UPDATE RELATORIO_AUTOMATICO
      SET proximo_envio = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
      WHERE id_usuario_fk = ? AND ativo = 1 AND proximo_envio <= NOW()`, [subscription.id_usuario_fk]);
    if (!claim.affectedRows) continue;

    try {
      const report = await buildReport(subscription.id_usuario_fk, subscription.nome, subscription.email);
      await transport.sendMail(report);
      await pool.execute(`UPDATE RELATORIO_AUTOMATICO
        SET ultimo_envio = NOW(),
            proximo_envio = DATE_ADD(NOW(), INTERVAL ? DAY)
        WHERE id_usuario_fk = ? AND ativo = 1`, [
        subscription.frequencia === 'diario' ? 1 : 7,
        subscription.id_usuario_fk,
      ]);
      console.info(`[RELATORIOS] Envio automático concluído para usuário ${subscription.id_usuario_fk}.`);
    } catch (error) {
      console.error(`[RELATORIOS] Falha no envio do usuário ${subscription.id_usuario_fk}:`, error.message || 'erro desconhecido');
    }
  }
}

function startReportScheduler() {
  if (!isMailConfigured()) {
    console.warn('[RELATORIOS] SMTP não configurado; envios automáticos estão desativados.');
    return;
  }

  const check = () => runDueReports().catch((error) => {
    console.error('[RELATORIOS] Falha ao verificar relatórios agendados:', error.message || 'erro desconhecido');
  });
  check();
  setInterval(check, 60 * 1000).unref();
}

module.exports = { isMailConfigured, startReportScheduler };
