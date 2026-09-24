# 📊 Relatório de Análise do Projeto

## 1. 🏗️ Identificação e visão geral

- **Nome do projeto:** Agrovia / AgroVia
- **Objetivo identificado:** sistema de irrigação inteligente para monitoramento agrícola e apoio ao controle de irrigação.
- **Problema que o sistema pretende resolver:** acompanhamento de umidade, temperatura e condições climáticas para orientar decisões de irrigação em pequenas propriedades.
- **Funcionalidades do MVP descritas:**
  - landing page institucional do AgroVia;
  - login de usuário;
  - painel protegido;
  - monitoramento simulado de sensores de umidade e temperatura;
  - controle visual/manual de bomba d'água;
  - consulta de previsão do tempo por API externa;
  - dicas de irrigação a partir de clima e umidade.
- **Tecnologias principais:**
  - Node.js
  - Express
  - MySQL via `mysql2`
  - React
  - TypeScript
  - Tailwind CSS
  - React Router DOM
  - WeatherAPI externa
- **Linguagens utilizadas:**
  - JavaScript
  - TypeScript
  - CSS
  - HTML

### Evidências consultadas

- `frontend/README.md` — identifica o frontend React do sistema Agrovia e lista tecnologias.
- `frontend/src/components/ParallaxDrops.tsx` — descreve o produto como irrigação inteligente, ESP32, IoT e agronegócio.
- `frontend/src/components/Dashboard.tsx` — contém painel com sensores simulados, bomba d'água, clima e culturas monitoradas.
- `frontend/src/components/Login.tsx` — implementa formulário de login com chamada para `/api/login`.
- `backend/package.json` — identifica o backend como `agrovia-backend`.
- `backend/server.js` — configura servidor Express e rota `POST /api/login`.

## 2. 📂 Organização do repositório

```text
Agrovia/
├── .gitignore
├── PROMPT_ANALISE_REPOSITORIO_AV2_PIS.md
├── RELATORIO_ANALISE.md
├── backend/
│   ├── db.js
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── test-db.js
└── frontend/
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── css/
    ├── js/
    ├── public/
    │   ├── index.html
    │   └── img/
    └── src/
        ├── App.tsx
        ├── index.css
        ├── index.tsx
        ├── components/
        └── styles/
```

### Responsabilidade das pastas

- `backend` — servidor Node.js/Express, conexão MySQL e teste de conexão.
- `frontend` — aplicação React, componentes, estilos, configuração Tailwind e arquivos públicos.
- `frontend/src/components` — componentes principais da aplicação React.
- `frontend/src/styles` — CSS específico de landing page e login.
- `frontend/public/img` — imagens usadas pela interface.
- `frontend/js` e `frontend/css` — arquivos JavaScript/CSS estáticos aparentemente legados ou paralelos ao React.

### Análise da organização

- Separação entre frontend e backend: adequada em nível de pastas, com diretórios distintos.
- Nomes de pastas e arquivos: parcialmente adequados; `backend` e `frontend` são claros, mas há coexistência de React em `src` e arquivos estáticos em `frontend/js` e `frontend/css`, o que reduz a clareza sobre o fluxo principal.
- Arquivos de configuração: há `package.json` separados, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json` e `.gitignore`.
- Organização mínima do projeto: atende parcialmente; existe divisão frontend/backend, mas o backend não está organizado em rotas, controllers, services ou camada específica de banco além de `db.js`.

## 3. 📘 README e documentação inicial

**Localização:** `frontend/README.md`

| Item esperado | Situação | Evidência |
|---|---|---|
| Nome do projeto | Atende | `frontend/README.md` informa "Agrovia Frontend - React". |
| Problema que o sistema resolve | Não atende | O README apenas informa que é o frontend React do sistema. |
| Objetivo do projeto | Parcial | `frontend/README.md` descreve o frontend, mas não detalha o objetivo do sistema completo. |
| Funcionalidades do MVP | Parcial | `frontend/README.md` cita `ParallaxDrops` e `Login`, mas não descreve o MVP completo. |
| Tecnologias utilizadas | Atende | `frontend/README.md` lista React, TypeScript, Framer Motion, Tailwind CSS e React Router DOM. |
| Instruções para execução local | Parcial | `frontend/README.md` mostra instalação e execução do frontend, mas não do backend. |
| Divisão entre frontend, backend e banco | Não atende | Não há README raiz nem documentação integrada das camadas. |

### Histórico de commits e participação

- Histórico disponível para análise: Sim.
- Participação dos integrantes identificável: Parcial.
- Evidências: `git log --oneline --decorate --all -n 30` mostrou 8 commits recentes. `git shortlog -sne --all` identificou 7 commits para `Luiz Gustavo <l.gu95343@gmail.com>` e 1 commit para `EA - Luiz Gustavo Antas Gomes <gustavo_antas@educadventista.org>`. Não há documentação de divisão de tarefas por integrante.

> Não foi atribuída autoria individual de funcionalidades específicas, pois o relatório não analisou diffs por arquivo com comprovação suficiente para isso.

### Professor como colaborador

**Situação:** NÃO VERIFICÁVEL PELO REPOSITÓRIO

## 4. ⚙️ Backend

- **Localização:** `backend`
- **Linguagem:** JavaScript
- **Framework principal:** Express
- **Arquivo de inicialização:** `backend/server.js`
- **Servidor configurado:** Sim

### Estrutura identificada

- `backend/server.js` — inicializa Express, CORS, JSON body parser e rota de login.
- `backend/db.js` — configura pool de conexão MySQL com `mysql2/promise`.
- `backend/test-db.js` — testa conexão ao banco com consulta `SELECT 1 + 1 AS result`.
- `backend/package.json` — dependências e scripts do backend.

### Organização interna

- Rotas: existem diretamente em `backend/server.js`.
- Controllers: NÃO IDENTIFICADO.
- Services: NÃO IDENTIFICADO.
- Middlewares: uso básico de `cors()` e `express.json()` em `backend/server.js`.
- Configuração do banco: `backend/db.js`.
- Validações: validação simples de `email` e `senha` obrigatórios em `backend/server.js`.
- Tratamento de erros: tratamento simples em `backend/server.js`, com resposta JSON para falha de login e erro interno.

### Funcionalidades implementadas

- Login por e-mail e senha consultando a tabela `USUARIO` — Evidência: `backend/server.js`.
- Conexão MySQL via pool — Evidência: `backend/db.js`.
- Teste de conexão ao banco — Evidência: `backend/test-db.js`.

### Fluxo das requisições

```text
requisição POST /api/login → função inline em backend/server.js → pool.execute com SQL direto → banco MySQL → resposta JSON
```

O fluxo não passa por Prisma. Também não há rota/controller separado. O fluxo comprovado é restrito ao login.

## 5. 🗄️ Banco de dados e Prisma ORM

- **Tipo de banco:** MySQL
- **ORM:** NÃO IDENTIFICADO
- **Configuração principal:** `backend/db.js`
- **Schema Prisma:** NÃO IDENTIFICADO
- **Migrations:** Não
- **Localização das migrations:** NÃO IDENTIFICADO

### Models ou entidades identificadas

- `USUARIO` — entidade inferida a partir da consulta SQL em `backend/server.js`; campos usados: `email`, `senha`, `nome`, `tipo_usuario`. Não há schema SQL ou Prisma no repositório que defina formalmente a tabela.

### Modelagem

| Elemento | Situação | Evidência |
|---|---|---|
| Models principais definidos | Não atende | Não há `schema.prisma`, migration ou SQL de criação de tabelas. |
| Chaves primárias | Não atende | NÃO IDENTIFICADO. |
| Chaves estrangeiras e relações | Não atende | NÃO IDENTIFICADO. |
| Campos coerentes com o domínio | Parcial | `backend/server.js` usa campos de usuário, mas não há modelagem completa do domínio agrícola. |
| Prisma Client utilizado no backend | Não atende | Não há dependência `@prisma/client` ou uso de `PrismaClient`. |
| Operação real de banco em rota/controller | Parcial | `backend/server.js` executa SQL real via `mysql2`, não via Prisma. |

### Operações Prisma encontradas

- `findMany`, `findUnique` ou equivalente: NÃO IDENTIFICADO.
- `create`: NÃO IDENTIFICADO.
- `update`: NÃO IDENTIFICADO.
- `delete`: NÃO IDENTIFICADO.
- Outras operações: NÃO IDENTIFICADO.

### Banco no servidor de produção

A existência de variáveis de ambiente usadas em `backend/db.js` indica preparação para conexão MySQL, mas não comprova criação do banco no servidor.

**Situação:** NÃO VERIFICÁVEL PELO REPOSITÓRIO

## 6. 🌐 Rotas da API e arquivo do Insomnia

### Rotas encontradas no backend

| Método | Endpoint | Arquivo | Operação realizada | Usa Prisma |
|---|---|---|---|---|
| POST | `/api/login` | `backend/server.js` | Recebe `email` e `senha`, consulta `USUARIO` por e-mail e retorna sucesso ou erro em JSON. | Não |

### Adequação das rotas

- Uso dos métodos HTTP: adequado para login via `POST`.
- Organização por funcionalidade: parcial, pois a rota está inline em `server.js`.
- Clareza dos nomes: `/api/login` é claro.
- Existência de parâmetros: usa corpo JSON com `email` e `senha`.
- Recebimento de JSON: configurado com `express.json()`.
- Respostas em JSON: sim.
- Relação com o MVP: cobre autenticação inicial para acesso ao painel, mas não há rotas para sensores, fazendas, culturas, irrigação ou dashboard.

### Arquivo exportado do Insomnia

- **Arquivo encontrado:** NÃO IDENTIFICADO
- **Formato:** NÃO IDENTIFICADO
- **Rotas organizadas por funcionalidade:** Não
- **Nomes claros nas requisições:** Não
- **Exemplos de corpo JSON:** Não
- **Parâmetros e variáveis configurados:** Não
- **Compatibilidade com as rotas do backend:** Não

Não foi encontrado arquivo exportado do Insomnia ou coleção equivalente no repositório.

## 7. 🎨 Frontend

- **Localização:** `frontend`
- **Framework:** React
- **Linguagem:** TypeScript, com arquivos JavaScript legados em `frontend/js`
- **Ferramenta de criação/build:** Create React App (`react-scripts`)
- **Tailwind CSS:** Configurado e utilizado
- **Roteamento:** `react-router-dom`

### Arquivos principais

- `frontend/src/index.tsx` — ponto de montagem da aplicação React.
- `frontend/src/App.tsx` — define rotas `/`, `/login`, `/painel` e redirecionamento padrão.
- `frontend/src/components/ParallaxDrops.tsx` — landing page do AgroVia.
- `frontend/src/components/Login.tsx` — tela de login com chamada HTTP para o backend.
- `frontend/src/components/Dashboard.tsx` — painel com sensores simulados, bomba, clima e culturas.
- `frontend/src/components/PrivateRoute.tsx` — proteção simples por `localStorage`.
- `frontend/src/index.css` — importa Tailwind e define utilitários visuais.
- `frontend/tailwind.config.js` — configura caminhos, cores, fontes e extensões de tema.

### Páginas e componentes

- `ParallaxDrops` — landing page com navegação, hero, seções informativas e CTA para login.
- `Login` — formulário de autenticação.
- `Dashboard` — painel com cards de sensores simulados, clima, controle de bomba e culturas monitoradas.
- `PrivateRoute` — bloqueia `/painel` quando não há usuário no `localStorage`.

### Análise do desenvolvimento inicial

| Elemento | Situação | Evidência |
|---|---|---|
| Projeto React iniciado | Atende | `frontend/src/index.tsx`, `frontend/src/App.tsx`, `frontend/package.json`. |
| Uso de JavaScript | Parcial | Há JavaScript no backend e em `frontend/js`, mas o frontend principal usa TypeScript. |
| Tailwind configurado ou utilizado | Atende | `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/index.css`. |
| Telas principais iniciadas | Atende | `ParallaxDrops`, `Login`, `Dashboard`. |
| Componentes organizados | Parcial | Componentes principais estão em `src/components`, mas há arquivos legados em `frontend/js` e `frontend/css`. |
| Navegação entre páginas | Atende | `frontend/src/App.tsx` usa `react-router-dom`. |
| Tela conectada ou preparada para API | Atende | `frontend/src/components/Login.tsx` chama `/api/login`. |

O uso de TypeScript é divergente da orientação "React, JavaScript e Tailwind", mas o projeto contém JavaScript no backend e arquivos estáticos. O frontend React principal está em TypeScript.

## 8. 🔗 Conexão entre frontend e backend

- **Tipo de comunicação:** REST
- **Cliente HTTP:** Fetch
- **Arquivo de configuração da API:** NÃO IDENTIFICADO
- **URL base:** proxy `http://localhost:5000` em `frontend/package.json`; chamada relativa `/api/login` em `frontend/src/components/Login.tsx`
- **Variáveis de ambiente:** `.env` está ignorado em `.gitignore`; não foi encontrado `.env.example`
- **CORS no backend:** Configurado em `backend/server.js`
- **Proxy no frontend:** Configurado em `frontend/package.json`

### Endpoints consumidos pelo frontend

| Endpoint | Método | Componente ou página | Finalidade | Compatível com o backend |
|---|---|---|---|---|
| `/api/login` | POST | `frontend/src/components/Login.tsx` | Enviar e-mail e senha para autenticação. | Sim |
| `http://localhost:5000/api/login` | POST | `frontend/js/login.js` | Login em arquivo JavaScript estático legado. | Sim, mas não comprovado como parte do fluxo React atual |
| `http://localhost:5000/api/fazenda-status` | GET | `frontend/js/script.js` | Buscar status da fazenda em arquivo legado. | Não |
| `http://localhost:3000/api/fazendas` | GET | `frontend/js/script.js` | Buscar fazendas em arquivo legado. | Não |
| API externa de clima | GET | `frontend/src/components/Dashboard.tsx` e `frontend/js/script.js` | Buscar previsão/condição climática. | Não aplicável ao backend |

### Fluxos comprovados

- Tela de login envia `email` e `senha` por `POST /api/login` e, em caso de sucesso, salva dados no `localStorage` e redireciona para `/painel`.
- Rota `/painel` é protegida por `PrivateRoute`, que verifica `usuarioNome` no `localStorage`.
- Dashboard consome API externa de clima e simula sensores localmente; não há consumo de dados agrícolas vindos do backend.

### Estado da integração

**Classificação:** Parcial.

Há comunicação coerente entre frontend e backend para login. A integração não cobre os dados principais do painel, sensores, culturas, bomba ou status de fazenda. Arquivos em `frontend/js` referenciam endpoints não implementados no backend.

## 9. ✅ O que já está implementado

### Backend

- Servidor Express com CORS e JSON body parser.
- Rota `POST /api/login`.
- Consulta MySQL direta para validar usuário.
- Respostas JSON para sucesso, credenciais inválidas e erros.
- Script de teste de conexão ao banco.

### Banco de dados

- Configuração de conexão MySQL por variáveis de ambiente em `backend/db.js`.
- Uso real de consulta SQL na rota de login.

### Frontend

- Aplicação React iniciada com Create React App.
- Roteamento entre landing page, login e painel.
- Landing page institucional.
- Tela de login.
- Dashboard visual com sensores simulados, clima externo, bomba e culturas.
- Tailwind configurado e usado em classes/utilitários.

### Integração

- Login React integrado ao endpoint `/api/login`.
- Proxy do frontend para `http://localhost:5000`.
- CORS no backend.

## 10. 🚧 O que está incompleto ou em desenvolvimento

- Prisma ORM não encontrado.
  - **Evidência:** ausência de `schema.prisma`, migrations e dependências `prisma`/`@prisma/client` em `backend/package.json`.
  - **Estado observado:** o backend usa `mysql2` e SQL direto.

- Modelagem do banco não documentada no repositório.
  - **Evidência:** não há migrations, SQL de criação ou schema ORM.
  - **Estado observado:** apenas a tabela `USUARIO` é inferida pela consulta de login.

- Arquivo exportado do Insomnia não encontrado.
  - **Evidência:** busca por arquivos relacionados a Insomnia/coleções não retornou entrega.
  - **Estado observado:** não há coleção de requisições no repositório.

- Backend sem organização em camadas.
  - **Evidência:** `backend/server.js`.
  - **Estado observado:** rota, validação, consulta e resposta ficam no mesmo arquivo.

- Dashboard sem integração com backend para dados agrícolas.
  - **Evidência:** `frontend/src/components/Dashboard.tsx`.
  - **Estado observado:** sensores são simulados localmente e clima vem de API externa.

- Endpoints referenciados em arquivos legados não existem no backend.
  - **Evidência:** `frontend/js/script.js` referencia `/api/fazendas` e `/api/fazenda-status`; `backend/server.js` contém apenas `/api/login`.
  - **Estado observado:** incompatibilidade parcial entre scripts estáticos e backend.

- README raiz não encontrado.
  - **Evidência:** existe apenas `frontend/README.md`.
  - **Estado observado:** documentação do projeto completo, backend e banco não está consolidada.

- Variáveis de ambiente de exemplo não encontradas.
  - **Evidência:** `.gitignore` ignora `.env`, mas não há `.env.example`.
  - **Estado observado:** configuração necessária ao backend não está documentada por arquivo de exemplo.

## 11. 📦 Dependências principais

### Backend

| Dependência | Versão | Finalidade identificada |
|---|---:|---|
| `express` | `^5.2.1` | Servidor HTTP e rotas da API. |
| `cors` | `^2.8.6` | Liberação de CORS. |
| `dotenv` | `^17.4.2` | Carregamento de variáveis de ambiente. |
| `mysql2` | `^3.18.2` | Conexão MySQL com promises. |
| `@react-spring/parallax` | `^10.0.3` | Dependência listada no backend, sem uso identificado no backend. |

### Frontend

| Dependência | Versão | Finalidade identificada |
|---|---:|---|
| `react` | `^18.2.0` | Biblioteca principal da interface. |
| `react-dom` | `^18.2.0` | Renderização React no DOM. |
| `react-router-dom` | `^6.8.0` | Roteamento SPA. |
| `tailwindcss` | `^3.2.7` | Estilização utilitária. |
| `typescript` | `^4.9.5` | Tipagem e arquivos `.tsx`. |
| `framer-motion` | `^10.12.16` | Animações; dependência listada, uso não comprovado nos arquivos principais lidos. |
| `web-vitals` | `^2.1.4` | Métricas de frontend; uso direto não identificado. |
| `@types/node` | `^16.18.0` | Tipagens. |
| `@types/react` | `^18.0.0` | Tipagens React. |
| `@types/react-dom` | `^18.0.0` | Tipagens React DOM. |
| `react-scripts` | `5.0.1` | Scripts de build/dev/test do Create React App. |
| `postcss` | `^8.4.21` | Processamento CSS. |
| `autoprefixer` | `^10.4.14` | Prefixos CSS via PostCSS. |

## 12. 🧭 Arquitetura e padrões identificados

- **Arquitetura predominante:** estrutura simples com frontend SPA e backend monolítico em arquivo único.
- **Separação de responsabilidades:** parcial; há separação física entre frontend e backend, mas o backend concentra rota, regra de login e acesso ao banco em `server.js`.
- **Padrões identificados:** SPA React com rotas protegidas por `localStorage`; backend Express com conexão MySQL por pool; estilos combinando Tailwind, CSS global e CSS por tela.
- **Consistência entre os módulos:** parcial; o fluxo React atual está mais consistente que os arquivos estáticos em `frontend/js`, que citam endpoints não implementados.

# 13. 📝 Avaliação conforme os critérios da AV2

## Regras de pontuação

A pontuação abaixo considera apenas evidências encontradas no repositório. Itens dependentes de apresentação, GitHub remoto, banco em produção ou colaboração do professor foram marcados como não verificáveis quando aplicável.

## Quadro avaliativo

| Critério | Valor máximo | Nota atribuída | Evidências e justificativa |
|---|---:|---:|---|
| Organização do repositório, README e professor como colaborador | 1,5 | 0,9 | Estrutura frontend/backend existe e é clara. README existe apenas no frontend e é incompleto para o projeto total. Professor como colaborador: NÃO VERIFICÁVEL PELO REPOSITÓRIO. |
| Banco de dados criado e coerente com o MVP | 2,0 | 0,4 | Há configuração MySQL e uso da tabela `USUARIO` na rota de login, mas não há schema, migrations, SQL de criação, relações ou modelagem do domínio do MVP. Banco em produção não verificável. |
| Arquivo exportado do Insomnia com as rotas organizadas | 1,5 | 0,0 | Arquivo exportado do Insomnia não encontrado. |
| Backend iniciado com integração ao banco usando Prisma ORM | 2,0 | 0,8 | Backend Express iniciado e integrado ao banco por `mysql2`, com rota real de login. Não usa Prisma ORM. |
| Frontend iniciado em React, JavaScript e Tailwind | 1,5 | 1,1 | React iniciado, Tailwind configurado e telas criadas. O frontend principal usa TypeScript, não JavaScript, embora haja JS em arquivos legados e backend. |
| Conexão inicial entre frontend e backend | 1,0 | 0,7 | Login React chama `/api/login`, compatível com backend, com proxy configurado. Integração não cobre dashboard/sensores. |
| Clareza na apresentação e divisão de tarefas do grupo | 0,5 | NÃO VERIFICÁVEL | Histórico local mostra autores, mas não comprova divisão de tarefas nem apresentação. |
| **Total verificável no repositório** | **10,0** | **3,9** | Soma dos itens com pontuação verificável; o item de apresentação permanece a definir. |

### Observação sobre o total

- **Pontuação obtida nos itens verificáveis:** 3,9
- **Pontos dependentes de apresentação ou verificação externa:** 0,5
- **Nota máxima que pode ser confirmada apenas pelo repositório:** 9,5

Não foi transformado automaticamente o critério de apresentação/divisão de tarefas em zero, pois depende de demonstração externa.

## 14. 📌 Síntese por critério

### 14.1 Organização do repositório e README — máximo 1,5

- **Situação:** Parcial
- **Evidências:** `backend`, `frontend`, `frontend/README.md`, `.gitignore`.
- **Aspectos comprovados:** separação entre frontend e backend; frontend documentado de forma básica.
- **Aspectos ausentes:** README raiz, instruções do backend, documentação do banco, explicação completa do MVP.
- **Aspectos não verificáveis:** professor como colaborador.
- **Nota sugerida:** 0,9/1,5

### 14.2 Banco de dados e coerência com o MVP — máximo 2,0

- **Situação:** Parcial
- **Evidências:** `backend/db.js`, `backend/server.js`, `backend/test-db.js`.
- **Models/tabelas principais:** `USUARIO` inferida pela consulta SQL; sem definição formal no repositório.
- **Coerência com o MVP:** login se relaciona ao acesso ao sistema, mas não há modelagem comprovada para sensores, fazendas, culturas, leituras ou irrigação.
- **Criação no servidor de produção:** Não verificável.
- **Nota sugerida:** 0,4/2,0

### 14.3 Insomnia e organização das rotas — máximo 1,5

- **Situação:** Não atende
- **Evidências:** busca por arquivos de Insomnia/coleções não identificou entrega.
- **Organização das requisições:** NÃO IDENTIFICADO.
- **Compatibilidade com o backend:** NÃO IDENTIFICADO.
- **Nota sugerida:** 0,0/1,5

### 14.4 Backend com Prisma ORM — máximo 2,0

- **Situação:** Parcial
- **Evidências:** `backend/package.json`, `backend/server.js`, `backend/db.js`.
- **Servidor Node.js/Express:** configurado e iniciado em `backend/server.js`.
- **Prisma configurado:** NÃO IDENTIFICADO.
- **Operação no banco:** consulta SQL direta com `pool.execute`.
- **Resposta em JSON:** sim, na rota `/api/login`.
- **Nota sugerida:** 0,8/2,0

### 14.5 Frontend com React, JavaScript e Tailwind — máximo 1,5

- **Situação:** Parcial
- **Evidências:** `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/components`, `frontend/tailwind.config.js`, `frontend/src/index.css`.
- **React iniciado:** sim.
- **JavaScript:** o frontend principal está em TypeScript; há JavaScript em arquivos estáticos e no backend.
- **Tailwind:** configurado e utilizado.
- **Telas e componentes:** landing page, login, dashboard e rota protegida.
- **Nota sugerida:** 1,1/1,5

### 14.6 Conexão frontend-backend — máximo 1,0

- **Situação:** Parcial
- **Evidências:** `frontend/src/components/Login.tsx`, `frontend/package.json`, `backend/server.js`.
- **Fluxo identificado:** login envia `POST /api/login`, backend consulta MySQL e retorna JSON; frontend salva usuário e navega para `/painel`.
- **Compatibilidade das rotas e dados:** compatível no login; incompleta para dashboard e endpoints legados.
- **Nota sugerida:** 0,7/1,0

### 14.7 Apresentação e divisão de tarefas — máximo 0,5

- **Situação:** Não verificável
- **Evidências no repositório:** histórico local com autores; sem documentação de divisão de tarefas.
- **O que precisa ser verificado na apresentação:** participação dos integrantes, divisão real de tarefas e demonstração das partes desenvolvidas.
- **Nota sugerida:** A DEFINIR/0,5

## 15. 🔍 Pontos para verificação durante a apresentação

- Demonstrar o funcionamento real da rota `POST /api/login`.
- Confirmar a estrutura real da tabela `USUARIO` no banco de dados.
- Verificar se existe banco de produção criado e acessível.
- Explicar por que o projeto não contém Prisma ORM, schema ou migrations.
- Apresentar o arquivo exportado do Insomnia, caso exista fora do repositório.
- Demonstrar o fluxo de login do frontend até o backend.
- Explicar o estado dos dados do dashboard, distinguindo sensores simulados, API externa de clima e dados vindos do backend.
- Esclarecer a finalidade dos arquivos estáticos em `frontend/js` e sua relação com a SPA React.
- Verificar a participação dos integrantes e a divisão de tarefas do grupo.
- Confirmar a presença do professor como colaborador no ambiente remoto do GitHub.

## 16. 📋 Conclusão

O projeto apresenta uma estrutura inicial separando frontend e backend, com uma SPA React funcional em estágio inicial e um backend Express simples. A parte mais comprovada é o fluxo de login: o frontend envia credenciais para `/api/login`, o backend consulta MySQL diretamente e responde em JSON.

O frontend está mais avançado visualmente, com landing page, login, painel protegido, dashboard simulado e Tailwind configurado. O backend está iniciado, mas concentrado em poucos arquivos e sem organização por camadas. A modelagem do banco não está documentada no repositório; não há Prisma ORM, `schema.prisma`, migrations ou arquivo SQL de criação.

Os principais entregáveis não encontrados foram o arquivo exportado do Insomnia, README raiz/documentação completa do projeto, modelagem formal do banco e configuração Prisma. A integração frontend-backend existe para login, mas não para as funcionalidades centrais do painel agrícola.

Com base apenas nas evidências disponíveis no repositório, a nota sugerida para os itens verificáveis é **3,9/10,0**, com **0,5 ponto dependente de apresentação ou verificação externa**.
