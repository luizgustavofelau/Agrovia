# Agrovia

Plataforma web de irrigação inteligente para monitoramento agrícola, gestão de campos, sensores e automação de irrigação.

## Stack principal

- Frontend: React + TypeScript + CSS
- Backend: Node.js + Express + JavaScript
- Banco: MySQL
- UI: Tailwind CSS e componentes customizados

## Estrutura do projeto

- `frontend/` — interface web da aplicação
- `backend/` — API REST e integração com banco de dados
- `*.jsx` e `*.tsx` — componentes e telas da aplicação

## Requisitos

- Node.js 18+
- npm
- MySQL (para uso real em produção/desenvolvimento com banco)

## Como rodar

### 1) Instalar dependências do frontend

```bash
cd frontend
npm install
```

### 2) Instalar dependências do backend

```bash
cd backend
npm install
```

### 3) Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp backend/.env.example backend/.env
```

Edite o `.env` com os dados reais do seu banco:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=agrovia
DB_PORT=3306
PORT=5000
```

### 4) Iniciar backend

```bash
cd backend
node server.js
```

### 5) Iniciar frontend

```bash
cd frontend
npm start
```

A aplicação ficará disponível em:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Credencial de acesso local

Para ambiente de teste sem banco configurado, o sistema aceita o usuário padrão:

- E-mail: `miguelmaximus2008@gmail.com`
- Senha: `adm123`

## Observações importantes

- O projeto já inclui uma camada de autenticação local de fallback para permitir testes quando o banco ainda não está conectado.
- O backend depende de um banco MySQL funcional para uso em produção real.
- O projeto foi pensado para apresentação acadêmica e evolução contínua para TCC.
