const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { verifyPassword } = require("./password");
const { pool } = require("./db");
const { inspectSchema } = require("./schema-check");
const {
  isMailConfigured,
  startReportScheduler
} = require("./report-scheduler");

const app = express();
const production = process.env.NODE_ENV === "production";
if (production) {
  const required = ["DATABASE_URL", "AUTH_TOKEN_SECRET", "FRONTEND_URL"];
  if (required.some((key) => !process.env[key]))
    throw new Error("Configure as variáveis obrigatórias do backend.");
  if (process.env.AUTH_TOKEN_SECRET.length < 32)
    throw new Error("AUTH_TOKEN_SECRET deve ter pelo menos 32 caracteres.");
}
const frontendOrigin = process.env.FRONTEND_URL;
if (frontendOrigin && new URL(frontendOrigin).origin !== frontendOrigin) {
  throw new Error(
    "FRONTEND_URL deve conter somente a origem, sem caminho ou barra final."
  );
}
const allowedOrigins = new Set(
  [frontendOrigin, ...(!production ? ["http://localhost:3000"] : [])].filter(
    Boolean
  )
);
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
    exposedHeaders: ["X-Data-Source"]
  })
);
app.use(express.json());

const FALLBACK_USUARIOS = [];

const FALLBACK_FAZENDAS = [
  {
    id: 1,
    id_usuario: 1,
    nome: "Fazenda Vale Verde",
    localizacao: "São José do Rio Preto - SP",
    cultura: "Soja"
  },
  {
    id: 2,
    id_usuario: 1,
    nome: "Lote Estrela",
    localizacao: "Bauru - SP",
    cultura: "Milho"
  }
];

const FALLBACK_CULTURAS = [
  {
    id: 1,
    nome: "Soja",
    descricao: "Cultura de alta produtividade para clima temperado.",
    umidadeMin: 40,
    umidadeMax: 65
  },
  {
    id: 2,
    nome: "Milho",
    descricao: "Ajuste ideal para irrigação em estágios de desenvolvimento.",
    umidadeMin: 35,
    umidadeMax: 60
  },
  {
    id: 3,
    nome: "Café",
    descricao:
      "Requer monitoramento mais frequente em regiões de maior elevação.",
    umidadeMin: 45,
    umidadeMax: 70
  }
];

const FALLBACK_DISPOSITIVOS = [
  {
    id: 1,
    id_usuario: 1,
    nome: "ESP32-01",
    mac: "A0:B7:65:12:33:AA",
    online: true,
    id_fazenda: 1,
    id_campo: 1,
    fazenda: "Fazenda Vale Verde"
  },
  {
    id: 2,
    id_usuario: 1,
    nome: "ESP32-02",
    mac: "A0:B7:65:12:33:BB",
    online: false,
    id_fazenda: 2,
    id_campo: 2,
    fazenda: "Lote Estrela"
  }
];

const SESSION_SECRET =
  process.env.AUTH_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.AUTH_TOKEN_SECRET) {
  console.warn(
    "[AUTH] AUTH_TOKEN_SECRET não definido; sessões serão invalidadas quando o servidor reiniciar."
  );
}

const criarTokenSessao = (idUsuario) => {
  const payload = Buffer.from(
    JSON.stringify({
      sub: Number(idUsuario),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
    })
  ).toString("base64url");
  const assinatura = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${assinatura}`;
};

const verificarTokenSessao = (req, res, next) => {
  const token = String(req.headers.authorization || "").replace(
    /^Bearer\s+/i,
    ""
  );
  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura)
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada." });

  const assinaturaEsperada = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest();
  let assinaturaRecebida;
  let conteudo;
  try {
    assinaturaRecebida = Buffer.from(assinatura, "base64url");
    conteudo = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (_error) {
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada." });
  }
  if (
    assinaturaRecebida.length !== assinaturaEsperada.length ||
    !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada) ||
    !Number.isInteger(conteudo.sub) ||
    conteudo.sub < 1 ||
    !Number.isInteger(conteudo.exp) ||
    conteudo.exp <= Date.now() / 1000
  ) {
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada." });
  }

  req.usuarioAutenticado = conteudo.sub;
  return next();
};

app.get("/health", (_req, res) => res.json({ status: "ok" }));
// Todas as operações de conta exigem sessão, inclusive leituras e cadastros.
app.use("/api", (req, res, next) => {
  // Express aceita barra final e caminhos sem distinção de maiúsculas.
  if (/^\/(login|health)\/?$/i.test(req.path)) return next();
  return verificarTokenSessao(req, res, next);
});
app.use("/api", (req, res, next) => {
  const requestedId = req.query.id_usuario ?? req.body?.id_usuario;
  const profile = req.path.match(/^\/usuario\/([^/]+)\/?$/i);
  if (
    (requestedId !== undefined &&
      Number(requestedId) !== req.usuarioAutenticado) ||
    (profile && Number(profile[1]) !== req.usuarioAutenticado)
  ) {
    return res.status(403).json({ mensagem: "Acesso não autorizado." });
  }
  next();
});

app.get("/api/relatorios/automacao", verificarTokenSessao, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.email, r.ativo, r.frequencia,
        r.proximo_envio, r.ultimo_envio
      FROM USUARIO u
      LEFT JOIN RELATORIO_AUTOMATICO r ON r.id_usuario_fk = u.id_usuario
      WHERE u.id_usuario = ?`,
      [req.usuarioAutenticado]
    );
    if (!rows.length)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    const settings = rows[0];
    return res.json({
      email: settings.email,
      ativo: Boolean(settings.ativo),
      frequencia: settings.frequencia || "semanal",
      proximoEnvio: settings.proximo_envio,
      ultimoEnvio: settings.ultimo_envio,
      smtpConfigurado: isMailConfigured()
    });
  } catch (error) {
    console.error(
      "[RELATORIOS] Falha ao carregar automação:",
      error.code || "DB_ERROR"
    );
    return res
      .status(503)
      .json({
        mensagem:
          "Automação indisponível. Verifique se a migração do banco foi aplicada."
      });
  }
});

app.put("/api/relatorios/automacao", verificarTokenSessao, async (req, res) => {
  const { ativo, frequencia } = req.body;
  if (
    typeof ativo !== "boolean" ||
    !["diario", "semanal"].includes(frequencia)
  ) {
    return res
      .status(400)
      .json({
        mensagem:
          "Informe se os envios estão ativos e escolha uma frequência válida."
      });
  }
  if (ativo && !isMailConfigured()) {
    return res
      .status(503)
      .json({
        mensagem: "O envio por e-mail ainda não está configurado no servidor."
      });
  }

  try {
    await pool.execute(
      `INSERT INTO RELATORIO_AUTOMATICO
        (id_usuario_fk, ativo, frequencia, proximo_envio)
      VALUES (?, ?, ?, IF(? = 1, DATE_ADD(NOW(), INTERVAL CASE WHEN ? = 'diario' THEN 1 ELSE 7 END DAY), NULL))
      ON DUPLICATE KEY UPDATE
        ativo = VALUES(ativo),
        frequencia = VALUES(frequencia),
        proximo_envio = IF(VALUES(ativo) = 1,
          DATE_ADD(NOW(), INTERVAL CASE WHEN VALUES(frequencia) = 'diario' THEN 1 ELSE 7 END DAY), NULL)`,
      [
        req.usuarioAutenticado,
        ativo ? 1 : 0,
        frequencia,
        ativo ? 1 : 0,
        frequencia
      ]
    );
    const [rows] = await pool.execute(
      `SELECT email FROM USUARIO WHERE id_usuario = ?`,
      [req.usuarioAutenticado]
    );
    if (!rows.length)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    return res.json({
      ativo,
      frequencia,
      email: rows[0].email,
      smtpConfigurado: isMailConfigured(),
      mensagem: ativo
        ? "Envio automático ativado."
        : "Envio automático desativado."
    });
  } catch (error) {
    console.error(
      "[RELATORIOS] Falha ao salvar automação:",
      error.code || "DB_ERROR"
    );
    return res
      .status(503)
      .json({
        mensagem:
          "Não foi possível salvar a automação. Verifique se a migração do banco foi aplicada."
      });
  }
});

const verificarBancoDisponivel = async () => {
  try {
    await pool.query("SELECT 1 AS ok");
    return true;
  } catch (error) {
    console.warn("[DB] Banco indisponível:", error.code || "DB_ERROR");
    const unavailable = new Error("Banco indisponível");
    unavailable.status = 503;
    throw unavailable;
  }
};

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1 AS ok");
  } catch (error) {
    console.warn("[DB] Health indisponível:", error.code || "DB_ERROR");
    return res
      .status(503)
      .json({ api: "ok", database: "unavailable", schema: "unknown" });
  }

  try {
    const schema = await inspectSchema(pool);
    if (!schema.ready) {
      return res
        .status(503)
        .json({ api: "ok", database: "connected", schema: "incomplete" });
    }
    return res.json({ api: "ok", database: "connected", schema: "ready" });
  } catch (_error) {
    return res
      .status(503)
      .json({ api: "ok", database: "connected", schema: "unknown" });
  }
});

const normalizarEmail = (valor = "") => String(valor).trim().toLowerCase();

const localizarUsuarioFallback = (email, senha) => {
  const emailNormalizado = normalizarEmail(email);
  const senhaNormalizada = String(senha || "").trim();

  return FALLBACK_USUARIOS.find(
    (usuario) =>
      normalizarEmail(usuario.email) === emailNormalizado &&
      String(usuario.senha).trim() === senhaNormalizada
  );
};

const contaError = (res, error) => {
  console.error("[CONTA]", error.code || "DB_ERROR");
  if (error.code === "ER_DUP_ENTRY")
    return res
      .status(409)
      .json({ mensagem: "O registro informado já existe." });
  if (error.code === "ER_NO_REFERENCED_ROW_2")
    return res
      .status(400)
      .json({ mensagem: "A fazenda ou o campo informado não existe." });
  return res
    .status(500)
    .json({ mensagem: "Erro interno ao acessar os dados da conta." });
};

app.get("/api/usuario/:id", async (req, res) => {
  if (!(await verificarBancoDisponivel())) {
    res.setHeader("X-Data-Source", "demo");
    const usuario = FALLBACK_USUARIOS.find(
      (item) => String(item.id_usuario) === String(req.params.id)
    );
    if (!usuario)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    return res.json({
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      tipo_usuario: usuario.tipo_usuario
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?",
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    return res.json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

app.put("/api/usuario/:id", async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !email)
    return res
      .status(400)
      .json({ mensagem: "Nome e e-mail são obrigatórios." });

  if (!(await verificarBancoDisponivel())) {
    res.setHeader("X-Data-Source", "demo");
    const usuarioAtual = FALLBACK_USUARIOS.find(
      (item) => String(item.id_usuario) === String(req.params.id)
    );
    if (!usuarioAtual)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    const usuarioAtualizado = {
      id_usuario: usuarioAtual.id_usuario,
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone || usuarioAtual.telefone,
      tipo_usuario: usuarioAtual.tipo_usuario
    };
    FALLBACK_USUARIOS[0] = { ...FALLBACK_USUARIOS[0], ...usuarioAtualizado };
    return res.json(usuarioAtualizado);
  }

  try {
    const [result] = await pool.execute(
      "UPDATE USUARIO SET nome = ?, telefone = ?, email = ? WHERE id_usuario = ?",
      [nome.trim(), telefone || null, email.trim(), req.params.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    const [rows] = await pool.execute(
      "SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?",
      [req.params.id]
    );
    return res.json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

app.get("/api/fazendas", async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario)
    return res.status(400).json({ mensagem: "id_usuario é obrigatório." });

  if (!(await verificarBancoDisponivel())) {
    res.setHeader("X-Data-Source", "demo");
    return res.json(
      FALLBACK_FAZENDAS.filter(
        (fazenda) => String(fazenda.id_usuario) === String(id_usuario)
      ).map(({ id_usuario: _idUsuario, ...fazenda }) => fazenda)
    );
  }

  try {
    const [rows] = await pool.execute(
      `SELECT f.id_fazenda AS id, f.nome_fazenda AS nome, f.localizacao,
      f.area_ha AS areaHa, f.qtd_talhoes AS talhoes, f.observacoes,
      f.id_cultura_fk, c.nome_cultura AS cultura
      FROM FAZENDAS f LEFT JOIN CULTURAS c ON c.id_cultura = f.id_cultura_fk
      WHERE f.id_usuario_fk = ? AND f.deleted_at IS NULL ORDER BY f.nome_fazenda`,
      [id_usuario]
    );
    return res.json(rows);
  } catch (error) {
    return contaError(res, error);
  }
});

app.post("/api/fazendas", async (req, res) => {
  const {
    nome_fazenda,
    localizacao,
    id_usuario,
    id_cultura,
    cultura,
    area_ha,
    qtd_talhoes,
    observacoes
  } = req.body;
  if (!nome_fazenda || !id_usuario)
    return res
      .status(400)
      .json({ mensagem: "nome_fazenda e id_usuario são obrigatórios." });

  const area =
    area_ha === undefined || area_ha === null || area_ha === ""
      ? null
      : Number(area_ha);
  const talhoes =
    qtd_talhoes === undefined || qtd_talhoes === null || qtd_talhoes === ""
      ? null
      : Number(qtd_talhoes);
  const notas =
    observacoes == null || observacoes === ""
      ? null
      : String(observacoes).trim();
  if (area !== null && (!Number.isFinite(area) || area <= 0))
    return res
      .status(400)
      .json({ mensagem: "A área deve ser um número maior que zero." });
  if (talhoes !== null && (!Number.isInteger(talhoes) || talhoes < 1))
    return res
      .status(400)
      .json({
        mensagem: "A quantidade de talhões deve ser um inteiro maior que zero."
      });
  if (notas && notas.length > 300)
    return res
      .status(400)
      .json({ mensagem: "As observações devem ter no máximo 300 caracteres." });

  if (!(await verificarBancoDisponivel())) {
    const culturaFallback = id_cultura
      ? FALLBACK_CULTURAS.find((item) => String(item.id) === String(id_cultura))
          ?.nome || `Cultura ${id_cultura}`
      : FALLBACK_CULTURAS.find(
          (item) =>
            item.nome.toLowerCase() ===
            String(cultura || "")
              .trim()
              .toLowerCase()
        )?.nome ||
        cultura ||
        "Sem cultura definida";
    const novaFazenda = {
      id:
        FALLBACK_FAZENDAS.reduce(
          (maiorId, fazenda) => Math.max(maiorId, Number(fazenda.id) || 0),
          0
        ) + 1,
      id_usuario: Number(id_usuario),
      nome: nome_fazenda.trim(),
      localizacao: localizacao || "Localização não informada",
      cultura: culturaFallback,
      areaHa: area,
      talhoes,
      observacoes: notas
    };
    FALLBACK_FAZENDAS.push(novaFazenda);
    res.setHeader("X-Data-Source", "demo");
    const { id_usuario: _idUsuario, ...fazendaPublica } = novaFazenda;
    return res.status(201).json(fazendaPublica);
  }

  try {
    let culturaId = id_cultura || null;
    if (!culturaId && cultura) {
      const [culturas] = await pool.execute(
        "SELECT id_cultura FROM CULTURAS WHERE LOWER(nome_cultura) = ?",
        [String(cultura).trim().toLowerCase()]
      );
      if (!culturas.length)
        return res
          .status(400)
          .json({ mensagem: "A cultura informada não está cadastrada." });
      culturaId = culturas[0].id_cultura;
    }
    const [result] = await pool.execute(
      `INSERT INTO FAZENDAS
      (nome_fazenda, localizacao, id_usuario_fk, id_cultura_fk, area_ha, qtd_talhoes, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome_fazenda.trim(),
        localizacao || null,
        id_usuario,
        culturaId,
        area,
        talhoes,
        notas
      ]
    );
    const [rows] = await pool.execute(
      `SELECT f.id_fazenda AS id, f.nome_fazenda AS nome, f.localizacao,
      f.area_ha AS areaHa, f.qtd_talhoes AS talhoes, f.observacoes,
      f.id_cultura_fk, c.nome_cultura AS cultura
      FROM FAZENDAS f LEFT JOIN CULTURAS c ON c.id_cultura = f.id_cultura_fk
      WHERE f.id_fazenda = ?`,
      [result.insertId]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

app.delete("/api/fazendas/:id", verificarTokenSessao, async (req, res) => {
  const idFazenda = String(req.params.id);
  if (!/^\d+$/.test(idFazenda) || Number(idFazenda) < 1) {
    return res
      .status(400)
      .json({ mensagem: "Identificador de fazenda inválido." });
  }

  if (!(await verificarBancoDisponivel())) {
    const index = FALLBACK_FAZENDAS.findIndex(
      (fazenda) =>
        String(fazenda.id) === idFazenda &&
        fazenda.id_usuario === req.usuarioAutenticado
    );
    if (index < 0)
      return res.status(404).json({ mensagem: "Propriedade não encontrada." });
    FALLBACK_FAZENDAS.splice(index, 1);
    for (
      let dispositivo = FALLBACK_DISPOSITIVOS.length - 1;
      dispositivo >= 0;
      dispositivo -= 1
    ) {
      if (String(FALLBACK_DISPOSITIVOS[dispositivo].id_fazenda) === idFazenda)
        FALLBACK_DISPOSITIVOS.splice(dispositivo, 1);
    }
    res.setHeader("X-Data-Source", "demo");
    return res.status(204).end();
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [fazendas] = await connection.execute(
      "SELECT id_fazenda FROM FAZENDAS WHERE id_fazenda = ? AND id_usuario_fk = ? AND deleted_at IS NULL FOR UPDATE",
      [idFazenda, req.usuarioAutenticado]
    );
    if (!fazendas.length) {
      await connection.rollback();
      return res.status(404).json({ mensagem: "Propriedade não encontrada." });
    }

    await connection.execute(
      "UPDATE FAZENDAS SET deleted_at = CURRENT_TIMESTAMP WHERE id_fazenda = ? AND id_usuario_fk = ? AND deleted_at IS NULL",
      [idFazenda, req.usuarioAutenticado]
    );
    await connection.commit();
    return res.status(204).end();
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return contaError(res, error);
  } finally {
    if (connection) connection.release();
  }
});

app.get("/api/culturas", async (_req, res) => {
  if (!(await verificarBancoDisponivel())) {
    res.setHeader("X-Data-Source", "demo");
    return res.json(FALLBACK_CULTURAS);
  }

  try {
    const [rows] =
      await pool.execute(`SELECT id_cultura AS id, nome_cultura AS nome, descricao_tecnica AS descricao,
      umidade_ideal_min AS umidadeMin, umidade_ideal_max AS umidadeMax FROM CULTURAS ORDER BY nome_cultura`);
    return res.json(rows);
  } catch (error) {
    return contaError(res, error);
  }
});

app.post("/api/culturas", async (req, res) => {
  const { nome_cultura, descricao_tecnica, umidade_minima, umidade_maxima } =
    req.body;
  if (
    !nome_cultura ||
    umidade_minima === undefined ||
    umidade_maxima === undefined
  )
    return res
      .status(400)
      .json({ mensagem: "Nome e limiares de umidade são obrigatórios." });
  if (Number(umidade_minima) > Number(umidade_maxima))
    return res
      .status(400)
      .json({ mensagem: "A umidade mínima não pode ser maior que a máxima." });

  if (!(await verificarBancoDisponivel())) {
    res.setHeader("X-Data-Source", "demo");
    const novaCultura = {
      id: FALLBACK_CULTURAS.length + 1,
      nome: nome_cultura.trim(),
      descricao:
        descricao_tecnica || "Cultura cadastrada em modo de demonstração.",
      umidadeMin: Number(umidade_minima),
      umidadeMax: Number(umidade_maxima)
    };
    FALLBACK_CULTURAS.push(novaCultura);
    return res.status(201).json(novaCultura);
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO CULTURAS (nome_cultura, descricao_tecnica, umidade_ideal_min, umidade_ideal_max) VALUES (?, ?, ?, ?)",
      [
        nome_cultura.trim(),
        descricao_tecnica || null,
        umidade_minima,
        umidade_maxima
      ]
    );
    const [rows] = await pool.execute(
      "SELECT id_cultura AS id, nome_cultura AS nome, descricao_tecnica AS descricao, umidade_ideal_min AS umidadeMin, umidade_ideal_max AS umidadeMax FROM CULTURAS WHERE id_cultura = ?",
      [result.insertId]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

app.get("/api/dispositivos", async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario)
    return res.status(400).json({ mensagem: "id_usuario é obrigatório." });

  if (!(await verificarBancoDisponivel())) {
    res.setHeader("X-Data-Source", "demo");
    return res.json(
      FALLBACK_DISPOSITIVOS.filter(
        (item) =>
          String(item.id_usuario) === String(id_usuario) && !item.deleted_at
      ).map(({ id_usuario: _idUsuario, ...item }) => ({
        ...item,
        talhaoVinculado: item.fazenda,
        status: item.online ? "ON" : "OFF"
      }))
    );
  }

  try {
    const [rows] = await pool.execute(
      `SELECT d.id_dispositivo AS id, d.nome_dispositivo AS nome, d.mac_address AS mac,
      d.status_conexao AS status, d.id_fazenda_fk AS id_fazenda, d.id_campo, f.nome_fazenda AS fazenda
      FROM DISPOSITIVOS d INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
      WHERE f.id_usuario_fk = ? AND f.deleted_at IS NULL AND d.deleted_at IS NULL ORDER BY d.nome_dispositivo`,
      [id_usuario]
    );
    return res.json(
      rows.map((row) => ({
        ...row,
        online: row.status === "ON",
        talhaoVinculado: row.fazenda
      }))
    );
  } catch (error) {
    return contaError(res, error);
  }
});

app.post("/api/dispositivos", async (req, res) => {
  const { nome_dispositivo, mac_address, id_fazenda, id_campo } = req.body;
  if (
    !nome_dispositivo ||
    !mac_address ||
    !id_fazenda ||
    id_campo === undefined ||
    id_campo === ""
  )
    return res
      .status(400)
      .json({ mensagem: "Nome, MAC, fazenda e campo são obrigatórios." });

  if (!(await verificarBancoDisponivel())) {
    const fazenda = FALLBACK_FAZENDAS.find(
      (item) => String(item.id) === String(id_fazenda)
    );
    if (!fazenda)
      return res
        .status(404)
        .json({ mensagem: "Fazenda informada não encontrada." });
    res.setHeader("X-Data-Source", "demo");
    const novoDispositivo = {
      id:
        FALLBACK_DISPOSITIVOS.reduce(
          (maiorId, item) => Math.max(maiorId, Number(item.id) || 0),
          0
        ) + 1,
      id_usuario: fazenda.id_usuario,
      nome: nome_dispositivo.trim(),
      mac: mac_address.trim().toUpperCase(),
      online: false,
      id_fazenda: Number(id_fazenda),
      id_campo: Number(id_campo),
      fazenda: "Fazenda de demonstração",
      talhaoVinculado: "Fazenda de demonstração"
    };
    FALLBACK_DISPOSITIVOS.push(novoDispositivo);
    const { id_usuario: _idUsuario, ...dispositivoPublico } = novoDispositivo;
    return res.status(201).json(dispositivoPublico);
  }

  try {
    const [owned] = await pool.execute(
      "SELECT id_fazenda FROM FAZENDAS WHERE id_fazenda = ? AND id_usuario_fk = ? AND deleted_at IS NULL",
      [id_fazenda, req.usuarioAutenticado]
    );
    if (!owned.length)
      return res.status(403).json({ mensagem: "Fazenda não autorizada." });
    const [result] = await pool.execute(
      "INSERT INTO DISPOSITIVOS (nome_dispositivo, mac_address, status_conexao, id_fazenda_fk, id_campo) VALUES (?, ?, 'OFF', ?, ?)",
      [
        nome_dispositivo.trim(),
        mac_address.trim().toUpperCase(),
        id_fazenda,
        id_campo
      ]
    );
    const [rows] = await pool.execute(
      "SELECT id_dispositivo AS id, nome_dispositivo AS nome, mac_address AS mac, status_conexao AS status, id_fazenda_fk AS id_fazenda, id_campo FROM DISPOSITIVOS WHERE id_dispositivo = ?",
      [result.insertId]
    );
    return res.status(201).json({ ...rows[0], online: false });
  } catch (error) {
    return contaError(res, error);
  }
});

app.delete("/api/dispositivos/:id", verificarTokenSessao, async (req, res) => {
  const idDispositivo = String(req.params.id);
  if (!/^\d+$/.test(idDispositivo) || Number(idDispositivo) < 1) {
    return res
      .status(400)
      .json({ mensagem: "Identificador de dispositivo inválido." });
  }

  if (!(await verificarBancoDisponivel())) {
    const dispositivo = FALLBACK_DISPOSITIVOS.find(
      (item) =>
        String(item.id) === idDispositivo &&
        item.id_usuario === req.usuarioAutenticado &&
        !item.deleted_at
    );
    if (!dispositivo)
      return res.status(404).json({ mensagem: "Dispositivo não encontrado." });
    dispositivo.deleted_at = new Date().toISOString();
    dispositivo.online = false;
    res.setHeader("X-Data-Source", "demo");
    return res.status(204).end();
  }

  try {
    const [result] = await pool.execute(
      `UPDATE DISPOSITIVOS d
      INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
      SET d.deleted_at = CURRENT_TIMESTAMP, d.status_conexao = 'OFF'
      WHERE d.id_dispositivo = ? AND d.deleted_at IS NULL
        AND f.id_usuario_fk = ? AND f.deleted_at IS NULL`,
      [idDispositivo, req.usuarioAutenticado]
    );
    if (!result.affectedRows)
      return res.status(404).json({ mensagem: "Dispositivo não encontrado." });
    return res.status(204).end();
  } catch (error) {
    return contaError(res, error);
  }
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  const emailNormalizado = normalizarEmail(email);
  const senhaNormalizada = String(senha || "").trim();

  if (!emailNormalizado || !senhaNormalizada) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "E-mail e senha são obrigatórios." });
  }

  const bancoDisponivel = await verificarBancoDisponivel();
  const usuarioFallback = localizarUsuarioFallback(
    emailNormalizado,
    senhaNormalizada
  );
  if (!bancoDisponivel) {
    if (usuarioFallback) {
      return res.json({
        sucesso: true,
        accessToken: criarTokenSessao(usuarioFallback.id_usuario),
        usuario: {
          id: usuarioFallback.id_usuario,
          nome: usuarioFallback.nome,
          email: usuarioFallback.email,
          telefone: usuarioFallback.telefone,
          tipo: usuarioFallback.tipo_usuario
        }
      });
    }
    return res
      .status(401)
      .json({ sucesso: false, mensagem: "E-mail ou senha inválidos." });
  }

  try {
    const sql = "SELECT * FROM USUARIO WHERE LOWER(email) = ?";
    const [results] = await pool.execute(sql, [emailNormalizado]);

    if (results.length === 0) {
      return res
        .status(401)
        .json({ sucesso: false, mensagem: "E-mail não cadastrado." });
    }

    const usuarioNoBanco = results[0];
    const senhaBanco = usuarioNoBanco.senha
      ? usuarioNoBanco.senha.toString().trim()
      : "";

    if (await verifyPassword(senhaNormalizada, senhaBanco, !production)) {
      return res.json({
        sucesso: true,
        accessToken: criarTokenSessao(usuarioNoBanco.id_usuario),
        usuario: {
          id: usuarioNoBanco.id_usuario,
          nome: usuarioNoBanco.nome,
          email: usuarioNoBanco.email,
          telefone: usuarioNoBanco.telefone,
          tipo: usuarioNoBanco.tipo_usuario
        }
      });
    }

    return res
      .status(401)
      .json({ sucesso: false, mensagem: "Senha inválida." });
  } catch (err) {
    console.error("[LOGIN]", err.code || "DB_ERROR");
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

app.use((error, _req, res, _next) => {
  console.error("[API]", error.code || error.status || "INTERNAL_ERROR");
  const status = error.status === 503 ? 503 : error.status === 400 ? 400 : 500;
  res
    .status(status)
    .json({
      mensagem:
        status === 503
          ? "Banco de dados indisponível."
          : status === 400
            ? "Requisição inválida."
            : "Erro interno no servidor."
    });
});

const port = Number(process.env.PORT) || 5000;
let stopScheduler;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor Agrovia iniciado na porta ${port}`);
  stopScheduler = startReportScheduler();
});
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  const timeout = setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => {
    try {
      if (stopScheduler) await stopScheduler();
      await pool.end();
      clearTimeout(timeout);
    } catch (_error) {
      process.exitCode = 1;
    }
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
