# Auditoria de deploy — Agrovia

Data: 22/10/2026. Nenhum deploy, FTP, commit, push, alteração de infraestrutura, migration ou escrita no banco real foi realizado.

## A. Situação: PRONTO COM PENDÊNCIAS

O código foi preparado, preservando CRA/React, Express e MySQL2. A publicação definitiva depende da URL real do Render, origem institucional, conexão remota, conferência do schema e conversão controlada das contas legadas para hash. A build de auditoria usa URL reservada de teste e **não deve ser enviada como versão final**.

## B. Problemas encontrados

| Nível | Problema e tratamento |
| --- | --- |
| CRÍTICO | Conta fixa autenticava sem banco: removida credencial e bloqueado fallback, com 503. Histórico continua contendo a antiga credencial; substituir se reutilizada. |
| CRÍTICO | Rotas de leitura/alteração aceitavam acesso sem token e IDs de terceiros: exigência de sessão e verificação de proprietário adicionadas. |
| CRÍTICO | Senhas em texto puro: produção exige scrypt; conversor manual preparado, mas **contas existentes ainda precisam ser verificadas/convertidas**. |
| IMPORTANTE | CORS aberto: substituído por origem explícita; origem local somente fora de produção. |
| IMPORTANTE | API relativa e imagens absolutas na raiz: cliente HTTP e PUBLIC_URL corrigidos. |
| IMPORTANTE | Sem basename/fallback Apache: homepage, Router e .htaccess ajustados ao grupo. |
| IMPORTANTE | Logs/erro de login divulgavam detalhes de banco: logs e respostas sanitizados. |
| IMPORTANTE | Schema check não incluía relatórios: incluído. |
| IMPORTANTE | Fila ilimitada no pool e ausência de shutdown: limites e fechamento adicionados. |
| IMPORTANTE | Agendador podia sobrepor ciclos: execução serial e encerramento adicionados. |
| IMPORTANTE | MySQL inacessível no teste: EACCES restrito; nova tentativa fora da restrição retornou ETIMEDOUT. Validar host/porta e conectividade no ambiente destino. |
| MELHORIA | Dependências legadas do CRA emitem avisos de depreciação. Framework preservado; modernização exige tarefa própria. |
| MELHORIA | Rate limit de login e revisão de dependências continuam recomendados; não houve auditoria de vulnerabilidades exaustiva. |

## C. Arquivos modificados

| Arquivo | Motivo |
| --- | --- |
| `.gitignore` | Ignora variantes locais de ambiente; remove referência obsoleta a ORM. |
| `README.md` | Arquitetura, segurança, banco e configurações exatas de publicação. |
| `backend/.env.example` | Documenta NODE_ENV, CORS, segredo de sessão e fuso, sem credenciais reais. |
| `backend/db-config.js` | Valida DATABASE_URL, decodifica credenciais e aplica porta padrão 3306 sem expor a URL em erros. |
| `backend/test/db-config.test.js` | Testa porta padrão/customizada, caracteres especiais e rejeição segura de URLs inválidas. |
| `backend/db.js` | Preserva pool MySQL2; limita conexões/fila, define timeout e remove log de configuração. |
| `backend/hash-passwords.js` | Conversão manual, transacional e opt-in de senhas legadas; não executada. |
| `backend/migrate.js` | Log de falha sem expor SQL/credenciais. |
| `backend/package-lock.json` | Sincroniza metadados de engines. |
| `backend/package.json` | Node 24.x, dev e testes; start continua Node sem nodemon. |
| `backend/password.js` | Geração e verificação de hash scrypt com crypto nativo. |
| `backend/report-scheduler.js` | Evita ciclos sobrepostos, permite parar/aguardar agendamento e sanitiza erros. |
| `backend/schema-check.js` | Inclui tabela de relatórios na conferência de colunas. |
| `backend/server.js` | CORS por origem, autenticação/posse, falha segura do banco, hash em produção, health e shutdown. |
| `backend/test-db.js` | Diagnóstico de conexão com log sanitizado. |
| `backend/test/deploy.test.js` | Regressões de autenticação, isolamento, CORS, health, falha do banco e hashes. |
| `frontend/.env.example` | Documenta REACT_APP_API_URL para o CRA existente. |
| `frontend/README.md` | Substitui instruções genéricas pelo fluxo real do projeto. |
| `frontend/package-lock.json` | Sincroniza engines com package.json. |
| `frontend/package.json` | Node 24.x, homepage do grupo, build para dist e preview. |
| `frontend/public/.htaccess` | Fallback SPA no caminho público do grupo. |
| `frontend/scripts/build.js` | Exige URL explícita da API e configura saída dist. |
| `frontend/scripts/preview.js` | Prévia HTTP local da build com subpasta e fallback. |
| `frontend/src/App.tsx` | BrowserRouter recebe PUBLIC_URL como basename. |
| `frontend/src/components/Campos.tsx` | Usa cliente HTTP centralizado para origem da API e token. |
| `frontend/src/components/Dashboard.tsx` | Usa cliente HTTP centralizado para origem da API e token. |
| `frontend/src/components/Login.tsx` | Cliente API configurável e imagens sob a subpasta. |
| `frontend/src/components/ParallaxDrops.tsx` | Imagens usam PUBLIC_URL. |
| `frontend/src/components/ReportAutomation.tsx` | Usa cliente HTTP centralizado para origem da API e token. |
| `frontend/src/content/agriculturalStudies.ts` | Imagens dos estudos usam PUBLIC_URL. |
| `frontend/src/pages/Conta.tsx` | Axios usa origem centralizada e token nas requisições. |
| `frontend/src/services/campos.api.ts` | Usa cliente HTTP centralizado para origem da API e token. |
| `frontend/src/services/dispositivos.api.ts` | Usa cliente HTTP centralizado para origem da API e token. |
| `frontend/src/services/http.ts` | Centraliza origem da API e envio do token. |
| `AUDITORIA-DEPLOY.md` | Relatório, resultados, checklist e roteiro operacional. |

## D. Frontend

- Frontend Directory: `frontend`.
- Framework: React 18 + TypeScript + Create React App 5; Vite não encontrado.
- Build Command: `npm run build`.
- Build Output: `frontend/dist`.
- Public Path: `/tecti/2026/gpec05/`.
- Vite Base: não aplicável; equivalente `homepage=/tecti/2026/gpec05/`.
- React Router Basename: `process.env.PUBLIC_URL`, resolvido como `/tecti/2026/gpec05`.
- .htaccess necessário: sim, `frontend/public/.htaccess`, copiado para `dist/.htaccess`.
- Status do build e prévia: build concluído; prévia HTTP passou em home, login, painel/campos, conta, imagem e assets JS/CSS. F5/fallback real do Apache e interação visual ainda dependem da hospedagem..
- Linux: imports relativos conferidos sem divergências de capitalização; não houve execução em Linux/Apache real.

## E. Backend

- Backend Directory / Root Directory: `backend`.
- Node Version: `24.x`; teste local em `24.11.1`, npm `11.13.0`.
- Framework: Express 5, JavaScript CommonJS.
- Build Command: `npm ci`; Start Command: `npm start` (`node server.js`).
- Health Check: `/health`; conexão/schema em `/api/health`.
- Port Configuration: `process.env.PORT`, padrão 5000, bind `0.0.0.0`.
- CORS Configuration: `FRONTEND_URL` sem caminho; localhost:3000 adicional em desenvolvimento.
- Database Library: MySQL2, sem ORM.

## F. MySQL2

Conexão em `backend/db.js`: `mysql2/promise.createPool`, compartilhado. `DATABASE_URL` obrigatória, no formato `mysql://usuario:senha@host/banco`; porta padrão 3306, ou `host:porta` quando necessário. Caracteres especiais de usuário/senha devem ser codificados na URL. Pool de cinco conexões, fila máxima 50 e connectTimeout 10s; adequação final ao limite contratado deve ser confirmada, sem mudar permissões.

Consultas de dados revisadas: parâmetros `?`, sem interpolação de valores de usuário no SQL. SQL dinâmico das migrations usa identificadores fixos, controlados pelo repositório. `pool.execute` faz checkout/release automaticamente. Exclusão de fazenda, migrador e conversor liberam conexões em finally. Há transação com rollback na exclusão e no conversor; o migrador DDL não é transacional e pode aplicar parcialmente em caso de erro, portanto requer revisão manual.

Scripts SQL 000–005 documentam cinco tabelas: USUARIO, CULTURAS, FAZENDAS, DISPOSITIVOS, RELATORIO_AUTOMATICO. O script 004 substitui um índice; não foi executado. `test-db` verifica colunas, não comprova tipos/índices/constraints de uma base já existente. Estrutura remota permanece pendente.

Testes: conexão real não validada (ETIMEDOUT), schema real não consultado, CRUD/login reais não executados. Teste com banco propositalmente indisponível passou. Nenhum dado foi alterado. TLS MySQL depende da configuração institucional já existente; não foi verificado nesta sessão.

## G. Variáveis de ambiente

| Ambiente | Variáveis |
| --- | --- |
| Frontend local | `REACT_APP_API_URL=http://localhost:5000` |
| Frontend produção | `REACT_APP_API_URL=<origem HTTPS real do Render>`; não usar VITE_API_URL, pois não é Vite |
| Backend local | `NODE_ENV=development`, `PORT=5000`, `DATABASE_URL`, `AUTH_TOKEN_SECRET`, `FRONTEND_URL=http://localhost:3000` |
| Backend Render | `NODE_ENV=production`, `DATABASE_URL`, `AUTH_TOKEN_SECRET` forte, `FRONTEND_URL=<origem institucional>`; PORT fornecido pelo Render |
| Backend opcional | `TZ=America/Sao_Paulo`; para relatórios `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |

Use somente `.env` e `.env.example`. O `.env` existente não foi alterado nem impresso. O projeto agora usa exclusivamente DATABASE_URL para conexão e AUTH_TOKEN_SECRET para sessões; as variáveis DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME não são mais lidas. Atualize também seu .env local.

## Verificações e checklist

- [x] Dependências instaladas com `npm ci` nos dois diretórios; locks sincronizados. A primeira instalação do frontend falhou por EACCES no registry; repetição autorizada concluiu (1313 pacotes).
- [x] `npm run build` concluiu com sucesso, gerando `frontend/dist`, usando `https://api.example.invalid` exclusivamente para validação.
- [x] Quatro referências de assets em index.html verificadas com subpasta e arquivos existentes; `.htaccess` idêntico ao original; bundle sem API localhost.
- [x] `npm run preview` iniciou; home, login, painel/campos, conta, imagem e JS/CSS retornaram HTTP 200. Teste HTTP, não validação visual/interativa em navegador.
- [x] `npm start` iniciou backend na porta de teste 15060 e `/health` retornou status ok; SMTP desativado no teste.
- [x] `npm test`: quatro testes passaram (incluindo DATABASE_URL), abrangendo senha válida/inválida, hash inválido, legado bloqueado, health, CORS, 401, 403 e 503 sem banco.
- [x] `npm run db:migrate -- --dry-run`: seis scripts, 65 instruções inspecionadas sem execução.
- [x] Imports relativos conferidos sem problemas de capitalização; `git diff --check` sem erros.
- [ ] `npm run test-db`: falhou com EACCES na restrição; nova tentativa autorizada falhou com ETIMEDOUT. SELECT/schema remotos não validados.
- [ ] Login/CRUD reais, conversão de senhas, envio SMTP e teste integrado: não executados.
- [ ] Execução em Linux e fallback Apache real: não disponíveis nesta sessão.

- [x] Caminho público configurado; assets e Router preparados para subpasta.
- [x] .htaccess preparado para inclusão automática.
- [x] URL da API configurável; backend preparado para Render e porta configurável.
- [x] CORS configurado e testado; MySQL2 preservado.
- [x] Configuração de conexão, pool, queries, parâmetros e tratamento de erros revisados.
- [x] Estrutura SQL documentada e pendência de conferência remota indicada.
- [x] Nenhum comando de ORM incluído; nenhum dado apagado ou modificado no banco real.
- [x] Nenhuma nova credencial real adicionada; antiga credencial removida do código atual.
- [ ] Eliminar risco de credenciais históricas: substituir/revogar qualquer valor reutilizado.
- [x] .env.example e README atualizados; instruções por ambiente fornecidas.
- [ ] Conexão MySQL/schema e login/CRUD reais validados.
- [ ] Contas legadas convertidas/provisionadas com hashes.
- [ ] URL real da API e origem institucional configuradas; build final gerada.
- [ ] Fallback e integração validados no Apache/Render reais.

Histórico: varredura heurística de literais em 24 commits locais, com achado em backend/server.js (credencial de demonstração). Não representa garantia de ausência de segredos em branches remotas não disponíveis, logs externos ou todos os formatos possíveis. Nenhum valor sensível foi reproduzido no relatório.

# INSTRUÇÕES PARA FAZER O DEPLOY

## AMBIENTE 1 — DESENVOLVIMENTO LOCAL

1. Crie `.env` a partir de `.env.example` **somente se não existir**. Preserve o arquivo existente.
2. Frontend: `REACT_APP_API_URL=http://localhost:5000`.
3. Backend: preencha DATABASE_URL, PORT=5000, NODE_ENV=development, FRONTEND_URL=http://localhost:3000 e AUTH_TOKEN_SECRET aleatório.
4. Instale e execute em terminais separados (comandos PowerShell a partir da raiz):

```powershell
cd backend
npm ci
npm test
npm run test-db
npm run db:migrate -- --dry-run
npm start
```

```powershell
cd frontend
npm ci
npm start
```

Abra `http://localhost:3000/tecti/2026/gpec05/`. Para a build local:

```powershell
cd frontend
npm run build
npm run preview
```

Abra `http://localhost:4173/tecti/2026/gpec05/`. O frontend não tinha testes automatizados próprios; o backend agora possui `npm test`. Resolver conexão, hashes, domínio institucional e URL Render antes da publicação final.

## AMBIENTE 2 — BANCO MYSQL NA HOSTINGER

1. Use host, porta, usuário, senha e banco fornecidos pela instituição; reúna esses valores em DATABASE_URL no Render.
2. Confira o schema com `npm run test-db`; revise os SQL 000–005 e a estrutura real.
3. Após backup e revisão, somente se necessário, aplique manualmente `npm run db:migrate`. Não crie/recrie banco, não altere permissões e não coloque esse comando no startup.
4. Diagnostique contas legadas com `node hash-passwords.js`. Após revisão e backup, execute manualmente `node hash-passwords.js --apply` para conversão. A auditoria não executou esses comandos sobre dados reais.
5. Confirme `/api/health` com database=connected e schema=ready; confirme também leitura autenticada. Não considere `/health` prova de acesso ao MySQL.

## AMBIENTE 3 — RENDER

Antes, revise as alterações e faça você mesmo o commit/push para a branch escolhida. Esta auditoria não os executa.

- Service Type: **Web Service**.
- Repository: **https://github.com/luizgustavofelau/Agrovia**.
- Branch: **master**, branch encontrada; confirmar decisão de publicação.
- Root Directory: **backend**.
- Runtime: **Node**, engines **24.x**.
- Build Command: **npm ci**.
- Start Command: **npm start**.
- Environment Variables: **NODE_ENV=production, DATABASE_URL, AUTH_TOKEN_SECRET, FRONTEND_URL**. PORT vem do Render. Opcionais: TZ e SMTP conforme seção G.
- Health Check Path: **/health**.
- Auto Deploy: **desativado durante validação inicial**.

Teste a URL real do serviço com `/health` e `/api/health`. Confirme os logs sem credenciais, login com conta autorizada e leitura de dados. Guarde a origem HTTPS real para o build do frontend.

## AMBIENTE 4 — HOSTINGER / APACHE

1. No `frontend/.env`, coloque a origem HTTPS real do Render em **REACT_APP_API_URL**. `VITE_API_URL` não se aplica ao CRA existente.
2. Caminho público: **/tecti/2026/gpec05/**. Base equivalente: homepage do package.json. Router: basename derivado de PUBLIC_URL.
3. Execute:

```powershell
cd frontend
npm ci
npm run build
npm run preview
```

4. Confira imagens, login e rotas na prévia. Gere novamente se mudar a URL da API.
5. No FileZilla, abra localmente **frontend/dist**; envie **todo o conteúdo**, inclusive **.htaccess**, ao diretório do grupo já apresentado pela conta FTP. Não invente caminho físico e não crie pasta dist adicional.
6. Não envie backend, node_modules, .env, código-fonte ou .git. Não altere permissões.
7. Teste, sob a origem institucional real: `/tecti/2026/gpec05/`, `/tecti/2026/gpec05/login`, `/tecti/2026/gpec05/painel/` e `/tecti/2026/gpec05/conta`. As duas últimas exigem sessão. Atualize cada rota com F5.

## AMBIENTE 5 — TESTE INTEGRADO

1. Abra o frontend publicado e confira imagens e estilos.
2. Navegue por rotas internas e recarregue com F5.
3. No Network, confirme chamadas HTTPS para o Render e cabeçalho Authorization nas rotas privadas.
4. Teste autenticação com conta autorizada e verifique leituras do MySQL.
5. Em registros de teste autorizados, confira cadastro, edição e exclusão lógica existentes; nunca use dados reais para testes destrutivos.
6. Confira Console, Network e logs do Render, ausência de erros CORS/404/conexão e resposta saudável de `/api/health`.
7. Se ativar SMTP, confirme consentimento das contas, configuração de envio e comportamento do serviço durante períodos de inatividade. Agendamento depende de processo em execução; não foi validado em produção.
