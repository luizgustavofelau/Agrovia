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
    console.error('Erro no login:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Servidor AgroVia rodando em http://localhost:5000');
});
