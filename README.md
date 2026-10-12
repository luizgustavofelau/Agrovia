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
- Banco criado previamente e usuário MySQL com permissões para criar/alterar tabelas e índices

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

### 3) Configurar o banco e as variáveis de ambiente

Crie o banco uma vez, caso ainda não exista. Use o mesmo nome informado em `DB_NAME`:

```sql
CREATE DATABASE agrovia
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;
```

Copie `backend/.env.example` para `backend/.env` (no PowerShell, `Copy-Item backend/.env.example backend/.env`) e preencha os dados locais. Se `backend/.env` já existir, edite-o sem sobrescrever:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=agrovia
DB_PORT=3306
PORT=5000
```

Não envie `backend/.env` ao Git e não compartilhe credenciais. A aplicação não cria usuários administrativos automaticamente; provisionar uma conta inicial deve seguir o procedimento de segurança do ambiente.

### 4) Preparar e conferir o schema

Na raiz do projeto, aplique as migrações aditivas em ordem e confira banco e colunas requeridas:

```powershell
Push-Location backend
npm run db:migrate
npm run test-db
Pop-Location
```

O migrador lê os arquivos numerados de `backend/migrations/` e pode ser executado novamente: as tabelas são criadas com `IF NOT EXISTS`, e as migrações de colunas verificam se cada coluna já existe. A migração `001_conta.sql` adiciona campos de dispositivo; `002_fazenda_detalhes.sql` adiciona área, talhões e observações.

Para conferir a ordem/segmentação sem conectar nem executar SQL, use `npm run db:migrate -- --dry-run`.

Para uma base já existente, faça backup antes, confira o nome do banco e revise `SHOW CREATE TABLE` nas tabelas atuais. As migrações não apagam dados, mas `CREATE TABLE IF NOT EXISTS` não corrige tipos/índices de tabelas antigas. O diagnóstico informa colunas requeridas que ainda faltam; resolva divergências antes de usar a aplicação.

O endpoint `GET http://localhost:5000/api/health` retorna se a API está ativa, se o banco conectou e se o schema tem as colunas esperadas. `npm run test-db` faz a mesma verificação pelo terminal.

### 5) Iniciar backend e frontend

Mantenha cada servidor em um terminal separado, ambos abertos:

```bash
Push-Location backend
npm start
```

```bash
Push-Location frontend
npm start
```

A aplicação ficará disponível em:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Credencial de acesso local

Para ambiente de teste sem banco configurado, o sistema aceita o usuário padrão:

- E-mail: `miguelmaximus2008@gmail.com`
- Senha: `adm123`

Essa credencial só é aceita enquanto o banco estiver indisponível. Com MySQL conectado, o acesso é validado exclusivamente contra `USUARIO`; provisione a conta inicial pelo procedimento administrativo seguro do ambiente.

## Observações importantes

- O projeto já inclui uma camada de autenticação local de fallback para permitir testes quando o banco ainda não está conectado.
- O backend depende de um banco MySQL funcional para uso em produção real.
- Os cadastros fallback são voláteis e vêm marcados como demonstração; não são persistidos no MySQL.
- O schema atual armazena usuários, culturas, fazendas e dispositivos. Ainda não há tabelas/rotas de leituras, histórico, alertas de telemetria ou eventos de irrigação.
- As telas de cadastro de campos e dispositivos usam as rotas já existentes. Leituras em tempo real dependem de integração de sensores que ainda precisa ser implementada.
- O projeto foi pensado para apresentação acadêmica e evolução contínua para TCC.
