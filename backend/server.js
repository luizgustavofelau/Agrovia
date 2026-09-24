
require('dotenv').config();
console.log('Variáveis carregadas:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
});

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const contaError = (res, error) => {
  console.error('[CONTA]', error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensagem: 'O registro informado já existe.' });
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ mensagem: 'A fazenda ou o campo informado não existe.' });
  return res.status(500).json({ mensagem: 'Erro interno ao acessar os dados da conta.' });
};

app.get('/api/usuario/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id_usuario, nome, email, telefone, tipo_usuario FROM USUARIO WHERE id_usuario = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    return res.json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.put('/api/usuario/:id', async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !email) return res.status(400).json({ mensagem: 'Nome e e-mail são obrigatórios.' });
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
  try {
    const [result] = await pool.execute('INSERT INTO FAZENDAS (nome_fazenda, localizacao, id_usuario_fk, id_cultura_fk) VALUES (?, ?, ?, ?)', [nome_fazenda.trim(), localizacao || null, id_usuario, id_cultura || null]);
    const [rows] = await pool.execute('SELECT id_fazenda AS id, nome_fazenda AS nome, localizacao, id_cultura_fk FROM FAZENDAS WHERE id_fazenda = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.get('/api/culturas', async (_req, res) => {
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
  try {
    const [result] = await pool.execute('INSERT INTO CULTURAS (nome_cultura, descricao_tecnica, umidade_ideal_min, umidade_ideal_max) VALUES (?, ?, ?, ?)', [nome_cultura.trim(), descricao_tecnica || null, umidade_minima, umidade_maxima]);
    const [rows] = await pool.execute('SELECT id_cultura AS id, nome_cultura AS nome, descricao_tecnica AS descricao, umidade_ideal_min AS umidadeMin, umidade_ideal_max AS umidadeMax FROM CULTURAS WHERE id_cultura = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) { return contaError(res, error); }
});

app.get('/api/dispositivos', async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ mensagem: 'id_usuario é obrigatório.' });
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
  try {
    const [result] = await pool.execute('INSERT INTO DISPOSITIVOS (nome_dispositivo, mac_address, status_conexao, id_fazenda_fk, id_campo) VALUES (?, ?, \'OFF\', ?, ?)', [nome_dispositivo.trim(), mac_address.trim().toUpperCase(), id_fazenda, id_campo]);
    const [rows] = await pool.execute('SELECT id_dispositivo AS id, nome_dispositivo AS nome, mac_address AS mac, status_conexao AS status, id_fazenda_fk AS id_fazenda, id_campo FROM DISPOSITIVOS WHERE id_dispositivo = ?', [result.insertId]);
    return res.status(201).json({ ...rows[0], online: false });
  } catch (error) { return contaError(res, error); }
});

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;
  console.log(`[LOGIN] Tentativa de login para: ${email}`);

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const sql = 'SELECT * FROM USUARIO WHERE email = ?';
    const [results] = await pool.execute(sql, [email.trim()]);

    if (results.length === 0) {
      return res.status(401).json({ sucesso: false, mensagem: 'E-mail não cadastrado.' });
    }

    const usuarioNoBanco = results[0];
    const senhaBanco = usuarioNoBanco.senha ? usuarioNoBanco.senha.toString().trim() : '';

    if (senhaBanco === senha.trim()) {
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
    if (err && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
      return res.status(500).json({ sucesso: false, mensagem: `Não foi possível conectar ao banco de dados em ${dbHost}:${dbPort}. Verifique se o host e porta estão corretos e se o banco aceita conexões remotas.` });
    }
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Servidor AgroVia rodando em http://localhost:5000');
});
