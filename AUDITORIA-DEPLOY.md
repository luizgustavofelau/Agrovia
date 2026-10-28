# Atualização de execução e bcrypt — 28/10/2026

Esta atualização prevalece sobre as pendências históricas abaixo. Após autorização do usuário, migrations 002–005 foram aplicadas sem apagar registros, test-db confirmou schema pronto e uma conta TECNICO foi criada por seed transacional. Login HTTPS autorizado no Render retornou 200 com sucesso. O frontend institucional/CORS e CRUD integrados não foram validados.

Implementação local: bcrypt 6 com custo 12, seed e conversor atualizados, preservação de hashes bcrypt/scrypt, atualização automática de scrypt após login válido (até 72 bytes) e proteção contra truncamento UTF-8. A conta existente não foi regravada antes de publicar o novo backend. Foram aprovados 16 testes, incluindo fluxo HTTP de atualização scrypt → bcrypt usando pool de teste, sem banco real.

Arquivos desta mudança: backend/password.js, server.js, hash-passwords.js, seed.js, .env.example, package.json, package-lock.json, test/password.test.js, test/login-bcrypt.test.js, test/seed.test.js e documentação. Nenhum deploy, commit ou push executado.

# Histórico da auditoria anterior

# Auditoria de deploy — Agrovia

Revisão: 28/10/2026. Nenhum deploy, FTP, commit, push, alteração no Render/Hostinger, migration ou escrita no banco real foi realizado.

## A. Situação: NÃO PRONTO PARA DEPLOY EM PRODUÇÃO

O código e o artefato foram preparados e os testes locais passaram, mas o serviço público ainda não acessa o MySQL. A classificação refere-se à publicação funcional completa, não apenas à capacidade de gerar arquivos.

Verificação direta da API fornecida pelo usuário:

- `https://agrovia-sboe.onrender.com/health`: HTTP 200, `{"status":"ok"}`.
- `https://agrovia-sboe.onrender.com/api/health`: HTTP 503, `{"api":"ok","database":"unavailable","schema":"unknown"}`.
- A primeira tentativa de rede local foi bloqueada por EACCES; repetição autorizada confirmou os resultados acima. Nenhuma configuração externa foi alterada.
- O usuário relatou timeout no Render e posteriormente erro de sessão no login. O timeout sugere problema de endpoint/conectividade; não comprova senha incorreta. O erro de sessão pode ocorrer com `/api/api/login`; a URL efetiva daquela requisição não foi fornecida, portanto essa causa não está confirmada.
- Após converter o .env local, SELECT remoto funcionou a partir deste computador. A inspeção do schema encontrou 11 colunas ausentes. A primeira tentativa local recebeu EACCES; a repetição autorizada consultou somente SELECT/INFORMATION_SCHEMA.
- Falta informar a origem institucional para conferir CORS. Login, CRUD, hashes das contas, revisão completa do schema e Apache continuam pendentes de validação integrada.

## B. Problemas encontrados

| Nível | Problema | Tratamento / situação |
| --- | --- | --- |
| CRÍTICO | MySQL indisponível no serviço publicado | Confirmado pelo health público; depende de diagnóstico do ambiente com o responsável institucional. |
| CRÍTICO | Verificação de proprietário não cobria `/api/usuario/2/` e diferenças de maiúsculas aceitas pelo Express | Corrigida a expressão de correspondência; regressões verificam 403 com token de outro usuário. |
| CRÍTICO | Credencial de demonstração em versões históricas | Já removida do código atual; revogar/substituir se reutilizada. Histórico não reescrito. |
| IMPORTANTE | Build aceitava origem da API com `/api`, credenciais e HTTP remoto | Validação de origem explícita adicionada; rejeita caminhos, query e fragmento. |
| IMPORTANTE | Rotas públicas com barra final passavam pela autenticação | `/api/login/`, `/api/LOGIN` e variantes de health agora seguem o comportamento das rotas Express. |
| IMPORTANTE | Token anterior era enviado no login | Cliente deixa de enviar Authorization no login; POST e corpo preservados. |
| IMPORTANTE | `.env` local usava DB_HOST/DB_USER/DB_PASS/DB_NAME | Convertido para DATABASE_URL com os mesmos dados; variáveis locais ausentes completadas e segredo local gerado. |
| CRÍTICO | Schema remoto incompleto: 11 colunas ausentes | SELECT confirmou conexão local; scripts 002–005 precisam de revisão pelo responsável antes de aplicação manual. |
| IMPORTANTE | Dry-run de migrations dependia de credencial válida | Carregamento do pool adiado até execução efetiva; dry-run funciona sem banco. |
| IMPORTANTE | Diagnóstico de banco incentivava aplicar migrations sem revisão | Mensagem corrigida; falha de configuração é sanitizada e pool fecha quando criado. |
| IMPORTANTE | Contas legadas podem conter senha em texto puro | Produção exige scrypt; conversão manual somente após backup/revisão. Não executada. |
| MELHORIA | CRA e dependências transitivas depreciadas | Arquitetura preservada; instalação/build funcionaram. Não houve auditoria exaustiva de vulnerabilidades. |
| MELHORIA | Login sem rate limit; tokens em localStorage | Limitações existentes; proteção adicional e revisão de XSS recomendadas em tarefa própria. |

## C. Arquivos modificados nesta revisão

| Arquivo | Motivo |
| --- | --- |
| `backend/server.js` | Corrigir política de autenticação/proprietário para barra final e maiúsculas; registrar código sanitizado da falha de health MySQL. |
| `backend/test/deploy.test.js` | Testar variantes de login e impedir acesso ao perfil de outro usuário. |
| `backend/migrate.js` | Não criar pool durante dry-run. |
| `backend/test-db.js` | Capturar falha de configuração, fechar pool condicionalmente e exigir revisão antes de migrations. |
| `backend/.env.example` | Esclarecer host remoto e variáveis antigas não utilizadas. |
| `backend/.env` (ignorado pelo Git) | Converter dados de conexão existentes para DATABASE_URL e completar variáveis locais ausentes, sem expor credenciais. |
| `frontend/scripts/build.js` | Validar origem antes de compilar. |
| `frontend/scripts/validate-api-origin.js` | Validar origem HTTPS remota ou HTTP local sem caminhos/segredos. |
| `frontend/scripts/validate-api-origin.test.js` | Testar normalização e rejeição de configurações incorretas. |
| `frontend/src/services/http.ts` | Remover espaços da origem; não enviar token antigo no login; preservar Authorization explícito nas demais chamadas. |
| `frontend/.env.example` | Documentar origem sem `/api` e necessidade de novo build. |
| `frontend/.env` (ignorado pelo Git) | Criado com a URL pública fornecida pelo usuário; não contém segredo. |
| `README.md` | Atualizar URL real, diagnóstico e procedimentos. |
| `AUDITORIA-DEPLOY.md` | Substituir resultados antigos por evidência desta revisão e roteiro completo. |

`frontend/dist` foi regenerada e é ignorada pelo Git. Os lockfiles foram preservados; `npm ci` passou em ambos os diretórios.

## D. Frontend

- Frontend Directory: `frontend`.
- Framework: React 18 + TypeScript + Create React App 5. Não é Vite; nenhum framework foi substituído.
- Build Command: `npm run build`.
- Build Output: `frontend/dist`.
- Public Path: `/tecti/2026/gpec05/`.
- Vite Base: não aplicável; equivalente CRA é `homepage` no package.json.
- React Router Basename: `process.env.PUBLIC_URL`, derivado de homepage.
- `.htaccess` necessário: sim, fallback de BrowserRouter.
- Local: `frontend/public/.htaccess`, copiado e conferido em `frontend/dist/.htaccess`.
- Status do build: concluído com a URL real `https://agrovia-sboe.onrender.com`.
- Prévia HTTP: home, login, painel/campos, conta, imagem e assets JS/CSS retornaram 200. Bundle contém a URL real e não contém `api.example.invalid` ou `http://localhost:5000`.
- Imports relativos: sem divergências de capitalização encontradas. Não houve execução em Linux ou teste visual/interativo no Apache real.

## E. Backend

- Backend Directory / Root Directory: `backend`.
- Node Version: `24.x`; testes locais em `24.11.1`.
- Framework: Express 5, CommonJS; controllers e SQL no `server.js`, sem camada de ORM/models.
- Build Command: `npm ci`.
- Start Command: `npm start` → `node server.js`; não usa nodemon.
- Health Check: `/health` para processo; `/api/health` para banco e colunas esperadas.
- Port Configuration: `process.env.PORT`, padrão 5000, bind `0.0.0.0`.
- CORS Configuration: `FRONTEND_URL` somente origem; localhost:3000 também permitido fora de produção. Não usa cookies cross-site.
- Database Library: `mysql2/promise`.
- Autenticação: token próprio HMAC-SHA256, oito horas, Bearer; não é JWT. Scrypt obrigatório em produção; compatibilidade com senha legada apenas em desenvolvimento.
- SIGTERM/SIGINT fecham HTTP, agendador e pool, com limite de dez segundos. SMTP opcional; scheduler evita ciclos sobrepostos, mas depende de processo ativo.

## F. MySQL2

Conexão em `backend/db.js`, configuração em `backend/db-config.js`. Um pool compartilhado com cinco conexões, fila de 50 e connectTimeout de dez segundos. Variável obrigatória: DATABASE_URL. Não se criam conexões por requisição nem se encerra o pool após cada consulta.

Consultas de dados usam parâmetros `?`; identificadores dinâmicos das migrations são fixos nos SQL. Operações com getConnection liberam em finally. Exclusão lógica de fazenda usa transação/rollback; conversor de senhas também. DDL de migrations não é transacional e pode aplicar parcialmente: execução exclusivamente manual após revisão.

Scripts existentes, em ordem, em `backend/migrations`:

| Script | Estrutura documentada |
| --- | --- |
| 000_core_schema.sql | USUARIO, CULTURAS, FAZENDAS e DISPOSITIVOS, chaves e relacionamentos |
| 001_conta.sql | Nome do dispositivo e id_campo |
| 002_fazenda_detalhes.sql | Área, talhões, observações |
| 003_soft_delete_fazendas.sql | Exclusão lógica e índice |
| 004_soft_delete_dispositivos.sql | Exclusão lógica e unicidade de MAC ativo; substitui índice |
| 005_relatorios_automaticos.sql | RELATORIO_AUTOMATICO |

O schema check verifica colunas, não tipos, índices ou constraints. CREATE TABLE IF NOT EXISTS não corrige tabelas antigas. Nomes em maiúsculas devem corresponder exatamente no Linux. Os scripts documentam a estrutura esperada, não provam o estado da base remota. Não houve exportação de dados nem execução de migrations.

Logs e respostas não expõem conexão ou SQL. `/api/health` informa somente disponibilidade/schema; o log guarda o código do erro. TLS MySQL não está configurado explicitamente no pool e não foi validado com o provedor; confirmar exigências institucionais antes da liberação final, sem desabilitar validação de certificados.

Testes: SELECT real funcionou a partir deste computador após converter o .env; a inspeção retornou schema incompleto. A API no Render continua com banco indisponível. Testes automatizados simulam indisponibilidade e comprovam 503, não sucesso de conexão. Acesso local ou via phpMyAdmin não comprova conectividade a partir do Render.

Colunas ausentes confirmadas: RELATORIO_AUTOMATICO.id_usuario_fk, ativo, frequencia, proximo_envio e ultimo_envio; FAZENDAS.area_ha, qtd_talhoes, observacoes e deleted_at; DISPOSITIVOS.deleted_at e mac_address_ativo. Correspondem aos scripts 002–005, que NÃO foram executados.

## G. Variáveis de ambiente

| Ambiente | Variáveis utilizadas |
| --- | --- |
| Frontend local | REACT_APP_API_URL=http://localhost:5000 |
| Frontend produção | REACT_APP_API_URL=https://agrovia-sboe.onrender.com |
| Backend local | NODE_ENV=development, PORT=5000, DATABASE_URL, AUTH_TOKEN_SECRET, FRONTEND_URL=http://localhost:3000 |
| Backend Render | NODE_ENV=production, DATABASE_URL, AUTH_TOKEN_SECRET, FRONTEND_URL=origem institucional pendente |
| Backend opcional | TZ=America/Sao_Paulo; SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM somente para relatórios |

PORT é fornecido pelo Render. AUTH_TOKEN_SECRET deve ser aleatório, com ao menos 32 caracteres. DATABASE_URL usa `mysql://usuario:senha@host:3306/banco`, com usuário e senha percent-encoded. Não use URL do phpMyAdmin. Nenhum segredo vai no frontend. Use somente `.env` e `.env.example`; não existem variáveis VITE nem JWT_SECRET nesta aplicação.

## Segurança do versionamento e limites

Varredura heurística de literais em fontes de 27 commits locais: candidatos em backend/server.js e backend/db-config.js. db-config contém exemplo de formato; histórico de server contém a credencial de demonstração já documentada. Não foram impressos valores sensíveis. Revogar/substituir qualquer credencial histórica reutilizada; apagar o código atual não elimina exposição anterior.

A varredura não cobre todos os formatos de segredo, branches remotas não disponíveis, logs ou serviços externos. `.env` e dist são ignorados; `.env.example` permanece versionado. Nenhuma credencial real foi adicionada aos arquivos versionados.

## Checklist final e evidências

- [x] Dependências instaladas: npm ci nos dois projetos; lockfiles preservados.
- [x] Build concluído e dist gerada com a API real.
- [x] Caminho público, assets, Router e .htaccess conferidos.
- [x] URL da API configurável e validação contra /api duplicado.
- [x] Backend preparado para Render, porta configurável, npm start funcionando; health local 200 na porta de teste 15060.
- [x] CORS testado com origem permitida e origem não permitida.
- [x] MySQL2, pool, queries parametrizadas, transações e liberação revisados.
- [x] Tratamento de falha de banco e configuração revisado.
- [x] Estrutura SQL documentada; dry-run: seis arquivos, 65 instruções, nenhuma executada.
- [x] Quatro testes backend passaram, incluindo variantes de login, isolamento de perfil, hashes e banco indisponível.
- [x] Dois testes de origem da API passaram.
- [x] Imports relativos conferidos quanto à capitalização.
- [x] Nenhum ORM adicionado; nenhum dado apagado ou alterado.
- [x] Nenhuma nova credencial exposta; .env.example e README atualizados.
- [x] git diff --check sem erros de whitespace.
- [x] Instruções de deploy fornecidas para cada ambiente.
- [x] DATABASE_URL local configurada; SELECT remoto retornou resultado 2.
- [ ] Schema remoto completo: falhou; 11 colunas ausentes.
- [ ] Conectividade do Render: falhou; health público retornou 503.
- [ ] Contas legadas verificadas/convertidas, login e CRUD reais: não executados.
- [ ] Domínio institucional/CORS real: domínio ainda não informado.
- [ ] Fallback Apache, Linux e interação visual na hospedagem: não testados.
- [ ] SMTP e continuidade do scheduler: não testados; envios desativados nos testes locais.
- [ ] Revogação de credenciais históricas: responsabilidade do administrador, não comprovada.

# INSTRUÇÕES PARA FAZER O DEPLOY

## AMBIENTE 1 — DESENVOLVIMENTO LOCAL

1. Frontend: `.env` já criado com a API real. Para desenvolvimento com backend local, troque temporariamente por `REACT_APP_API_URL=http://localhost:5000`.
2. Backend: o `.env` local já foi convertido para DATABASE_URL com os mesmos dados e completado com NODE_ENV=development, PORT=5000, FRONTEND_URL=http://localhost:3000 e AUTH_TOKEN_SECRET aleatório. Não envie esse arquivo ao Git/FTP. Outros computadores devem configurar o próprio .env conforme .env.example.
3. Execute em terminais separados, a partir da raiz:

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
node --test scripts/validate-api-origin.test.js
npm start
```

4. Abra `http://localhost:3000/tecti/2026/gpec05/`. Resolva conexão, schema e contas antes de considerar login/CRUD validados.

## AMBIENTE 2 — BANCO MYSQL NA HOSTINGER

1. Use host remoto, porta, usuário, senha e nome do banco fornecidos pela instituição. Cadastre a mesma DATABASE_URL no Render; não utilize localhost nem a URL do painel administrativo.
2. Estrutura documentada nos seis SQL acima. Confira base existente, tipos/índices e maiúsculas antes de executar qualquer script. Faça backup pelo procedimento institucional.
3. Somente o responsável, após revisão, poderá executar `npm run db:migrate` se necessário. Nunca colocar migrations no build/start. O script 004 substitui índice e exige atenção especial.
4. `node hash-passwords.js` diagnostica contas legadas; usa transação e bloqueio de linhas, portanto execute em janela adequada. `--apply` converte senhas somente após revisão/backup; não foi executado nesta preparação.
5. Timeout: conferir endpoint e conectividade com o responsável institucional, sem alterar permissões da hospedagem nesta tarefa. Não atribuir o erro automaticamente à senha.
6. Confirmar `/api/health` com database=connected e schema=ready; depois validar leitura autenticada com conta autorizada.

## AMBIENTE 3 — RENDER

Após revisão, o responsável faz commit/push manualmente para a branch de publicação.

| Campo | Valor |
| --- | --- |
| Service Type | Web Service |
| Repository | https://github.com/luizgustavofelau/Agrovia |
| Branch | master, branch local atual; confirmar seleção no serviço existente |
| Root Directory | backend |
| Runtime | Node, 24.x em engines |
| Build Command | npm ci |
| Start Command | npm start |
| Health Check Path | /health |
| Environment Variables | NODE_ENV=production, DATABASE_URL, AUTH_TOKEN_SECRET, FRONTEND_URL |
| Auto Deploy | Manter desativado até concluir integração; habilitar depois conforme decisão do grupo |

FRONTEND_URL deve ser a origem HTTPS institucional sem subpasta nem barra final. Domínio ainda pendente. PORT é automático. SMTP é opcional e só deve ser ativado após revisão de assinaturas; TZ=America/Sao_Paulo pode ser definido para relatórios.

Testar `https://agrovia-sboe.onrender.com/health` e `/api/health`. Conferir logs sanitizados. Não considerar a API pronta apenas porque /health responde 200. Testar login POST /api/login com conta autorizada após resolver MySQL e hashes.

## AMBIENTE 4 — HOSTINGER / APACHE

1. Configurar `REACT_APP_API_URL=https://agrovia-sboe.onrender.com` no `.env` do frontend; não usar VITE_API_URL nem acrescentar /api.
2. Caminho público `/tecti/2026/gpec05/`; homepage e basename já preparados. Vite base não se aplica.
3. Dentro de frontend:

```powershell
npm ci
node --test scripts/validate-api-origin.test.js
npm run build
npm run preview
```

4. Conferir `http://localhost:4173/tecti/2026/gpec05/`.
5. No FileZilla, abrir `frontend/dist` e enviar TODO O CONTEÚDO, incluindo `.htaccess`, index.html, static/ e img/, ao diretório já atribuído ao grupo pela conta FTP. Não criar subpasta dist extra; não inventar caminho físico ou alterar permissões.
6. Não enviar .env, backend, node_modules, fontes ou .git. O .htaccess já está incluído e não deve ser recriado manualmente.
7. Testar na origem institucional real os caminhos `/tecti/2026/gpec05/`, `/tecti/2026/gpec05/login`, `/tecti/2026/gpec05/painel/` e `/tecti/2026/gpec05/conta`, incluindo F5. As duas últimas exigem sessão.

## AMBIENTE 5 — TESTE INTEGRADO

1. Conferir imagens, estilos, navegação interna e recarga F5.
2. Em Network, confirmar HTTPS e POST para `https://agrovia-sboe.onrender.com/api/login`, sem /api duplicado; rotas privadas devem enviar Bearer.
3. Validar autenticação, leitura MySQL e perfil de usuário correto. Confirmar rejeição de token inválido e acesso a dados de terceiros.
4. Em registros de teste autorizados, validar cadastros, edição de perfil e exclusões lógicas existentes. Não usar registros reais em testes destrutivos.
5. Conferir Console, Network e logs do Render; ausência de CORS/404/503 e health do banco saudável.
6. Se relatórios forem habilitados, validar SMTP e agendamento separadamente com consentimento dos destinatários.
7. Só concluir a publicação quando banco, hashes, CORS e fallback Apache estiverem comprovados.

## Complemento — correção das migrações em 28/10/2026

Após a auditoria acima, a consulta de metadados identificou duas incompatibilidades: a FK de relatórios assumia INT UNSIGNED, enquanto USUARIO.id_usuario é INT com sinal; o script 004 só reconhecia uq_dispositivos_mac, mas o índice real se chama mac_address.

Arquivos adicionais alterados: migrations/004_soft_delete_dispositivos.sql (identificação do índice por conteúdo e criação do substituto antes da remoção); migrations/005_relatorios_automaticos.sql (tipo da FK derivado da chave existente); migrate.js (seleção --from=002, rejeição de argumentos inválidos e contexto sanitizado de falha); test/migrations.test.js (dois testes); migrations/README.md (procedimento específico), além deste relatório e README principal.

Resultado atualizado: seis testes backend passaram; dry-run desde 002 lista quatro scripts e 55 instruções (total completo agora 69). SQL 005 preparado no servidor sem EXECUTE; identificação de índice legado confirmada e nenhum grupo MAC duplicado encontrado. Nenhuma tabela criada, dado alterado, índice removido ou migração aplicada. Aplicação em ambiente isolado não validada porque o daemon Docker não está disponível. As 11 colunas faltantes permanecem pendentes até aplicação manual autorizada após backup.

O banco é MariaDB 11.8.9 acessado por MySQL2. A tabela HISTORICO_UMIDADE e as colunas de última leitura existentes foram identificadas e permanecem intactas. O inventário SQL anterior descreve as tabelas esperadas pela API, não toda a estrutura institucional.

Procedimento concreto: [backend/migrations/README.md](backend/migrations/README.md). A classificação de produção permanece NÃO PRONTO enquanto migrations, conexão Render e integração não forem validadas.
