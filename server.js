const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// 1. Rota de Login (Agora usando o banco na Nuvem)
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const usuario = await prisma.usuario.findFirst({
            where: {
                email: email,
                senha: senha // Em produção, usaríamos hash, mas para o TCC ok!
            }
        });

        if (usuario) {
            console.log(`✅ Login realizado: ${usuario.nome}`);
            res.json({ sucesso: true, usuario });
        } else {
            res.status(401).json({ sucesso: false, mensagem: "Credenciais inválidas" });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ erro: "Erro ao conectar com a nuvem" });
    }
});

// 2. Rota para buscar Fazendas e Status dos Irrigadores
app.get('/api/dashboard', async (req, res) => {
    try {
        // Busca fazendas incluindo os dispositivos (Relacionamento do seu diagrama)
        const fazendas = await prisma.fazendas.findMany({
            include: { dispositivos: true }
        });
        res.json(fazendas);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar dados do dashboard" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor AgroVia ONLINE na porta ${PORT}`);
    console.log(`☁️ Conectado ao banco de dados na nuvem.`);
});