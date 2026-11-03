// Recuperação de senha por link enviado ao e-mail.
//
// O link carrega um token assinado (HMAC-SHA256) com validade de 30 minutos. A assinatura
// inclui o hash de senha atual do usuário: quando a senha muda, todo link anterior deixa de
// valer. Assim o link é de uso único sem precisar de tabela nova no banco.
//
// A resposta de "esqueci" é sempre a mesma, exista o e-mail ou não, para não revelar contas.
const crypto = require("crypto");
const { createLoginLimiter } = require("./login-limiter");

const VALIDADE_SEGUNDOS = 30 * 60;
const RESPOSTA_PADRAO =
  "Se o e-mail estiver cadastrado, você receberá em instantes um link para criar uma nova senha. O link vale por 30 minutos.";
const LINK_INVALIDO = "Link inválido ou expirado. Solicite uma nova redefinição de senha.";

function createPasswordResetRoutes({
  pool,
  secret,
  hashPassword,
  validarNovaSenha,
  isMailConfigured,
  createTransport,
  bancoIndisponivel,
  frontendOrigin,
  frontendBasePath,
  production
}) {
  // Chave própria derivada do segredo da sessão: um token de sessão nunca vale como token de senha.
  const chave = crypto.createHmac("sha256", secret).update("agrovia:redefinir-senha").digest();
  const limitador = createLoginLimiter({ windowMs: 60 * 60 * 1000, maxPerAccount: 3, maxPerIp: 10 });

  const assinar = (payload, hashSenhaAtual) =>
    crypto.createHmac("sha256", chave).update(`${payload}.${hashSenhaAtual}`).digest("base64url");

  function gerarToken(usuario) {
    const payload = Buffer.from(
      JSON.stringify({ sub: usuario.id_usuario, exp: Math.floor(Date.now() / 1000) + VALIDADE_SEGUNDOS })
    ).toString("base64url");
    return `${payload}.${assinar(payload, String(usuario.senha))}`;
  }

  // Confere formato, validade e assinatura; devolve o usuário ou null.
  async function validarToken(token) {
    const [payload, assinatura] = String(token || "").split(".");
    if (!payload || !assinatura || token.length > 500) return null;
    let dados;
    try {
      dados = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
      return null;
    }
    if (!Number.isInteger(dados.sub) || !Number.isInteger(dados.exp) || dados.exp <= Date.now() / 1000) return null;
    const [rows] = await pool.execute("SELECT id_usuario, email, nome, senha FROM USUARIO WHERE id_usuario = ?", [dados.sub]);
    const usuario = rows[0];
    if (!usuario) return null;
    const esperada = Buffer.from(assinar(payload, String(usuario.senha)));
    const recebida = Buffer.from(assinatura);
    if (esperada.length !== recebida.length || !crypto.timingSafeEqual(esperada, recebida)) return null;
    return usuario;
  }

  const montarLink = (token) => {
    const origem = frontendOrigin || "http://localhost:3000";
    const base = String(frontendBasePath || "").replace(/\/+$/, "");
    // O token vai no fragmento (#): ele não aparece em logs de servidor nem no Referer.
    return `${origem}${base}/redefinir-senha#token=${token}`;
  };

  async function enviarEmail(usuario, link) {
    if (!isMailConfigured()) {
      if (!production) console.info(`[SENHA] SMTP não configurado. Link de redefinição (somente desenvolvimento): ${link}`);
      else console.warn("[SENHA] Pedido de redefinição recebido, mas o SMTP não está configurado.");
      return;
    }
    await createTransport().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: usuario.email,
      subject: "Redefinição de senha — Agrovia",
      text: [
        `Olá, ${usuario.nome}!`,
        "",
        "Recebemos um pedido para criar uma nova senha na Agrovia. Para continuar, abra o link abaixo:",
        "",
        link,
        "",
        "O link vale por 30 minutos e só pode ser usado uma vez.",
        "Se você não fez esse pedido, ignore este e-mail: sua senha atual continua valendo.",
      ].join("\n"),
    });
  }

  function registrar(app) {
    app.post("/api/senha/esqueci", async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ mensagem: "Informe um e-mail válido." });

      const identidade = { ip: req.ip, email };
      const espera = limitador.check(identidade);
      if (espera) {
        res.setHeader("Retry-After", String(espera));
        return res.status(429).json({ mensagem: "Muitos pedidos de redefinição. Aguarde alguns minutos e tente novamente." });
      }
      limitador.fail(identidade);

      try {
        const [rows] = await pool.execute(
          "SELECT id_usuario, email, nome, senha FROM USUARIO WHERE email = ? LIMIT 1",
          [email]
        );
        if (rows[0]) await enviarEmail(rows[0], montarLink(gerarToken(rows[0])));
      } catch (error) {
        console.error("[SENHA] Falha ao processar pedido:", error.code || "MAIL_ERROR");
        if (bancoIndisponivel(error))
          return res.status(503).json({ mensagem: "Banco de dados indisponível." });
        // Falha no envio do e-mail não muda a resposta: evita revelar que a conta existe.
      }
      return res.json({ mensagem: RESPOSTA_PADRAO, envioConfigurado: isMailConfigured() });
    });

    app.post("/api/senha/validar", async (req, res) => {
      try {
        const usuario = await validarToken(req.body?.token);
        if (!usuario) return res.status(400).json({ valido: false, mensagem: LINK_INVALIDO });
        return res.json({ valido: true });
      } catch (error) {
        if (bancoIndisponivel(error)) return res.status(503).json({ mensagem: "Banco de dados indisponível." });
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
      }
    });

    app.post("/api/senha/redefinir", async (req, res) => {
      const senha = String(req.body?.senha || "").trim();
      const erroSenha = validarNovaSenha(senha);
      if (erroSenha) return res.status(400).json({ mensagem: erroSenha });
      try {
        const usuario = await validarToken(req.body?.token);
        if (!usuario) return res.status(400).json({ mensagem: LINK_INVALIDO });
        const hash = await hashPassword(senha);
        // Só troca se a senha não mudou desde a validação (o mesmo link não serve duas vezes).
        const [result] = await pool.execute(
          "UPDATE USUARIO SET senha = ? WHERE id_usuario = ? AND BINARY senha = ?",
          [hash, usuario.id_usuario, usuario.senha]
        );
        if (!result.affectedRows) return res.status(400).json({ mensagem: LINK_INVALIDO });
        console.info(`[SENHA] Senha redefinida para o usuário ${usuario.id_usuario}.`);
        return res.json({ mensagem: "Senha alterada com sucesso. Entre com a nova senha." });
      } catch (error) {
        console.error("[SENHA] Falha ao redefinir:", error.code || "DB_ERROR");
        if (bancoIndisponivel(error)) return res.status(503).json({ mensagem: "Banco de dados indisponível." });
        return res.status(500).json({ mensagem: "Erro interno no servidor." });
      }
    });
  }

  return { registrar };
}

module.exports = { createPasswordResetRoutes, VALIDADE_SEGUNDOS };
