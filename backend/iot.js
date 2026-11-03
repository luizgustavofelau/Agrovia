// Integração com o ESP32: leituras de umidade, chave do dispositivo e comandos de irrigação.
//
// Dois tipos de acesso convivem aqui:
// - Rotas /api/iot/* são chamadas pelo aparelho e autenticadas pela chave do dispositivo
//   (cabeçalho X-Device-Key). A chave é gerada pelo dono no painel e só o hash SHA-256 fica no banco.
// - Rotas /api/dispositivos/:id/* são chamadas pelo painel com a sessão do usuário e
//   sempre conferem se o dispositivo pertence a quem está logado.
const crypto = require("crypto");

const CHAVE_PREFIXO = "agv_";
// Sem nova leitura neste intervalo, o dispositivo aparece como desconectado.
const ONLINE_JANELA_SEGUNDOS = 180;
// Comando não buscado pelo aparelho nesse prazo expira: nunca irrigar com ordem velha.
const COMANDO_VALIDADE_SEGUNDOS = 120;
const DURACAO_MINIMA = 5;
const DURACAO_MAXIMA = 3600;
const LEITURAS_POR_ENVIO = 50;
const INTERVALO_MINIMO_MS = 5000;

const hashChave = (chave) => crypto.createHash("sha256").update(String(chave)).digest("hex");
const gerarChave = () => CHAVE_PREFIXO + crypto.randomBytes(32).toString("base64url");
const idValido = (valor) => /^\d+$/.test(String(valor)) && Number(valor) >= 1 && Number(valor) <= 2147483647;

function createIotRoutes({ pool, bancoIndisponivel }) {
  const ultimaLeituraPorDispositivo = new Map();

  const erroIot = (res, error, contexto) => {
    console.error(`[IOT] ${contexto}:`, error.code || "DB_ERROR");
    if (bancoIndisponivel(error))
      return res.status(503).json({ mensagem: "Banco de dados indisponível." });
    if (error.code === "ER_NO_SUCH_TABLE" || error.code === "ER_BAD_FIELD_ERROR")
      return res.status(503).json({ mensagem: "Integração IoT ainda não habilitada no banco (migração 006)." });
    return res.status(500).json({ mensagem: "Erro interno na integração do dispositivo." });
  };

  // Autenticação do aparelho pela chave secreta.
  async function autenticarDispositivo(req, res, next) {
    const chave = String(req.get("x-device-key") || "").trim();
    if (!chave.startsWith(CHAVE_PREFIXO) || chave.length < 40 || chave.length > 120)
      return res.status(401).json({ mensagem: "Chave do dispositivo ausente ou inválida." });
    try {
      const [rows] = await pool.execute(
        `SELECT d.id_dispositivo, d.nome_dispositivo, f.id_usuario_fk
        FROM DISPOSITIVOS d INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
        WHERE d.chave_hash = ? AND d.deleted_at IS NULL AND f.deleted_at IS NULL LIMIT 1`,
        [hashChave(chave)]
      );
      if (!rows.length)
        return res.status(401).json({ mensagem: "Chave do dispositivo ausente ou inválida." });
      req.dispositivo = rows[0];
      return next();
    } catch (error) {
      return erroIot(res, error, "Autenticação do dispositivo");
    }
  }

  // Busca o dispositivo do usuário logado; responde 404 para dispositivo alheio ou removido.
  async function dispositivoDoUsuario(req, res) {
    if (!idValido(req.params.id)) {
      res.status(400).json({ mensagem: "Identificador de dispositivo inválido." });
      return null;
    }
    const [rows] = await pool.execute(
      `SELECT d.id_dispositivo, d.nome_dispositivo FROM DISPOSITIVOS d
      INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
      WHERE d.id_dispositivo = ? AND f.id_usuario_fk = ? AND d.deleted_at IS NULL AND f.deleted_at IS NULL`,
      [req.params.id, req.usuarioAutenticado]
    );
    if (!rows.length) {
      res.status(404).json({ mensagem: "Dispositivo não encontrado." });
      return null;
    }
    return rows[0];
  }

  // Marca como expirados os comandos que o aparelho não buscou a tempo.
  const expirarComandos = (idDispositivo) =>
    pool.execute(
      `UPDATE COMANDOS_IRRIGACAO SET status = 'EXPIRADO', concluido_em = NOW()
      WHERE id_dispositivo_fk = ? AND status = 'PENDENTE' AND expira_em <= NOW()`,
      [idDispositivo]
    );

  const formatarComando = (row) => ({
    id: row.id_comando,
    acao: row.acao,
    duracaoSegundos: row.duracao_segundos,
    status: row.status,
    mensagem: row.mensagem,
    criadoEm: row.criado_em,
    expiraEm: row.expira_em,
    entregueEm: row.entregue_em,
    concluidoEm: row.concluido_em
  });

  async function entregarComandos(idDispositivo) {
    await expirarComandos(idDispositivo);
    const [comandos] = await pool.execute(
      `SELECT id_comando, acao, duracao_segundos FROM COMANDOS_IRRIGACAO
      WHERE id_dispositivo_fk = ? AND status = 'PENDENTE' AND expira_em > NOW()
      ORDER BY id_comando LIMIT 5`,
      [idDispositivo]
    );
    if (comandos.length) {
      await pool.query(
        "UPDATE COMANDOS_IRRIGACAO SET status = 'ENVIADO', entregue_em = NOW() WHERE id_comando IN (?) AND status = 'PENDENTE'",
        [comandos.map((c) => c.id_comando)]
      );
    }
    return comandos.map((c) => ({ id: c.id_comando, acao: c.acao, duracaoSegundos: c.duracao_segundos }));
  }

  function validarLeituras(body) {
    const lista = Array.isArray(body?.leituras) ? body.leituras : [body];
    if (!lista.length || lista.length > LEITURAS_POR_ENVIO)
      return { erro: `Envie de 1 a ${LEITURAS_POR_ENVIO} leituras por vez.` };
    const agora = Date.now();
    const leituras = [];
    for (const item of lista) {
      const umidade = Number(item?.umidade);
      if (item?.umidade === undefined || item?.umidade === null || !Number.isFinite(umidade) || umidade < 0 || umidade > 100)
        return { erro: "A umidade deve ser um número entre 0 e 100 (%)." };
      // Leituras guardadas offline podem trazer o horário da medição (epoch em segundos).
      let epoch = null;
      if (item.timestamp !== undefined) {
        const ms = Number(item.timestamp) * 1000;
        if (!Number.isFinite(ms) || ms > agora + 5 * 60 * 1000 || ms < agora - 7 * 24 * 60 * 60 * 1000)
          return { erro: "Horário da leitura inválido (aceito até 7 dias no passado)." };
        epoch = Math.floor(ms / 1000);
      }
      leituras.push({ umidade: Math.round(umidade * 100) / 100, epoch, ordem: epoch ?? agora / 1000 });
    }
    return { leituras };
  }

  function registrar(app) {
    // ── Aparelho ──────────────────────────────────────────────────────────
    app.post("/api/iot/leituras", autenticarDispositivo, async (req, res) => {
      const id = req.dispositivo.id_dispositivo;
      const anterior = ultimaLeituraPorDispositivo.get(id) || 0;
      if (Date.now() - anterior < INTERVALO_MINIMO_MS) {
        res.setHeader("Retry-After", "5");
        return res.status(429).json({ mensagem: "Envie leituras com intervalo mínimo de 5 segundos." });
      }
      const { leituras, erro } = validarLeituras(req.body);
      if (erro) return res.status(400).json({ mensagem: erro });
      ultimaLeituraPorDispositivo.set(id, Date.now());

      try {
        // Sem horário informado, vale o relógio do banco (NOW()); com horário, FROM_UNIXTIME.
        const valores = leituras.map((l) => (l.epoch === null ? "(?, ?, NOW())" : "(?, ?, FROM_UNIXTIME(?))"));
        const params = leituras.flatMap((l) => (l.epoch === null ? [id, l.umidade] : [id, l.umidade, l.epoch]));
        await pool.execute(
          `INSERT INTO HISTORICO_UMIDADE (id_dispositivo_fk, valor_umidade, data_hora) VALUES ${valores.join(", ")}`,
          params
        );
        const maisRecente = leituras.reduce((a, b) => (b.ordem >= a.ordem ? b : a));
        await pool.execute(
          `UPDATE DISPOSITIVOS SET ultima_leitura_umidade = ?, ultima_atualizacao = NOW(), status_conexao = 'ON'
          WHERE id_dispositivo = ?`,
          [maisRecente.umidade, id]
        );
        // A resposta já leva os comandos pendentes: o aparelho faz uma requisição por ciclo.
        const comandos = await entregarComandos(id);
        return res.status(201).json({ recebidas: leituras.length, comandos, intervaloSegundos: 60 });
      } catch (error) {
        return erroIot(res, error, "Registro de leitura");
      }
    });

    app.get("/api/iot/comandos", autenticarDispositivo, async (req, res) => {
      try {
        await pool.execute(
          "UPDATE DISPOSITIVOS SET ultima_atualizacao = NOW(), status_conexao = 'ON' WHERE id_dispositivo = ?",
          [req.dispositivo.id_dispositivo]
        );
        return res.json({ comandos: await entregarComandos(req.dispositivo.id_dispositivo) });
      } catch (error) {
        return erroIot(res, error, "Entrega de comandos");
      }
    });

    app.post("/api/iot/comandos/:id/confirmacao", autenticarDispositivo, async (req, res) => {
      const status = String(req.body?.status || "").toUpperCase();
      if (!idValido(req.params.id) || !["EXECUTADO", "FALHOU"].includes(status))
        return res.status(400).json({ mensagem: "Informe o comando e o status EXECUTADO ou FALHOU." });
      const mensagem = req.body?.mensagem ? String(req.body.mensagem).trim().slice(0, 255) : null;
      try {
        const [result] = await pool.execute(
          `UPDATE COMANDOS_IRRIGACAO SET status = ?, mensagem = ?, concluido_em = NOW()
          WHERE id_comando = ? AND id_dispositivo_fk = ? AND status IN ('ENVIADO', 'PENDENTE')`,
          [status, mensagem, req.params.id, req.dispositivo.id_dispositivo]
        );
        if (!result.affectedRows)
          return res.status(404).json({ mensagem: "Comando não encontrado ou já finalizado." });
        return res.json({ ok: true });
      } catch (error) {
        return erroIot(res, error, "Confirmação de comando");
      }
    });

    // ── Painel (sessão do usuário) ───────────────────────────────────────
    app.post("/api/dispositivos/:id/chave", async (req, res) => {
      try {
        const dispositivo = await dispositivoDoUsuario(req, res);
        if (!dispositivo) return undefined;
        const chave = gerarChave();
        await pool.execute("UPDATE DISPOSITIVOS SET chave_hash = ? WHERE id_dispositivo = ?", [
          hashChave(chave),
          dispositivo.id_dispositivo
        ]);
        // Exibida uma única vez: o banco guarda apenas o hash. Gerar outra invalida a anterior.
        return res.status(201).json({ chave, idDispositivo: dispositivo.id_dispositivo });
      } catch (error) {
        return erroIot(res, error, "Geração de chave");
      }
    });

    app.get("/api/dispositivos/:id/leituras", async (req, res) => {
      const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 48, 1), 500);
      try {
        const dispositivo = await dispositivoDoUsuario(req, res);
        if (!dispositivo) return undefined;
        const [rows] = await pool.execute(
          `SELECT valor_umidade AS umidade, data_hora AS dataHora FROM HISTORICO_UMIDADE
          WHERE id_dispositivo_fk = ? ORDER BY data_hora DESC LIMIT ${limite}`,
          [dispositivo.id_dispositivo]
        );
        return res.json(rows.reverse());
      } catch (error) {
        return erroIot(res, error, "Consulta de leituras");
      }
    });

    app.get("/api/dispositivos/:id/comandos", async (req, res) => {
      try {
        const dispositivo = await dispositivoDoUsuario(req, res);
        if (!dispositivo) return undefined;
        await expirarComandos(dispositivo.id_dispositivo);
        const [rows] = await pool.execute(
          `SELECT * FROM COMANDOS_IRRIGACAO WHERE id_dispositivo_fk = ? ORDER BY id_comando DESC LIMIT 10`,
          [dispositivo.id_dispositivo]
        );
        return res.json(rows.map(formatarComando));
      } catch (error) {
        return erroIot(res, error, "Consulta de comandos");
      }
    });

    app.post("/api/dispositivos/:id/comandos", async (req, res) => {
      const acao = String(req.body?.acao || "").toUpperCase();
      const duracao = Number(req.body?.duracao_segundos);
      if (!["LIGAR", "DESLIGAR"].includes(acao))
        return res.status(400).json({ mensagem: "Ação inválida. Use LIGAR ou DESLIGAR." });
      if (acao === "LIGAR" && (!Number.isInteger(duracao) || duracao < DURACAO_MINIMA || duracao > DURACAO_MAXIMA))
        return res.status(400).json({
          mensagem: `Informe a duração da irrigação entre ${DURACAO_MINIMA} segundos e ${DURACAO_MAXIMA / 60} minutos.`
        });
      try {
        const dispositivo = await dispositivoDoUsuario(req, res);
        if (!dispositivo) return undefined;
        // Uma nova ordem substitui as pendentes: o aparelho executa só a intenção mais recente.
        await pool.execute(
          `UPDATE COMANDOS_IRRIGACAO SET status = 'CANCELADO', concluido_em = NOW(), mensagem = 'Substituído por novo comando'
          WHERE id_dispositivo_fk = ? AND status = 'PENDENTE'`,
          [dispositivo.id_dispositivo]
        );
        const [result] = await pool.execute(
          `INSERT INTO COMANDOS_IRRIGACAO (id_dispositivo_fk, id_usuario_fk, acao, duracao_segundos, expira_em)
          VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ${COMANDO_VALIDADE_SEGUNDOS} SECOND))`,
          [dispositivo.id_dispositivo, req.usuarioAutenticado, acao, acao === "LIGAR" ? duracao : null]
        );
        const [rows] = await pool.execute("SELECT * FROM COMANDOS_IRRIGACAO WHERE id_comando = ?", [result.insertId]);
        return res.status(201).json(formatarComando(rows[0]));
      } catch (error) {
        return erroIot(res, error, "Criação de comando");
      }
    });
  }

  return { registrar };
}

module.exports = {
  createIotRoutes,
  hashChave,
  ONLINE_JANELA_SEGUNDOS,
  COMANDO_VALIDADE_SEGUNDOS,
  DURACAO_MAXIMA
};
