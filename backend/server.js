const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { verifyPassword, hashPassword, canHashWithBcrypt, needsPasswordRehash, validarNovaSenha } = require("./password");
const { hasDatabaseConfig } = require("./db-config");
const { pool } = require("./db");
const { inspectSchema } = require("./schema-check");
const { createLoginLimiter } = require("./login-limiter");
const { createIotRoutes, ONLINE_JANELA_SEGUNDOS } = require("./iot");
const { createPasswordResetRoutes } = require("./senha-reset");
const {
  isMailConfigured,
  startReportScheduler,
  createTransport
} = require("./report-scheduler");

const app = express();
const production = process.env.NODE_ENV === "production";
if (production) {
  const required = ["AUTH_TOKEN_SECRET", "FRONTEND_URL"];
  if (required.some((key) => !process.env[key]) || !hasDatabaseConfig())
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

app.disable("x-powered-by");
// O Render encaminha as requisições por um proxy; o IP real é usado no limite de login.
if (production) app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (production)
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    }
  })
);
app.use(express.json({ limit: "20kb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Limites das colunas da base institucional (sql_mode não estrito trunca sem avisar).
const LIMITES = {
  nomeUsuario: 100,
  email: 100,
  telefone: 20,
  nomeFazenda: 100,
  localizacao: 255,
  observacoes: 300,
  nomeCultura: 50,
  descricaoCultura: 2000,
  nomeDispositivo: 100
};

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
// Este servidor só atende a API; o site é publicado pelo frontend.
app.get("/", (_req, res) =>
  res.json({ servico: "API Agrovia", status: "ok", site: frontendOrigin || null })
);
// Todas as operações de conta exigem sessão, inclusive leituras e cadastros.
app.use("/api", (req, res, next) => {
  // Express aceita barra final e caminhos sem distinção de maiúsculas.
  if (/^\/(login|cadastro|health)\/?$/i.test(req.path)) return next();
  // O ESP32 se autentica pela chave do dispositivo (X-Device-Key), não por sessão.
  if (/^\/iot\//i.test(req.path)) return next();
  // Recuperação de senha: quem esqueceu a senha ainda não tem sessão.
  if (/^\/senha\/(esqueci|validar|redefinir)\/?$/i.test(req.path)) return next();
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

// Falhas de rede/credencial do MySQL indicam indisponibilidade, não erro do cliente.
const DB_UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "EAI_AGAIN",
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_SEQUENCE_TIMEOUT",
  "ER_ACCESS_DENIED_ERROR",
  "ER_DBACCESS_DENIED_ERROR",
  "ER_CON_COUNT_ERROR",
  "ER_TOO_MANY_USER_CONNECTIONS",
  "ER_USER_LIMIT_REACHED",
  "POOL_CLOSED"
]);
const bancoIndisponivel = (error) =>
  DB_UNAVAILABLE_CODES.has(error?.code) || error?.status === 503;
const respostaBancoIndisponivel = (res) =>
  res.status(503).json({ mensagem: "Banco de dados indisponível." });

const texto = (valor) =>
  valor === undefined || valor === null ? "" : String(valor).trim();
const textoOpcional = (valor) => texto(valor) || null;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAC_PATTERN = /^[0-9A-F]{2}([:-]?)(?:[0-9A-F]{2}\1){4}[0-9A-F]{2}$/i;
const normalizarMac = (valor) =>
  texto(valor).replace(/[:-]/g, "").toUpperCase().match(/.{2}/g)?.join(":") || "";
const idPositivo = (valor) => /^\d+$/.test(String(valor)) && Number(valor) >= 1;

app.get("/api/relatorios/automacao", async (req, res) => {
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
    if (bancoIndisponivel(error)) return respostaBancoIndisponivel(res);
    return res
      .status(503)
      .json({
        mensagem:
          "Automação indisponível. Verifique se a migração do banco foi aplicada."
      });
  }
});

app.put("/api/relatorios/automacao", async (req, res) => {
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
    // O intervalo é calculado aqui: comparar o parâmetro com um texto dentro do SQL
    // gera ER_CANT_AGGREGATE_2COLLATIONS no MariaDB da instituição.
    await pool.execute(
      `INSERT INTO RELATORIO_AUTOMATICO
        (id_usuario_fk, ativo, frequencia, proximo_envio)
      VALUES (?, ?, ?, IF(? = 1, DATE_ADD(NOW(), INTERVAL ? DAY), NULL))
      ON DUPLICATE KEY UPDATE
        ativo = VALUES(ativo),
        frequencia = VALUES(frequencia),
        proximo_envio = VALUES(proximo_envio)`,
      [
        req.usuarioAutenticado,
        ativo ? 1 : 0,
        frequencia,
        ativo ? 1 : 0,
        frequencia === "diario" ? 1 : 7
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
    if (bancoIndisponivel(error)) return respostaBancoIndisponivel(res);
    return res
      .status(503)
      .json({
        mensagem:
          "Não foi possível salvar a automação. Verifique se a migração do banco foi aplicada."
      });
  }
});

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

const contaError = (res, error) => {
  console.error("[CONTA]", error.code || "DB_ERROR");
  if (bancoIndisponivel(error)) return respostaBancoIndisponivel(res);
  if (error.code === "ER_DUP_ENTRY")
    return res
      .status(409)
      .json({ mensagem: "O registro informado já existe." });
  if (error.code === "ER_NO_REFERENCED_ROW_2")
    return res
      .status(400)
      .json({ mensagem: "A fazenda ou o campo informado não existe." });
  if (error.code === "ER_DATA_TOO_LONG")
    return res
      .status(400)
      .json({ mensagem: "Um dos campos excede o tamanho permitido." });
  return res
    .status(500)
    .json({ mensagem: "Erro interno ao acessar os dados da conta." });
};

app.get("/api/usuario/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?",
      [req.usuarioAutenticado]
    );
    if (!rows.length)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    return res.json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

app.put("/api/usuario/:id", async (req, res) => {
  const nome = texto(req.body.nome);
  const email = normalizarEmail(req.body.email);
  const telefone = textoOpcional(req.body.telefone);
  if (!nome || !email)
    return res
      .status(400)
      .json({ mensagem: "Nome e e-mail são obrigatórios." });
  if (nome.length > LIMITES.nomeUsuario)
    return res
      .status(400)
      .json({ mensagem: `O nome deve ter no máximo ${LIMITES.nomeUsuario} caracteres.` });
  if (email.length > LIMITES.email || !EMAIL_PATTERN.test(email))
    return res.status(400).json({ mensagem: "Informe um e-mail válido." });
  if (telefone && telefone.length > LIMITES.telefone)
    return res
      .status(400)
      .json({ mensagem: `O telefone deve ter no máximo ${LIMITES.telefone} caracteres.` });

  try {
    const [result] = await pool.execute(
      "UPDATE USUARIO SET nome = ?, telefone = ?, email = ? WHERE id_usuario = ?",
      [nome, telefone, email, req.usuarioAutenticado]
    );
    if (!result.affectedRows)
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    const [rows] = await pool.execute(
      "SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?",
      [req.usuarioAutenticado]
    );
    return res.json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

const SELECT_FAZENDA = `SELECT f.id_fazenda AS id, f.nome_fazenda AS nome, f.localizacao,
      f.area_ha AS areaHa, f.qtd_talhoes AS talhoes, f.observacoes,
      f.id_cultura_fk, c.nome_cultura AS cultura
      FROM FAZENDAS f LEFT JOIN CULTURAS c ON c.id_cultura = f.id_cultura_fk`;

app.get("/api/fazendas", async (req, res) => {
  if (!req.query.id_usuario)
    return res.status(400).json({ mensagem: "id_usuario é obrigatório." });

  try {
    const [rows] = await pool.execute(
      `${SELECT_FAZENDA}
      WHERE f.id_usuario_fk = ? AND f.deleted_at IS NULL ORDER BY f.nome_fazenda`,
      [req.usuarioAutenticado]
    );
    return res.json(rows);
  } catch (error) {
    return contaError(res, error);
  }
});

app.post("/api/fazendas", async (req, res) => {
  const { id_usuario, id_cultura, cultura, area_ha, qtd_talhoes } = req.body;
  const nome = texto(req.body.nome_fazenda);
  const localizacao = textoOpcional(req.body.localizacao);
  if (!nome || !id_usuario)
    return res
      .status(400)
      .json({ mensagem: "nome_fazenda e id_usuario são obrigatórios." });
  if (nome.length > LIMITES.nomeFazenda)
    return res
      .status(400)
      .json({ mensagem: `O nome da fazenda deve ter no máximo ${LIMITES.nomeFazenda} caracteres.` });
  if (localizacao && localizacao.length > LIMITES.localizacao)
    return res
      .status(400)
      .json({ mensagem: `A localização deve ter no máximo ${LIMITES.localizacao} caracteres.` });
  if (id_cultura !== undefined && id_cultura !== null && id_cultura !== "" && !idPositivo(id_cultura))
    return res.status(400).json({ mensagem: "Cultura inválida." });

  const area =
    area_ha === undefined || area_ha === null || area_ha === ""
      ? null
      : Number(area_ha);
  const talhoes =
    qtd_talhoes === undefined || qtd_talhoes === null || qtd_talhoes === ""
      ? null
      : Number(qtd_talhoes);
  const notas = textoOpcional(req.body.observacoes);
  if (area !== null && (!Number.isFinite(area) || area <= 0 || area >= 1e10))
    return res
      .status(400)
      .json({ mensagem: "A área deve ser um número maior que zero." });
  if (talhoes !== null && (!Number.isInteger(talhoes) || talhoes < 1 || talhoes > 100000))
    return res
      .status(400)
      .json({
        mensagem: "A quantidade de talhões deve ser um inteiro maior que zero."
      });
  if (notas && notas.length > LIMITES.observacoes)
    return res
      .status(400)
      .json({ mensagem: `As observações devem ter no máximo ${LIMITES.observacoes} caracteres.` });

  try {
    let culturaId = id_cultura ? Number(id_cultura) : null;
    const nomeCultura = texto(cultura);
    if (!culturaId && nomeCultura) {
      if (nomeCultura.length > LIMITES.nomeCultura)
        return res
          .status(400)
          .json({ mensagem: `O nome da cultura deve ter no máximo ${LIMITES.nomeCultura} caracteres.` });
      // A collation da coluna já compara sem diferenciar maiúsculas.
      const [culturas] = await pool.execute(
        "SELECT id_cultura FROM CULTURAS WHERE nome_cultura = ? LIMIT 1",
        [nomeCultura]
      );
      if (culturas.length) {
        culturaId = culturas[0].id_cultura;
      } else {
        // O formulário de fazenda envia a cultura pelo nome (lista fixa ou "Outra"):
        // ela é registrada sem limiares de umidade, que podem ser definidos depois.
        const [novaCultura] = await pool.execute(
          "INSERT INTO CULTURAS (nome_cultura) VALUES (?)",
          [nomeCultura]
        );
        culturaId = novaCultura.insertId;
      }
    }
    const [result] = await pool.execute(
      `INSERT INTO FAZENDAS
      (nome_fazenda, localizacao, id_usuario_fk, id_cultura_fk, area_ha, qtd_talhoes, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, localizacao, req.usuarioAutenticado, culturaId, area, talhoes, notas]
    );
    const [rows] = await pool.execute(`${SELECT_FAZENDA} WHERE f.id_fazenda = ?`, [
      result.insertId
    ]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return contaError(res, error);
  }
});

app.delete("/api/fazendas/:id", async (req, res) => {
  const idFazenda = String(req.params.id);
  if (!idPositivo(idFazenda)) {
    return res
      .status(400)
      .json({ mensagem: "Identificador de fazenda inválido." });
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
  const nome = texto(req.body.nome_cultura);
  const descricao = textoOpcional(req.body.descricao_tecnica);
  const { umidade_minima, umidade_maxima } = req.body;
  if (
    !nome ||
    umidade_minima === undefined ||
    umidade_minima === "" ||
    umidade_maxima === undefined ||
    umidade_maxima === ""
  )
    return res
      .status(400)
      .json({ mensagem: "Nome e limiares de umidade são obrigatórios." });
  const minima = Number(umidade_minima);
  const maxima = Number(umidade_maxima);
  if (![minima, maxima].every((valor) => Number.isFinite(valor) && valor >= 0 && valor <= 100))
    return res
      .status(400)
      .json({ mensagem: "Os limiares de umidade devem estar entre 0 e 100%." });
  if (minima > maxima)
    return res
      .status(400)
      .json({ mensagem: "A umidade mínima não pode ser maior que a máxima." });
  if (nome.length > LIMITES.nomeCultura)
    return res
      .status(400)
      .json({ mensagem: `O nome da cultura deve ter no máximo ${LIMITES.nomeCultura} caracteres.` });
  if (descricao && descricao.length > LIMITES.descricaoCultura)
    return res
      .status(400)
      .json({ mensagem: `A descrição deve ter no máximo ${LIMITES.descricaoCultura} caracteres.` });

  try {
    // A tabela institucional não tem índice único no nome; evita duplicatas pela API.
    const [existentes] = await pool.execute(
      "SELECT id_cultura FROM CULTURAS WHERE nome_cultura = ? LIMIT 1",
      [nome]
    );
    if (existentes.length)
      return res.status(409).json({ mensagem: "Esta cultura já está cadastrada." });
    const [result] = await pool.execute(
      "INSERT INTO CULTURAS (nome_cultura, descricao_tecnica, umidade_ideal_min, umidade_ideal_max) VALUES (?, ?, ?, ?)",
      [nome, descricao, minima, maxima]
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
  if (!req.query.id_usuario)
    return res.status(400).json({ mensagem: "id_usuario é obrigatório." });

  // Último contato = leitura mais recente no histórico. DISPOSITIVOS.ultima_atualizacao não
  // serve: na base institucional ela tem ON UPDATE CURRENT_TIMESTAMP e muda a cada edição da linha.
  const listarDispositivos = (comChave) =>
    pool.execute(
      `SELECT x.*, x.ultimaAtualizacao IS NOT NULL
        AND x.ultimaAtualizacao >= NOW() - INTERVAL ${ONLINE_JANELA_SEGUNDOS} SECOND AS conectado
      FROM (
        SELECT d.id_dispositivo AS id, d.nome_dispositivo AS nome, d.mac_address AS mac,
        d.id_fazenda_fk AS id_fazenda, d.id_campo, f.nome_fazenda AS fazenda,
        d.ultima_leitura_umidade AS ultimaUmidade,
        (SELECT MAX(h.data_hora) FROM HISTORICO_UMIDADE h WHERE h.id_dispositivo_fk = d.id_dispositivo) AS ultimaAtualizacao,
        ${comChave ? "d.chave_hash IS NOT NULL" : "0"} AS chaveConfigurada
        FROM DISPOSITIVOS d INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
        WHERE f.id_usuario_fk = ? AND f.deleted_at IS NULL AND d.deleted_at IS NULL
      ) x ORDER BY x.nome`,
      [req.usuarioAutenticado]
    );

  try {
    let rows;
    try {
      [rows] = await listarDispositivos(true);
    } catch (error) {
      // Antes da migração 006 a coluna chave_hash não existe: a lista continua funcionando.
      if (error.code !== "ER_BAD_FIELD_ERROR") throw error;
      [rows] = await listarDispositivos(false);
    }
    // Conectado = contato do aparelho dentro da janela; o campo gravado pode ficar desatualizado.
    return res.json(
      rows.map(({ conectado, chaveConfigurada, ...row }) => ({
        ...row,
        status: conectado ? "ON" : "OFF",
        online: Boolean(conectado),
        chaveConfigurada: Boolean(chaveConfigurada),
        talhaoVinculado: row.fazenda
      }))
    );
  } catch (error) {
    return contaError(res, error);
  }
});

app.post("/api/dispositivos", async (req, res) => {
  const { id_fazenda, id_campo } = req.body;
  const nome = texto(req.body.nome_dispositivo);
  const macInformado = texto(req.body.mac_address);
  if (
    !nome ||
    !macInformado ||
    !id_fazenda ||
    id_campo === undefined ||
    id_campo === null ||
    id_campo === ""
  )
    return res
      .status(400)
      .json({ mensagem: "Nome, MAC, fazenda e campo são obrigatórios." });
  if (nome.length > LIMITES.nomeDispositivo)
    return res
      .status(400)
      .json({ mensagem: `O nome do dispositivo deve ter no máximo ${LIMITES.nomeDispositivo} caracteres.` });
  if (!MAC_PATTERN.test(macInformado))
    return res
      .status(400)
      .json({ mensagem: "Informe o MAC no formato AA:BB:CC:DD:EE:FF." });
  if (!idPositivo(id_fazenda))
    return res.status(400).json({ mensagem: "Fazenda inválida." });
  if (!/^\d+$/.test(String(id_campo)) || Number(id_campo) > 2147483647)
    return res
      .status(400)
      .json({ mensagem: "O campo deve ser um número inteiro não negativo." });
  const mac = normalizarMac(macInformado);

  try {
    const [owned] = await pool.execute(
      "SELECT id_fazenda FROM FAZENDAS WHERE id_fazenda = ? AND id_usuario_fk = ? AND deleted_at IS NULL",
      [id_fazenda, req.usuarioAutenticado]
    );
    if (!owned.length)
      return res.status(403).json({ mensagem: "Fazenda não autorizada." });
    const [result] = await pool.execute(
      "INSERT INTO DISPOSITIVOS (nome_dispositivo, mac_address, status_conexao, id_fazenda_fk, id_campo) VALUES (?, ?, 'OFF', ?, ?)",
      [nome, mac, id_fazenda, Number(id_campo)]
    );
    const [rows] = await pool.execute(
      `SELECT d.id_dispositivo AS id, d.nome_dispositivo AS nome, d.mac_address AS mac,
      d.status_conexao AS status, d.id_fazenda_fk AS id_fazenda, d.id_campo, f.nome_fazenda AS fazenda
      FROM DISPOSITIVOS d INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
      WHERE d.id_dispositivo = ?`,
      [result.insertId]
    );
    return res
      .status(201)
      .json({ ...rows[0], online: false, talhaoVinculado: rows[0]?.fazenda });
  } catch (error) {
    return contaError(res, error);
  }
});

app.delete("/api/dispositivos/:id", async (req, res) => {
  const idDispositivo = String(req.params.id);
  if (!idPositivo(idDispositivo)) {
    return res
      .status(400)
      .json({ mensagem: "Identificador de dispositivo inválido." });
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

const loginLimiter = createLoginLimiter();
// Mesma mensagem para e-mail inexistente e senha incorreta: não revela contas cadastradas.
const CREDENCIAIS_INVALIDAS = { sucesso: false, mensagem: "E-mail ou senha inválidos." };

app.post("/api/login", async (req, res) => {
  const emailNormalizado = normalizarEmail(req.body?.email);
  const senhaNormalizada = String(req.body?.senha || "").trim();

  if (!emailNormalizado || !senhaNormalizada) {
    return res
      .status(400)
      .json({ sucesso: false, mensagem: "E-mail e senha são obrigatórios." });
  }
  if (emailNormalizado.length > 254 || senhaNormalizada.length > 1024)
    return res.status(401).json(CREDENCIAIS_INVALIDAS);

  const limiteKey = { ip: req.ip, email: emailNormalizado };
  const bloqueio = loginLimiter.check(limiteKey);
  if (bloqueio) {
    res.setHeader("Retry-After", String(bloqueio));
    return res.status(429).json({
      sucesso: false,
      mensagem: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
    });
  }

  try {
    // A collation utf8mb4_unicode_ci compara sem diferenciar maiúsculas e usa o índice único.
    const [results] = await pool.execute(
      "SELECT id_usuario, nome, email, telefone, tipo_usuario, senha FROM USUARIO WHERE email = ? LIMIT 1",
      [emailNormalizado]
    );
    const usuarioNoBanco = results[0];
    const senhaBanco = usuarioNoBanco?.senha
      ? usuarioNoBanco.senha.toString().trim()
      : "";

    if (!usuarioNoBanco || !(await verifyPassword(senhaNormalizada, senhaBanco, !production))) {
      loginLimiter.fail(limiteKey);
      return res.status(401).json(CREDENCIAIS_INVALIDAS);
    }

    if (canHashWithBcrypt(senhaNormalizada) && needsPasswordRehash(senhaBanco)) {
      const hash = await hashPassword(senhaNormalizada);
      const [updated] = await pool.execute(
        "UPDATE USUARIO SET senha = ? WHERE id_usuario = ? AND BINARY senha = ?",
        [hash, usuarioNoBanco.id_usuario, usuarioNoBanco.senha]
      );
      if (!updated.affectedRows) {
        return res.status(401).json({ sucesso: false, mensagem: "Senha alterada. Entre novamente." });
      }
    }
    loginLimiter.reset(limiteKey);
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
  } catch (err) {
    console.error("[LOGIN]", err.code || "DB_ERROR");
    if (bancoIndisponivel(err)) return respostaBancoIndisponivel(res);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno no servidor." });
  }
});

// Cadastro público: cada tentativa conta no limite por IP para conter criação em massa.
const cadastroLimiter = createLoginLimiter({ windowMs: 60 * 60 * 1000, maxPerIp: 10, maxPerAccount: 10 });
app.post("/api/cadastro", async (req, res) => {
  const nome = texto(req.body?.nome);
  const email = normalizarEmail(req.body?.email);
  const telefone = textoOpcional(req.body?.telefone);
  const senha = String(req.body?.senha || "").trim();

  const limiteKey = { ip: req.ip, email };
  const bloqueio = cadastroLimiter.check(limiteKey);
  if (bloqueio) {
    res.setHeader("Retry-After", String(bloqueio));
    return res.status(429).json({
      sucesso: false,
      mensagem: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente."
    });
  }
  cadastroLimiter.fail(limiteKey);

  const invalido = (mensagem) => res.status(400).json({ sucesso: false, mensagem });
  if (!nome || !email || !senha)
    return invalido("Nome, e-mail e senha são obrigatórios.");
  if (nome.length > LIMITES.nomeUsuario)
    return invalido(`O nome deve ter no máximo ${LIMITES.nomeUsuario} caracteres.`);
  if (email.length > LIMITES.email || !EMAIL_PATTERN.test(email))
    return invalido("Informe um e-mail válido.");
  if (telefone && telefone.length > LIMITES.telefone)
    return invalido(`O telefone deve ter no máximo ${LIMITES.telefone} caracteres.`);
  const erroSenha = validarNovaSenha(senha);
  if (erroSenha) return invalido(erroSenha);

  try {
    const hash = await hashPassword(senha);
    // Novas contas são sempre AGRICULTOR; o perfil TECNICO continua administrativo.
    const [result] = await pool.execute(
      "INSERT INTO USUARIO (nome, email, telefone, tipo_usuario, senha) VALUES (?, ?, ?, 'AGRICULTOR', ?)",
      [nome, email, telefone, hash]
    );
    return res.status(201).json({
      sucesso: true,
      accessToken: criarTokenSessao(result.insertId),
      usuario: { id: result.insertId, nome, email, telefone, tipo: "AGRICULTOR" }
    });
  } catch (error) {
    console.error("[CADASTRO]", error.code || "DB_ERROR");
    if (error.code === "ER_DUP_ENTRY")
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este e-mail já está cadastrado. Entre com sua senha."
      });
    if (bancoIndisponivel(error)) return respostaBancoIndisponivel(res);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Não foi possível concluir o cadastro." });
  }
});

createIotRoutes({ pool, bancoIndisponivel }).registrar(app);
createPasswordResetRoutes({
  pool,
  secret: SESSION_SECRET,
  hashPassword,
  validarNovaSenha,
  isMailConfigured,
  createTransport,
  bancoIndisponivel,
  frontendOrigin,
  // Caminho público do site (homepage do frontend), usado no link enviado por e-mail.
  frontendBasePath: process.env.FRONTEND_BASE_PATH ?? "/tecti/2026/gpec05",
  production
}).registrar(app);

app.use("/api", (_req, res) =>
  res.status(404).json({ mensagem: "Recurso não encontrado." })
);

app.use((error, _req, res, _next) => {
  console.error("[API]", error.code || error.status || "INTERNAL_ERROR");
  const status = bancoIndisponivel(error)
    ? 503
    : error.status === 400 || error.status === 413
      ? error.status
      : 500;
  res
    .status(status)
    .json({
      mensagem:
        status === 503
          ? "Banco de dados indisponível."
          : status === 413
            ? "Requisição muito grande."
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
