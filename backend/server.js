
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('Variáveis carregadas:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  PORT: process.env.PORT,
});

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const FALLBACK_USUARIOS = [
  {
    id_usuario: 1,
    nome: 'Miguel Maximus',
    email: 'miguelmaximus2008@gmail.com',
    senha: 'adm123',
    telefone: '(11) 98765-4321',
    tipo_usuario: 'ADMIN',
  },
];

const FALLBACK_FAZENDAS = [
  { id: 1, nome: 'Fazenda Vale Verde', localizacao: 'São José do Rio Preto - SP', cultura: 'Soja' },
  { id: 2, nome: 'Lote Estrela', localizacao: 'Bauru - SP', cultura: 'Milho' },
];

const FALLBACK_CULTURAS = [
  { id: 1, nome: 'Soja', descricao: 'Cultura de alta produtividade para clima temperado.', umidadeMin: 40, umidadeMax: 65 },
  { id: 2, nome: 'Milho', descricao: 'Ajuste ideal para irrigação em estágios de desenvolvimento.', umidadeMin: 35, umidadeMax: 60 },
  { id: 3, nome: 'Café', descricao: 'Requer monitoramento mais frequente em regiões de maior elevação.', umidadeMin: 45, umidadeMax: 70 },
];

const FALLBACK_DISPOSITIVOS = [
  { id: 1, nome: 'ESP32-01', mac: 'A0:B7:65:12:33:AA', online: true, id_fazenda: 1, id_campo: 1, fazenda: 'Fazenda Vale Verde' },
  { id: 2, nome: 'ESP32-02', mac: 'A0:B7:65:12:33:BB', online: false, id_fazenda: 2, id_campo: 2, fazenda: 'Lote Estrela' },
];

const verificarBancoDisponivel = async () => {
  try {
    await pool.query('SELECT 1 AS ok');
    return true;
  } catch (error) {
    console.warn('[DB] Banco indisponível — usando fallback:', error.message);
    return false;
  }
};

const normalizarEmail = (valor = '') => String(valor).trim().toLowerCase();

const localizarUsuarioFallback = (email, senha) => {
  const emailNormalizado = normalizarEmail(email);
  const senhaNormalizada = String(senha || '').trim();

  return FALLBACK_USUARIOS.find((usuario) =>
    normalizarEmail(usuario.email) === emailNormalizado && String(usuario.senha).trim() === senhaNormalizada
  );
};

const contaError = (res, error) => {
  console.error('[CONTA]', error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensagem: 'O registro informado já existe.' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ mensagem: 'A fazenda ou o campo informado não existe.' });
  return res.status(500).json({ mensagem: 'Erro interno ao acessar os dados da conta.' });
};

app.get('/api/usuario/:id', async (req, res) => {
  if (!(await verificarBancoDisponivel())) {
    const usuario = FALLBACK_USUARIOS.find((item) => String(item.id_usuario) === String(req.params.id));
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    return res.json({ id_usuario: usuario.id_usuario, nome: usuario.nome, email: usuario.email, telefone: usuario.telefone, tipo_usuario: usuario.tipo_usuario });
  }

  try {
    const [rows] = await pool.execute('SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    return res.json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.put('/api/usuario/:id', async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !email) return res.status(400).json({ mensagem: 'Nome e e-mail são obrigatórios.' });

  if (!(await verificarBancoDisponivel())) {
    const usuarioAtual = FALLBACK_USUARIOS.find((item) => String(item.id_usuario) === String(req.params.id));
    if (!usuarioAtual) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    const usuarioAtualizado = {
      id_usuario: usuarioAtual.id_usuario,
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone || usuarioAtual.telefone,
      tipo_usuario: usuarioAtual.tipo_usuario,
    };
    FALLBACK_USUARIOS[0] = { ...FALLBACK_USUARIOS[0], ...usuarioAtualizado };
    return res.json(usuarioAtualizado);
  }

  try {
    const [result] = await pool.execute('UPDATE USUARIO SET nome = ?, telefone = ?, email = ? WHERE id_usuario = ?', [nome.trim(), telefone || null, email.trim(), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    const [rows] = await pool.execute('SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.get('/api/fazendas', async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ mensagem: 'id_usuario é obrigatório.' });

  if (!(await verificarBancoDisponivel())) {
    return res.json(FALLBACK_FAZENDAS);
  }

  try {
    const [rows] = await pool.execute(`SELECT f.id_fazenda AS id, f.nome_fazenda AS nome, f.localizacao,
      f.id_cultura_fk, c.nome_cultura AS cultura
      FROM FAZENDAS f LEFT JOIN CULTURAS c ON c.id_cultura = f.id_cultura_fk
      WHERE f.id_usuario_fk = ? ORDER BY f.nome_fazenda`, [id_usuario]);
    return res.json(rows);
  } catch (error) { return contaError(res, error); }
});

app.post('/api/fazendas', async (req, res) => {
  const { nome_fazenda, localizacao, id_usuario, id_cultura } = req.body;
  if (!nome_fazenda || !id_usuario) return res.status(400).json({ mensagem: 'nome_fazenda e id_usuario são obrigatórios.' });

  if (!(await verificarBancoDisponivel())) {
    const novaFazenda = {
      id: FALLBACK_FAZENDAS.length + 1,
      nome: nome_fazenda.trim(),
      localizacao: localizacao || 'Localização não informada',
      cultura: id_cultura ? `Cultura ${id_cultura}` : 'Sem cultura definida',
    };
    FALLBACK_FAZENDAS.push(novaFazenda);
    return res.status(201).json(novaFazenda);
  }

  try {
    const [result] = await pool.execute('INSERT INTO FAZENDAS (nome_fazenda, localizacao, id_usuario_fk, id_cultura_fk) VALUES (?, ?, ?, ?)', [nome_fazenda.trim(), localizacao || null, id_usuario, id_cultura || null]);
    const [rows] = await pool.execute('SELECT id_fazenda AS id, nome_fazenda AS nome, localizacao, id_cultura_fk FROM FAZENDAS WHERE id_fazenda = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.get('/api/culturas', async (_req, res) => {
  if (!(await verificarBancoDisponivel())) return res.json(FALLBACK_CULTURAS);

  try {
    const [rows] = await pool.execute(`SELECT id_cultura AS id, nome_cultura AS nome, descricao_tecnica AS descricao,
      umidade_ideal_min AS umidadeMin, umidade_ideal_max AS umidadeMax FROM CULTURAS ORDER BY nome_cultura`);
    return res.json(rows);
  } catch (error) { return contaError(res, error); }
});

app.post('/api/culturas', async (req, res) => {
  const { nome_cultura, descricao_tecnica, umidade_minima, umidade_maxima } = req.body;
  if (!nome_cultura || umidade_minima === undefined || umidade_maxima === undefined) return res.status(400).json({ mensagem: 'Nome e limiares de umidade são obrigatórios.' });
  if (Number(umidade_minima) > Number(umidade_maxima)) return res.status(400).json({ mensagem: 'A umidade mínima não pode ser maior que a máxima.' });

  if (!(await verificarBancoDisponivel())) {
    const novaCultura = {
      id: FALLBACK_CULTURAS.length + 1,
      nome: nome_cultura.trim(),
      descricao: descricao_tecnica || 'Cultura cadastrada em modo de demonstração.',
      umidadeMin: Number(umidade_minima),
      umidadeMax: Number(umidade_maxima),
    };
    FALLBACK_CULTURAS.push(novaCultura);
    return res.status(201).json(novaCultura);
  }

  try {
    const [result] = await pool.execute('INSERT INTO CULTURAS (nome_cultura, descricao_tecnica, umidade_ideal_min, umidade_ideal_max) VALUES (?, ?, ?, ?)', [nome_cultura.trim(), descricao_tecnica || null, umidade_minima, umidade_maxima]);
    const [rows] = await pool.execute('SELECT id_cultura AS id, nome_cultura AS nome, descricao_tecnica AS descricao, umidade_ideal_min AS umidadeMin, umidade_ideal_max AS umidadeMax FROM CULTURAS WHERE id_cultura = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.get('/api/dispositivos', async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ mensagem: 'id_usuario é obrigatório.' });

  if (!(await verificarBancoDisponivel())) {
    return res.json(FALLBACK_DISPOSITIVOS.map((item) => ({ ...item, talhaoVinculado: item.fazenda, status: item.online ? 'ON' : 'OFF' })));
  }

  try {
    const [rows] = await pool.execute(`SELECT d.id_dispositivo AS id, d.nome_dispositivo AS nome, d.mac_address AS mac,
      d.status_conexao AS status, d.id_fazenda_fk AS id_fazenda, d.id_campo, f.nome_fazenda AS fazenda
      FROM DISPOSITIVOS d INNER JOIN FAZENDAS f ON f.id_fazenda = d.id_fazenda_fk
      WHERE f.id_usuario_fk = ? ORDER BY d.nome_dispositivo`, [id_usuario]);
    return res.json(rows.map(row => ({ ...row, online: row.status === 'ON', talhaoVinculado: row.fazenda })));
  } catch (error) { return contaError(res, error); }
});

app.post('/api/dispositivos', async (req, res) => {
  const { nome_dispositivo, mac_address, id_fazenda, id_campo } = req.body;
  if (!nome_dispositivo || !mac_address || !id_fazenda || id_campo === undefined || id_campo === '') return res.status(400).json({ mensagem: 'Nome, MAC, fazenda e campo são obrigatórios.' });

  if (!(await verificarBancoDisponivel())) {
    const novoDispositivo = {
      id: FALLBACK_DISPOSITIVOS.length + 1,
      nome: nome_dispositivo.trim(),
      mac: mac_address.trim().toUpperCase(),
      online: false,
      id_fazenda: Number(id_fazenda),
      id_campo: Number(id_campo),
      fazenda: 'Fazenda de demonstração',
      talhaoVinculado: 'Fazenda de demonstração',
    };
    FALLBACK_DISPOSITIVOS.push(novoDispositivo);
    return res.status(201).json(novoDispositivo);
  }

  try {
    const [result] = await pool.execute('INSERT INTO DISPOSITIVOS (nome_dispositivo, mac_address, status_conexao, id_fazenda_fk, id_campo) VALUES (?, ?, \'OFF\', ?, ?)', [nome_dispositivo.trim(), mac_address.trim().toUpperCase(), id_fazenda, id_campo]);
    const [rows] = await pool.execute('SELECT id_dispositivo AS id, nome_dispositivo AS nome, mac_address AS mac, status_conexao AS status, id_fazenda_fk AS id_fazenda, id_campo FROM DISPOSITIVOS WHERE id_dispositivo = ?', [result.insertId]);
    return res.status(201).json({ ...rows[0], online: false });
  } catch (error) { return contaError(res, error); }
});

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  const emailNormalizado = normalizarEmail(email);
  const senhaNormalizada = String(senha || '').trim();

  console.log(`[LOGIN] Tentativa de login para: ${emailNormalizado}`);

  if (!emailNormalizado || !senhaNormalizada) {
    return res.status(400).json({ sucesso: false, mensagem: 'E-mail e senha são obrigatórios.' });
  }

  const bancoDisponivel = await verificarBancoDisponivel();
  const usuarioFallback = localizarUsuarioFallback(emailNormalizado, senhaNormalizada);
  if (!bancoDisponivel) {
    if (usuarioFallback) {
      return res.json({
        sucesso: true,
        usuario: {
          id: usuarioFallback.id_usuario,
          nome: usuarioFallback.nome,
          email: usuarioFallback.email,
          telefone: usuarioFallback.telefone,
          tipo: usuarioFallback.tipo_usuario,
        },
      });
    }
    return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha inválidos.' });
  }

  if (usuarioFallback) {
    return res.json({
      sucesso: true,
      usuario: {
        id: usuarioFallback.id_usuario,
        nome: usuarioFallback.nome,
        email: usuarioFallback.email,
        telefone: usuarioFallback.telefone,
        tipo: usuarioFallback.tipo_usuario,
      },
    });
  }

  try {
    const sql = 'SELECT * FROM USUARIO WHERE LOWER(email) = ?';
    const [results] = await pool.execute(sql, [emailNormalizado]);

    if (results.length === 0) {
      return res.status(401).json({ sucesso: false, mensagem: 'E-mail não cadastrado.' });
    }

    const usuarioNoBanco = results[0];
    const senhaBanco = usuarioNoBanco.senha ? usuarioNoBanco.senha.toString().trim() : '';

    if (senhaBanco === senhaNormalizada) {
      return res.json({
        sucesso: true,
        usuario: {
          id: usuarioNoBanco.id_usuario,
          nome: usuarioNoBanco.nome,
          email: usuarioNoBanco.email,
          telefone: usuarioNoBanco.telefone,
          tipo: usuarioNoBanco.tipo_usuario,
        },
      });
    }

    return res.status(401).json({ sucesso: false, mensagem: 'Senha inválida.' });
  } catch (err) {
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT || 3306;
    console.error(`[LOGIN] Erro ao conectar ao banco em ${dbHost}:${dbPort}`);
    console.error('Detalhes do erro:', err);
    if (err && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || !dbHost)) {
      return res.status(500).json({ sucesso: false, mensagem: `Não foi possível conectar ao banco de dados em ${dbHost || 'localhost'}:${dbPort}. Verifique se o host e porta estão corretos e se o banco aceita conexões remotas.` });
    }
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
});

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`🚀 Servidor AgroVia rodando em http://localhost:${port}`);
});
