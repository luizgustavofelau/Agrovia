async function fazerLogin() {
    // 1. Captura os valores dos campos de input
    const emailInput = document.getElementById('email').value;
    const senhaInput = document.getElementById('senha').value;
    const msgErro = document.getElementById('msgErro');

    console.log("Tentando logar com:", emailInput); // Log para conferência no F12

    try {
        // 2. Faz a requisição POST para o seu servidor Node.js local
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailInput.trim(),
                senha: senhaInput.trim()
            })
        });

        // 3. Verifica se a resposta foi bem-sucedida (status 200)
        if (response.ok) {
            const data = await response.json();
            console.log("Login realizado com sucesso!", data);

            // 4. Salva os dados do usuário no navegador (LocalStorage)
            // Isso resolve a "falta de integração" citada no projeto [cite: 20, 27]
            localStorage.setItem('usuarioNome', data.usuario.nome);
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));

            // Redireciona para o Dashboard do AgroVia
            window.location.href = 'painel.html';
        } else {
            // Caso o status seja 401 ou outro erro de credencial
            const errorData = await response.json();
            console.warn("Falha no login:", errorData.mensagem);
            msgErro.style.display = 'block';
            msgErro.innerText = "E-mail ou senha incorretos. Tente novamente.";
        }

    } catch (error) {
        // Trata erros de conexão (ex: servidor desligado)
        console.error("Erro crítico de conexão com o servidor:", error);
        alert("O servidor AgroVia não está respondendo. Verifique se o Node.js está rodando.");
    }
}

// Intercepta o envio do formulário para não recarregar a página
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Impede o recarregamento (comportamento padrão)
    fazerLogin(); // Chama nossa função de API
});