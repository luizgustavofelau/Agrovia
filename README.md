# Agrovia

Plataforma de irrigação e gestão agrícola. Frontend React 18 + TypeScript com **Create React App (react-scripts 5)**, backend Express 5 / CommonJS, MySQL2 Promise. A arquitetura existente foi preservada; não há Vite nem ORM.

## Arquitetura

- `frontend/src/App.tsx`: BrowserRouter, rotas `/`, `/login`, `/painel/*` e `/conta`; componentes em `src/components`, conta em `src/pages`, clientes HTTP em `src/services`.
- `backend/server.js`: rotas `/api/login`, `/api/usuario/:id`, `/api/fazendas`, `/api/culturas`, `/api/dispositivos`, `/api/relatorios/automacao`. Controllers/SQL ficam no próprio servidor, sem camada de models separada.
- `backend/db.js`: pool único `mysql2/promise`, cinco conexões, fila de até 50, timeout de conexão de 10 segundos; consultas de dados usam parâmetros `?`.
- Autenticação: token próprio assinado com HMAC-SHA256, validade de oito horas, enviado por `Authorization: Bearer`. Não é JWT. O frontend guarda a sessão no localStorage. Todas as rotas de dados exigem token e os recursos pessoais verificam o proprietário.
- `backend/password.js`: hashes scrypt. Produção rejeita senhas legadas em texto puro; desenvolvimento ainda as aceita para compatibilidade. O modo de autenticação por conta de demonstração foi removido; banco indisponível retorna 503.
- `backend/report-scheduler.js`: relatórios opcionais por SMTP; não configura SMTP durante a auditoria. Evita verificações sobrepostas e aguarda o trabalho ativo no encerramento, com limite global de dez segundos.
- Não há ingestão real de telemetria nem histórico de leituras. Os relatórios usam somente os dados operacionais existentes.

## Deploy

### Frontend — Hostinger/Apache

Diretório: `frontend`. Node: `24.x`. Instalação: `npm ci`. Build: `npm run build`. Saída: `frontend/dist`.

O caminho público é **`/tecti/2026/gpec05/`**, definido por `homepage` no package.json. BrowserRouter usa `process.env.PUBLIC_URL`, calculado pelo CRA a partir desse caminho. Vite `base` e `VITE_API_URL` não se aplicam: utilize `REACT_APP_API_URL` no único `.env` do frontend. Não coloque segredos nessa variável, pois seu valor entra no JavaScript público.

Local: `REACT_APP_API_URL=http://localhost:5000`.
Produção: `REACT_APP_API_URL=` seguido da **origem HTTPS real da API Render**, sem `/api` e sem barra final. Essa URL ainda está pendente. Alterar o `.env` exige novo build.

O build exige URL HTTP(S) explícita e sempre gera `dist`. `public/.htaccess` será copiado para `dist/.htaccess`; contém RewriteBase do grupo e fallback de rotas para index.html. Não crie esse arquivo manualmente no FileZilla. Não defina PUBLIC_URL diferente de homepage sem também revisar o fallback Apache.

No FileZilla, abra `frontend/dist` e transfira **seu conteúdo**, incluindo `.htaccess`, `index.html`, `static/`, `img/` e demais arquivos gerados, para o diretório já atribuído ao grupo pela conta FTP. Não crie uma pasta `dist` extra no servidor. Não envie `.env`, fontes, backend, node_modules, Git ou arquivos de credenciais. Exiba arquivos ocultos para conferir `.htaccess`. Não altere permissões ou diretórios da hospedagem.

### Backend — Render

| Campo | Valor |
| --- | --- |
| Service Type | Web Service |
| Repository | https://github.com/luizgustavofelau/Agrovia |
| Branch | master (branch atual; confirmar como branch de publicação) |
| Root Directory | backend |
| Runtime | Node |
| Node | 24.x, definido em engines |
| Build Command | npm ci |
| Start Command | npm start |
| Health Check Path | /health |
| Auto Deploy | Desativado até concluir testes integrados; depois habilitar conforme decisão do grupo |

Cadastre `NODE_ENV=production`, `DB_HOST`, `DB_PORT=3306` (ou a porta fornecida), `DB_USER`, `DB_PASS`, `DB_NAME`, `AUTH_TOKEN_SECRET` e `FRONTEND_URL`. Preserve `DB_PASS`, nome já usado pelo projeto. `AUTH_TOKEN_SECRET` deve ser aleatório, com pelo menos 32 caracteres; gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e guarde fora do Git. O Render fornece `PORT`; o servidor escuta em `0.0.0.0`, com 5000 como padrão local. Não é necessário cadastrar PORT manualmente.

`FRONTEND_URL` é a origem institucional HTTPS **sem subpasta nem barra final**. O domínio ainda precisa ser informado. CORS permite essa origem; em desenvolvimento também permite `http://localhost:3000`. Tokens usam cabeçalho, sem dependência de cookies cross-site.

Opcionais, somente para relatórios: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. `TZ=America/Sao_Paulo` documenta o fuso utilizado na formatação dos relatórios. Não ative SMTP antes de revisar assinaturas existentes, pois o agendador inicia com o servidor.

`GET /health` confirma processo HTTP; `GET /api/health` confirma conexão e colunas requeridas, retornando 503 quando indisponível/incompleto, sem expor nomes internos. O startup e o build nunca aplicam alterações estruturais. SIGTERM/SIGINT encerram HTTP, agendador e pool.

### Banco de dados — MySQL2

As credenciais são as fornecidas pela instituição para o MySQL Hostinger existente. Não crie outro banco e não altere permissões. A conectividade remota continua pendente de teste no Render.

Scripts SQL em `backend/migrations`, em ordem:

| Script | Estrutura |
| --- | --- |
| 000_core_schema.sql | USUARIO, CULTURAS, FAZENDAS, DISPOSITIVOS e relacionamentos |
| 001_conta.sql | Nome e campo do dispositivo |
| 002_fazenda_detalhes.sql | Área, talhões e observações |
| 003_soft_delete_fazendas.sql | Exclusão lógica de fazendas e índice |
| 004_soft_delete_dispositivos.sql | Exclusão lógica, MAC ativo calculado e substituição de índice único |
| 005_relatorios_automaticos.sql | Preferências e agendamento por usuário |

Os nomes de tabelas estão em maiúsculas; respeite exatamente essa capitalização no MySQL/Linux. Os scripts documentam a estrutura esperada, mas não provam que a base remota corresponde a ela. `test-db` consulta SELECT e INFORMATION_SCHEMA. Não exporta dados. A exclusão lógica de fazenda usa transação, rollback e release em finally. Migrador e conversor também liberam conexões; consultas comuns usam o pool diretamente.

Antes de qualquer operação manual: faça backup, confirme o banco e revise as estruturas existentes e os seis SQL. `CREATE TABLE IF NOT EXISTS` não corrige tipos ou índices de tabelas antigas. O script 004 substitui um índice, portanto exige revisão e janela controlada. Não foi executado nesta auditoria.

Comandos em `backend`:

```bash
npm run test-db
npm run db:migrate -- --dry-run
```

Somente após revisão e backup, o responsável pode executar manualmente `npm run db:migrate`. Nunca coloque esse comando no build/start do Render.

Para contas legadas, `node hash-passwords.js` informa apenas a contagem de senhas sem prefixo scrypt, sem imprimir valores e sem gravar. Após backup e revisão, `node hash-passwords.js --apply` converte senhas existentes em transação. **Não foi executado durante a auditoria.** Em produção, contas não convertidas não autenticam. Para provisionar contas novas, use o procedimento administrativo da instituição com hash produzido por `hashPassword` de `password.js`. Não existe cadastro público de usuário.

## Segurança e limitações

A credencial fixa de demonstração existia no código/histórico. Remover a versão atual não apaga sua exposição: revogue/substitua essa credencial caso tenha sido reutilizada em qualquer ambiente. Troque também qualquer senha ou segredo real que tenha sido compartilhado ou commitado anteriormente. Não reescrevemos o histórico.

O armazenamento local de tokens permanece e exige cuidado com XSS. Limitação de tentativas de login e revisão de dependências são melhorias futuras; esta preparação não equivale a uma auditoria de segurança completa. Não foram feitos testes destrutivos nem alterações em dados reais.

Referências: [configuração CRA](https://create-react-app.dev/docs/advanced-configuration/), [deploy CRA](https://create-react-app.dev/docs/deployment/), [Node no Render](https://render.com/docs/node-version), [Web Services Render](https://render.com/docs/web-services).

Veja `AUDITORIA-DEPLOY.md` para resultados, pendências, checklist e instruções operacionais na ordem de publicação.
