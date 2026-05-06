
require('dotenv').config();
console.log('Variáveis carregadas:', process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASS, process.env.DB_NAME, process.env.DB_PORT);

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

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
          nome: usuarioNoBanco.nome,
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
    if (err && err.code === 'ECONNREFUSED') {
      return res.status(500).json({ sucesso: false, mensagem: `Não foi possível conectar ao banco de dados em ${dbHost}:${dbPort}. Verifique se o host e porta estão corretos e se o banco aceita conexões remotas.` });
    }
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Servidor AgroVia rodando em http://localhost:5000');
});
