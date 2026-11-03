# Relatório de auditoria e melhorias — Agrovia (02/11/2026)

Escopo: auditoria completa de código, segurança, banco de dados, Parallax, design e desempenho, com correções implementadas e testadas.
Nenhum deploy, push, envio de dados a terceiros ou escrita no banco real foi realizado. Nenhuma credencial aparece neste relatório.

**Versionamento/backup:** todas as mudanças estão na branch `melhorias/auditoria-completa`, ainda sem commit. O estado original está preservado na tag `backup/antes-auditoria-2026-11-02` e na branch `master`.

---

## 1. Problemas encontrados (e corrigidos)

| Gravidade | Problema | Correção |
| --- | --- | --- |
| Crítico | O `.env` da hospedagem usa `DB_HOST/DB_USER/DB_PASS/DB_NAME/DB_PORT`, mas o código lia **apenas** `DATABASE_URL`. Com o `.env` no formato da hospedagem, o servidor não iniciava. A senha contém `@`, que quebra a URL se não for codificada como `%40`. | `db-config.js` aceita os dois formatos; `DATABASE_URL` tem prioridade. Erros nunca exibem a senha. Testes adicionados. |
| Alto | O banco usa `sql_mode` **não estrito**: textos maiores que a coluna eram **truncados silenciosamente** (ex.: nome de cultura > 50 caracteres). | Modo estrito ativado apenas nas sessões da API (sem alterar a configuração global do banco) e validação de tamanho alinhada às colunas reais. |
| Médio | ~250 linhas de "modo demonstração" inalcançáveis no `server.js` (`verificarBancoDisponivel` nunca retornava `false`), mais uma consulta `SELECT 1` extra em **toda** requisição. | Código morto removido; falhas de conexão agora são detectadas pelo próprio erro da consulta e retornam 503. Uma ida ao banco a menos por requisição. |
| Médio | Sessão expirada (8 h) deixava o usuário preso no painel com erros. | Resposta 401 limpa a sessão e leva ao login com o aviso "Sua sessão expirou". |
| Médio | Conflito de CSS: `.btn-outline` existia no Tailwind (`index.css`) e na landing. No hover o fundo ficava verde-claro com texto neon (ilegível). | Botão da landing renomeado para `.btn-ghost`; componentes Tailwind sem uso removidos. |
| Baixo | Gotas animadas do hero eram desenhadas em **preto** (o gradiente existia mas não era aplicado) e a animação rodava uma única vez. | Gradiente aplicado; animação contínua. |
| Baixo | Fontes carregadas via `@import` em cascata dentro do CSS (bloqueia a renderização). | Movidas para `<link>` com `preconnect` no `index.html`. |
| Baixo | Relógio do painel re-renderizava o Dashboard inteiro (525 linhas + gráfico) a cada segundo. | Isolado em `DashboardGreeting.tsx`. |
| Baixo | Mensagens técnicas ao usuário final ("Verifique se o Node.js está rodando") e texto obsoleto de "modo demonstração". | Mensagens claras para 401, 429, 503 e falha de rede. |
| Baixo | Dependências sem uso: `framer-motion`, `web-vitals`. | Removidas. |
| Baixo | ~450 linhas de CSS sem uso ou duplicadas em `landing.css` (stats, gauge, tech, orbit, mission, crop-params e seletores redefinidos). | Arquivo reorganizado (1412 → ~1290 linhas, com os novos recursos incluídos). |

## 2. Vulnerabilidades identificadas

| Gravidade | Vulnerabilidade | Situação |
| --- | --- | --- |
| Crítico | `proxy-addr` (spoofing de IP), `mysql2` ≤ 3.23 (downgrade para senha em texto claro e bomba de descompressão), `body-parser`, `qs` (DoS). | **Corrigido** com `npm audit fix` (somente versões compatíveis). Backend: **0 vulnerabilidades**. |
| Alto | Frontend: `follow-redirects`, `nanoid`, `postcss`, `source-map-js` e outras. | **Corrigido** (compatíveis). Restam 2 moderadas no `react-router` 6 (veja §9). |
| Alto | **4 de 5 contas** do banco tinham senha em **texto puro**. | **Corrigido** com autorização: convertidas para bcrypt e validadas (veja §9). |
| Alto | Login sem limite de tentativas (força bruta). | **Corrigido:** 8 falhas por IP + e-mail e 40 por IP a cada 15 min → HTTP 429. |
| Médio | Enumeração de usuários: "E-mail não cadastrado" versus "Senha inválida". | **Corrigido:** mensagem única, "E-mail ou senha inválidos". |
| Médio | Sem cabeçalhos de segurança; `X-Powered-By: Express` exposto. | **Corrigido:** `nosniff`, `X-Frame-Options`, `Referrer-Policy`, HSTS (produção), `Cache-Control: no-store` na API, limite de 20 kB no JSON e 404 JSON para rotas inexistentes. |
| Médio | Build publicava *source maps* (código-fonte completo legível no servidor). | **Corrigido:** desativado no `build.js`; o `.htaccess` também bloqueia `.map`, `.env`, `.sql`, `.log` e `.bak`. |
| Médio | Entradas sem validação: MAC em qualquer formato, umidade fora de 0–100, IDs não numéricos. | **Corrigido** no servidor. |
| Médio | Credencial de demonstração antiga continua no **histórico do Git** (o código atual não a contém). | Pendente: trocar essa senha onde ela tiver sido reutilizada. |
| Info | CORS: lista de origens permitidas está correta; com origem desconhecida, nenhum cabeçalho de permissão é enviado. Todas as consultas SQL usam parâmetros `?` (sem SQL injection). Verificação de propriedade (403 ao acessar dados de outro usuário) confirmada. | Sem alteração necessária. |

## 3. Arquivos que não devem ir para o repositório ou para produção

- `.gitignore` tinha uma falha: ignorava `.env` e `.env.*.local`, mas **não** `.env.production` ou `.env.development`. Corrigido para `.env.*` (exceto `.env.example`), com chaves (`*.pem`, `*.key`), dumps (`*.dump`, `*.bak`, `*.sql.gz`) e `.claude/`.
- Histórico do Git: nenhum `.env` e nenhuma senha do banco foram commitados.
- Nunca enviar por FTP: `backend/`, `node_modules/`, `.env`, fontes (`src/`), `.git/`. Enviar somente o **conteúdo** de `frontend/dist` (com `.htaccess`).
- `package-lock.json` na pasta pai (`Agrovia semana 02/`) é um arquivo vazio criado por engano fora do projeto. Pode ser apagado; não foi removido.

## 4. Situação da conexão com o banco de dados

**Conexão real comprovada** a partir deste computador, com as configurações da imagem (gravadas apenas em `backend/.env`, que o Git ignora):

- MariaDB 11.8.9, banco correto selecionado. `npm run test-db`: conexão OK e schema pronto (todas as colunas exigidas existem).
- Tabelas: USUARIO (5 contas, todas TECNICO), CULTURAS (0), FAZENDAS (0), DISPOSITIVOS (0), RELATORIO_AUTOMATICO (0), HISTORICO_UMIDADE (0). As chaves estrangeiras estão coerentes e não há registros órfãos.
- API local + banco real: `/api/health` → `connected/ready`; perfil, fazendas, dispositivos, culturas e automação de relatórios → 200; perfil de outro usuário → 403; painel, Campos, Sensores e Conta carregaram pelo navegador.
- Otimização: o login usava `LOWER(email) = ?` (varredura completa, `EXPLAIN type=ALL`). Agora usa o índice único (`email = ?`, mesma comparação sem diferenciar maiúsculas pela collation `utf8mb4_unicode_ci`). As consultas de fazendas e dispositivos já usavam índices.
- Diferenças entre o código e o banco: os scripts de migração descrevem colunas maiores do que as reais (por exemplo, `nome_cultura` tem 50 caracteres no banco e 120 no script). A API agora respeita os limites **reais**. `CULTURAS` não tem índice único no nome; a API passou a recusar nomes duplicados.
- Não testado: gravações reais (não autorizadas), login com conta real (dispararia a gravação do novo hash) e a conexão a partir do Render.

## 5. Problemas encontrados no Parallax

1. A cada frame de rolagem, `setState` **re-renderizava a landing inteira** (o principal gargalo).
2. A posição da seção intermediária era lida durante o render (`getBoundingClientRect`), forçando o recálculo de layout; no primeiro render a ref era nula.
3. Faixa da seção intermediária: `scale(1.12)` + deslocamento de até 50 px podiam deixar visível uma faixa vazia na borda inferior.
4. Cálculos continuavam com a seção fora da tela; a preferência "movimento reduzido" só era lida uma vez.
5. Imagem do hero carregada em duas camadas sobrepostas (`.hero` e `.hero-bg`).

**Nova implementação** (`src/hooks/useLandingMotion.ts`): deslocamentos escritos direto no DOM via `requestAnimationFrame`, sem estado React; `IntersectionObserver` calcula apenas a seção visível. Os deslocamentos respeitam a sobra de cada imagem, e um **teste automatizado em todas as posições de rolagem não encontrou nenhuma lacuna**. Intensidade de 60% em telas menores que 768 px, desligamento ao vivo com "movimento reduzido" e fade suave do texto do hero só depois de 30% da rolagem.

## 6. Melhorias visuais implementadas (identidade preservada)

As cores, as fontes (Syne, DM Sans e as do painel), o layout das seções, os textos e todas as funcionalidades foram mantidos.

- Menu que fica mais compacto e opaco ao rolar, sublinhado animado nos links e logo "AGROVIA" sem o espaço indevido entre "AGRO" e "VIA".
- Menu responsivo: entre 520 e 900 px os links não quebram mais linha; ficam em uma faixa rolável abaixo do logo.
- Âncoras não ficam mais escondidas sob o menu fixo (`scroll-margin-top`).
- Entrada escalonada do hero, indicador de rolagem e revelação suave das seções ao rolar (uma vez, respeitando "movimento reduzido").
- Microinterações: setas que deslizam nos botões, ícones que giram nos cards, zoom suave nas fotos de culturas, estados `:active` e `:focus-visible` acessíveis.
- Cards do processo reorganizados (número e ícone na mesma linha), grade de recursos com cantos arredondados e CTA em painel com brilho sutil.
- Login: logo virou botão acessível, campos com `autocomplete`, alertas com `role="alert"`.

## 7. Melhorias de desempenho

- Landing sem re-render durante a rolagem; painel sem re-render a cada segundo.
- Uma consulta a menos ao banco por requisição; login por índice único; `keepAlive` no pool.
- Fontes sem `@import` em cascata e `preconnect` para fontes e imagens.
- Sem *source maps* públicos; cache de 1 ano para JS/CSS com hash, `no-cache` no `index.html` e compressão (`.htaccess`).
- Imagens com `width`/`height` (evita saltos de layout) e `decoding="async"`; imagem do hero carregada uma vez só.
- Build atual: JS 123,9 kB e CSS 20,1 kB (gzip).

## 8. Testes realizados e resultados

| Teste | Resultado |
| --- | --- |
| Backend `npm test` (21 testes; 5 novos: formatos de banco, limitador, cabeçalhos, mensagem genérica, 404) | ✅ 21/21 |
| `npm audit` backend | ✅ 0 vulnerabilidades |
| `npm run test-db` com o banco real | ✅ conexão e schema prontos |
| API local + banco real (leitura, isolamento 403, validações 400, login genérico 401, bloqueio 429 na 9ª tentativa) | ✅ |
| TypeScript `tsc --noEmit` | ✅ sem erros |
| Testes do frontend (`validate-api-origin`) | ✅ 2/2 |
| Build de produção com `CI=true` (avisos contam como erro) | ✅ compilado sem avisos |
| Navegador: landing em 375, 768 e 1366 px, sem rolagem horizontal | ✅ |
| Navegador: painel, Campos, Sensores e Conta com dados reais | ✅ |
| Navegador: sessão inválida → login com aviso; credencial errada → mensagem genérica | ✅ |
| Parallax: verificação de lacunas em todas as posições de rolagem | ✅ nenhuma |

## Adição: cadastro de usuários

- Botões "Criar conta" no menu e na seção final da landing, e o link "Ainda não tem conta? Criar conta" no login. A nova tela `/cadastro` segue o visual do login.
- API `POST /api/cadastro`: nome, e-mail, telefone (opcional) e senha. A validação é feita no cliente e no servidor, com os limites reais das colunas. A senha precisa de pelo menos 8 caracteres, com letras e números, e é gravada com bcrypt (custo 12). O perfil é sempre AGRICULTOR (o cliente não consegue escolher TECNICO). O e-mail duplicado é detectado sem diferenciar maiúsculas e retorna 409. Há limite de 10 tentativas por IP por hora. Após o cadastro, o usuário já entra no painel.
- Testes: teste automatizado com banco simulado (validações, sucesso, hash, duplicado, tentativa de virar TECNICO, login após cadastro e limite) ✅. Contra o banco real, senha fraca → 400 e e-mail existente → 409, com 5 contas antes e depois (a inserção chega ao banco e o índice único a recusa) ✅. No navegador, botões, links, validação e layout em 375 px e desktop ✅.
- Não testado: a criação de uma conta real com sucesso, para não deixar conta de teste no banco institucional.
- Observação: a resposta 409 revela que um e-mail já está cadastrado. É o comportamento esperado em telas de cadastro, e o limite por IP reduz o uso para enumeração de contas.

## 9. Pontos que ainda precisam de atenção

1. ~~Senhas em texto puro (4 contas)~~ — **resolvido em 02/11/2026** com autorização: backup local da tabela USUARIO em `backend/backups/` (ignorado pelo Git; **apague-o** depois de confirmar que todos conseguem entrar, porque ele contém as senhas antigas), conversão transacional e verificação de que cada hash bcrypt valida a senha original. Formatos atuais: bcrypt=4 e scrypt=1 (esta última vira bcrypt no próximo login).
2. **Trocar a senha do banco.** Ela foi compartilhada em imagem e está em um arquivo no Google Drive. Recomendo gerar uma nova no painel da Hostinger e atualizar `backend/.env` e o Render. Troque também a senha de demonstração antiga do histórico do Git onde ela tiver sido reutilizada.
3. **CULTURAS está vazia**: a seleção de cultura no cadastro de fazendas fica sem opções. É preciso cadastrar as culturas pela tela Conta ou por um seed — **exige autorização** (grava no banco).
4. **Render**: cadastrar `DB_HOST/DB_USER/DB_PASS/DB_NAME/DB_PORT` (agora suportados) ou `DATABASE_URL` com `@` codificado como `%40`. O timeout anterior no Render indica que a Hostinger pode exigir a liberação de acesso remoto ("Remote MySQL") para o IP do Render. Isso não foi verificado.
5. **react-router 6**: 2 alertas moderados (redirecionamento aberto com `\` em links dinâmicos; SSR). Não são exploráveis aqui: todas as rotas são fixas e não há SSR. A correção exige migrar para a v7 (mudança incompatível).
6. **Create React App** está descontinuado (as vulnerabilidades restantes são de ferramentas de build, não vão para produção). Migrar para Vite fica como projeto futuro.
7. Token em `localStorage` (risco caso surja um XSS). Considerar cookie `HttpOnly` e uma CSP no futuro.
8. Imagens do hero e da seção intermediária são carregadas do Unsplash (dependência externa). Recomendo baixá-las, otimizá-las em WebP e servi-las localmente. As fotos locais de culturas (até 363 kB) também podem ser comprimidas.
9. A tabela `HISTORICO_UMIDADE` existe, mas o código não a usa (a telemetria ainda não foi integrada).
10. Limitador de login em memória: zera quando o servidor reinicia, o que é adequado para uma instância única.
11. Antes do deploy: **gerar o build com a URL de produção** em `frontend/.env`. O `.env` local aponta para `localhost:5000`.

---

# Auditoria final e teste prático completo (02/11/2026)

Código, estrutura e funcionalidades revisados de novo, com o AGROVIA rodando no navegador (frontend local + backend local + banco MySQL real da instituição). O visual e as funções existentes foram mantidos.

## Defeitos encontrados e corrigidos

| Gravidade | Defeito | Causa | Correção |
| --- | --- | --- | --- |
| Crítico | **Não era possível cadastrar fazenda pelo painel** (Campos → "Cadastrar novo campo"). | O formulário envia a cultura pelo nome ("Milho", "Soja"…, ou "Outra"). O servidor exigia que ela já existisse em CULTURAS, que estava vazia, e respondia "A cultura informada não está cadastrada". | Quando a cultura informada ainda não existe, o servidor passa a registrá-la, sem limiares de umidade (que podem ser preenchidos depois), e reaproveita a existente sem diferenciar maiúsculas. Limite de 50 caracteres validado. |
| Alto | **"Salvar preferência" de Relatórios sempre falhava** (HTTP 503). | `ER_CANT_AGGREGATE_2COLLATIONS`: o SQL comparava o parâmetro com o texto `'diario'` dentro de um `CASE`, e o MariaDB 11.8 recusa essa mistura de collations. O erro foi reproduzido numa transação desfeita. | O intervalo (1 ou 7 dias) passou a ser calculado no Node; o SQL ficou mais simples. |
| Médio | Área e umidade chegavam ao frontend como texto. | O mysql2 devolve DECIMAL como string, e a soma de áreas no resumo de Campos podia virar concatenação. | `decimalNumbers: true` no pool. |

Novo teste automatizado: `backend/test/fazendas.test.js` (cultura nova criada uma vez, reaproveitamento, limite e bloqueio de fazenda para outro usuário). Total: **23/23 testes**.

## Teste prático no navegador, com o banco real

Foi usada uma conta de teste criada pelo próprio cadastro (`auditoria-agrovia@example.invalid`, perfil AGRICULTOR; a senha está só no `backend/.env`).

| Área | O que foi testado | Resultado |
| --- | --- | --- |
| Landing | 29 controles: 11 âncoras do menu, rodapé e textos (o título fica 96 px abaixo do menu fixo), indicador de rolagem, "Conhecer recursos", "Voltar ao Topo", logo, "Criar conta", "Fazer Login", "Acessar plataforma", 6 × "Acessar após login", 5 × "Acessar estudos", "Criar conta grátis", "Já tenho conta" | ✅ todos |
| Cadastro | Validações no cliente; conta criada; entrada direta no painel | ✅ |
| Login / Sair | Login com o e-mail em maiúsculas; "Esqueceu a senha?"; Sair limpa a sessão; painel sem login redireciona | ✅ |
| Campos | Cadastro com cultura, área, talhões e observação; recarregar mostra os dados vindos do banco; resumo correto (12,5 ha); menu ⋯ → Excluir → confirmação | ✅ (falhava antes da correção) |
| Conta → Perfil | Telefone alterado e mantido após recarregar | ✅ |
| Conta → Fazendas | Nova fazenda gravada e listada | ✅ |
| Conta → Culturas | Lista carregada; mínimo > máximo recusado; nome duplicado recusado; INSERT validado numa transação desfeita | ✅ |
| Conta → Dispositivos | ESP32 vinculado; MAC normalizado (`02:00:00:AA:00:01`) | ✅ |
| Sensores | Dispositivo listado com resumo; Cancelar fecha a confirmação; remoção mantida após recarregar | ✅ |
| Relatórios | Carrega a configuração; salva a frequência "Diária", que permanece após recarregar | ✅ (falhava antes da correção) |
| Estudos | 5 estudos; busca sem resultado e "Limpar busca"; abrir; capítulo seguinte e anterior; "Marcar como concluído" | ✅ |
| Painel | 7 itens do menu lateral, "Atualizar" (refaz as consultas), abas e períodos do gráfico, 4 ações rápidas, contadores vindos da API | ✅ |
| Segurança na prática | Token da conta de teste contra dados de outro usuário: perfil 403, fazendas 403, edição 403, exclusão 404, sem token 401; troca de "Tipo de perfil" para Técnico ignorada pelo servidor | ✅ |
| Celular (375 px) | 8 telas internas + landing, login e cadastro sem rolagem horizontal | ✅ |

**Conferência direta no banco:** todos os valores digitados foram encontrados exatamente como exibidos. A senha está em bcrypt. A fazenda e o dispositivo excluídos ficaram com `deleted_at` preenchido (exclusão lógica, sem apagar), e o MAC removido foi liberado para reuso. A preferência de relatório está gravada como `diario`.

Limitação do ambiente: o painel do navegador de teste não renderiza frames (`requestAnimationFrame` parado), então a **animação** de rolagem suave não avança nele. A lógica foi testada forçando a rolagem instantânea e funciona; a animação em si só pode ser vista num navegador comum.

## Dados de teste que ficaram no banco real

- Conta `auditoria-agrovia@example.invalid` (id 7, AGRICULTOR), "Fazenda Teste Auditoria" (ativa), "Sítio Teste Auditoria" e "ESP32 Teste Auditoria" (excluídos logicamente) e 1 linha em RELATORIO_AUTOMATICO.
- Cultura **Milho**, criada pelo cadastro de fazenda. É um dado útil e pode ficar.
- Remover a conta e seus registros apaga linhas de forma definitiva, por isso **não foi feito sem sua autorização**.

## Pontos de atenção (sem alteração, para não mudar funções)

- Em Conta → Perfil, o campo **CPF/CNPJ não é salvo** (não existe coluna no banco) e o seletor **"Tipo de perfil" não tem efeito**. O servidor ignora a troca por segurança, mas a tela mostra "Perfil atualizado com sucesso". Sugestão: esconder ou desabilitar esses dois campos, ou criar a coluna de documento.
- Qualquer conta, inclusive as criadas pelo cadastro público, pode criar culturas, que são compartilhadas entre todos os usuários. Avalie restringir a criação de culturas a TECNICO.
- Com SMTP não configurado, a ativação do envio de relatórios continua indisponível (comportamento esperado).

## Encerramento (02/11/2026)

- **Conta de teste removida** com autorização: a conta id 7, 2 fazendas, 1 dispositivo e 1 preferência de relatório foram apagadas numa única transação. O backup dessas linhas está em `backend/backups/` (ignorado pelo Git). O banco voltou a ter 5 contas TECNICO, 0 fazendas e 0 dispositivos. A cultura Milho foi mantida. As credenciais de teste foram retiradas do `backend/.env`.
- **"Error" ao abrir no navegador:** a aba `localhost:5000` mostrava a página 404 padrão do Express (título "Error"), porque a API não tinha resposta em `/`; a raiz `localhost:3000/` abria em branco, porque o site só existe em `/tecti/2026/gpec05/`. Agora `/` da API responde com um JSON de status, e a raiz do frontend redireciona para o caminho do site.

---

# Etapa: Parallax premium, estudos completos e integração com o ESP32

## Parallax premium (sem custo de desempenho)
- **Inércia:** a rolagem é suavizada (lerp de 14% por quadro). O laço de animação só roda enquanto há movimento e para sozinho quando tudo assenta.
- **Profundidade pelo ponteiro** (só em computador com mouse ou trackpad; toque não aciona): imagem, brilho, gotas e texto do hero se deslocam em velocidades diferentes e voltam ao repouso quando o mouse sai.
- **Faixa intermediária:** zoom-out de 1,08 para 1,0 na entrada, com o texto se movendo no sentido oposto ao fundo.
- **Fotos das culturas:** parallax interno, com a foto 16% maior que a moldura. O zoom de hover usa a propriedade `scale`, que não conflita com o parallax.
- **Vinheta** fixa no hero, sem custo de animação.
- Continua tudo só com `transform`, calculado apenas para as seções visíveis, desligado com "movimento reduzido" e com 60% da intensidade em telas menores que 768 px.
- Teste automatizado no navegador (1366 px e 375 px; hero com o ponteiro nos 4 cantos, faixa em 9 posições e fotos em 4): **nenhuma borda vazia** e nenhuma rolagem lateral.

## Estudos agrícolas
- Novo capítulo **"Parâmetros técnicos de referência"** em cada uma das 5 culturas: demanda de água por ciclo, Kc inicial/médio/final, profundidade de raízes, fração de esgotamento p, fases mais sensíveis, fórmulas TAW/RAW e como usar esses números com o sensor.
- Cada número foi conferido na fonte: FAO-56 (tabelas 12 e 22), FAO *Irrigation Water Needs* (tabela 14), Embrapa Soja e Embrapa Café. Dois valores que não encontrei confirmados (a temperatura ideal do café e uma faixa de consumo do feijão) ficaram fora.
- 7 referências novas, todas abrindo (HTTP 200). Links da FAO que estavam fora do ar foram substituídos.

## Integração com o ESP32
- **API do aparelho** (`backend/iot.js`): autenticação por chave (`X-Device-Key`, guardada como hash SHA-256), recebimento de leituras (avulsas ou em lote, com horário para dados guardados offline), entrega dos comandos pendentes na própria resposta e confirmação de execução.
- **API do painel:** gerar chave, histórico de leituras e criação/consulta de comandos de irrigação, sempre conferindo o dono do dispositivo.
- **Proteções de irrigação:** duração de 5 s a 60 min; o comando expira em 2 minutos se o aparelho não buscar; uma ordem nova substitui a pendente; intervalo mínimo de 5 s entre envios de leitura.
- **Conectado/desconectado** passa a ser calculado pelo último contato do aparelho (janela de 3 minutos), não mais por um campo fixo.
- **Fuso horário corrigido:** o driver lia as datas do banco (UTC) como hora local, com 3 h de diferença. Agora o UTC vale nas duas pontas.
- **Telas:** o cartão do dispositivo mostra a última umidade, há quanto tempo foi lida e um minigráfico das últimas 24 leituras, além do botão **Irrigação** (1–30 min, Desligar, andamento ao vivo de cada comando) e do item **Gerar chave do dispositivo**. Sensores e Painel mostram a umidade média real, e a lista se atualiza a cada 30 s.
- **Migração `006_iot_integracao.sql`:** só acrescenta (coluna `chave_hash`, índice do histórico e tabela `COMANDOS_IRRIGACAO`). `npm run test-db` e `/api/health` acusam se ela não foi aplicada.
- **Firmware de referência** (`firmware/esp32-agrovia`): relé desligado no boot, fechamento da válvula por tempo mesmo sem internet, limite máximo local, watchdog, NTP, buffer de 50 leituras offline e HTTPS com certificado raiz. O `config.h` fica fora do Git.
- **Simulador** (`backend/tools/simulador-esp32.js`): faz o papel do aparelho, sem hardware.
- **Teste automatizado de ponta a ponta** (`test/iot.test.js`): o servidor real conversa com o simulador real. Cobre chave, recusa de chave inválida e de sessão de usuário, validações, comando expirado não entregue, substituição de comando, execução confirmada, leituras subindo com a válvula aberta, status online e troca de chave invalidando a anterior. **24/24 testes passando.**
- Guia completo em `firmware/README.md`: ligações, passo a passo, contrato da API e pendências.

## Pendente
- **Aplicar a migração 006 no banco real.** O app bloqueou a aplicação automática e exige sua autorização explícita. Até lá, as telas atuais continuam funcionando (a lista de dispositivos usa uma consulta compatível), mas a chave, as leituras e os comandos respondem 503, "migração 006".
- Teste de ponta a ponta com o banco real (conta e dispositivo de teste + simulador), depois da migração.
- Firmware ainda não compilado nem testado em hardware; certificado raiz e calibração por área; irrigação automática por limiar; sensor de vazão; alertas; OTA (detalhes em `firmware/README.md`).

## Teste real com o banco da instituição (migração 006 autorizada)

- **Migração 006 aplicada.** Na primeira tentativa, um `;` dentro de um comentário fez o executor cortar a instrução, e nada foi aplicado (conferido). Corrigi e reapliquei com sucesso. `npm run test-db` responde "Schema pronto". Novo teste impede `;` em comentários de migração.
- **Defeito encontrado só no banco real e corrigido:** `DISPOSITIVOS.ultima_atualizacao` tem `ON UPDATE CURRENT_TIMESTAMP` na base da instituição e muda a cada edição da linha, então um dispositivo recém-cadastrado aparecia como "Conectado". O último contato agora vem da leitura mais recente em HISTORICO_UMIDADE (índice da migração 006).
- **Defeito visual encontrado e corrigido:** a regra `.dashboard-light section { padding: 0 }` zerava o espaçamento interno dos diálogos do painel, inclusive os de exclusão que já existiam. Os diálogos passaram a usar `<div role="dialog">`, e o espaçamento previsto (32 px) voltou.
- **Fluxo testado na tela com o banco real**, usando a conta `teste-iot-agrovia@example.invalid`, a "Fazenda Teste IoT" e o "ESP32 Teste IoT", e o simulador no lugar do aparelho:
  1. Cadastro do dispositivo → "Desconectado" e "Gere a chave…" ✅
  2. Menu ⋯ → Gerar chave → chave exibida uma vez, com Copiar/Concluir ✅
  3. Simulador ligado com a chave → "Conectado", umidade real, minigráfico, média em Sensores e no Painel ✅
  4. Irrigação → 1 min → "Aguardando o aparelho" → "Executado" ✅
  5. "Desligar agora" durante a irrigação → "Executado" ✅
  6. Diálogos no celular (375 px), sem rolagem lateral ✅
- **Conferido no banco:** chave guardada só como hash SHA-256; 25 leituras com horário UTC correto; a série mostra a secagem, a subida com a válvula aberta e a secagem de novo após o Desligar; comandos EXECUTADOS, entregues em 1–5 s, com a mensagem do aparelho gravada.
- Testes automatizados: **25/25**; build sem avisos; 0 vulnerabilidades no backend.

**Dados de teste no banco real:** a conta de teste IoT, sua fazenda, o dispositivo, as leituras e os 2 comandos. A senha está em `backend/.env` (`IOT_TESTE_*`). A remoção depende da sua autorização.

**Limpeza (autorizada):** a conta de teste IoT (id 9), a fazenda, o dispositivo, 46 leituras e 2 comandos foram removidos numa única transação, com backup em `backend/backups/` (sem senha e sem hash de chave). O banco voltou a ter 5 contas TECNICO e nenhum dado de teste. A cultura Milho e a estrutura da migração 006 permanecem. As credenciais de teste foram retiradas do `backend/.env`. Após a remoção, o simulador passou a receber 401 (chave inválida), como esperado.

---

# Etapa: irrigador animado no Parallax e recuperação de senha

## Irrigador e chuva (Parallax)
- **Aspersor oscilante** no primeiro plano do hero (`HeroIrrigacao.tsx`): a cabeça varre de um lado a outro; cada jato tem um filete contínuo com o tracejado da água em movimento por cima; gotas percorrem a trajetória (SVG `animateMotion`), com respingos e névoa onde a água cai.
- **Chuva em duas profundidades:** 26 gotas distantes (finas e lentas) e 12 próximas (maiores e rápidas), com posições fixas geradas por semente, sem "pular" a cada render.
- **Parallax por camada:** chuva distante, irrigador e chuva próxima se deslocam em velocidades crescentes com a rolagem e o mouse, o que cria profundidade.
- **Desempenho:** só `transform` e opacidade. Com o hero fora da tela, as animações em CSS e em SMIL são **pausadas**; com "reduzir movimento", ficam paradas.
- **Posição:** ancorado no fim da primeira tela, para ficar sempre visível. No celular fica menor (62% da largura) e discreto (40%), atrás dos botões.

## "Esqueceu a senha?" funcionando
- **Fluxo:** Login → "Esqueceu a senha?" → e-mail → **Enviar link** → e-mail com o link → página **Nova senha** → login com aviso "Senha alterada com sucesso".
- **Segurança:**
  - token assinado (HMAC-SHA256, chave própria, separada da sessão), válido por 30 minutos;
  - a assinatura inclui o hash da senha atual, então o link é de **uso único** e deixa de valer assim que a senha muda, sem tabela nova no banco;
  - o token vai no fragmento `#` do link, fora dos logs de servidor e do Referer, e sai da barra de endereço ao abrir a página;
  - resposta idêntica para e-mail cadastrado ou não, para não revelar contas;
  - limite de 3 pedidos por e-mail e 10 por IP por hora;
  - mesma regra de senha do cadastro (função única `validarNovaSenha`).
- **Teste automatizado** (`test/senha-reset.test.js`): resposta igual para e-mail inexistente, link com o caminho do site, token adulterado, token de sessão recusado, token expirado, senha fraca, troca gravada em bcrypt, link reutilizado recusado, senha antiga recusada, senha nova aceita e limite de pedidos. **26/26 testes passando.**
- **Teste pela tela com o banco real** (conta `teste-senha-agrovia@example.invalid`): pedido enviado; link aberto, com o token removido da URL; senha fraca e confirmação diferente recusadas; troca feita; redirecionamento ao login com aviso; o mesmo link depois mostra "Este link não pode mais ser usado"; senha antiga → 401, nova → 200; no banco a senha está em bcrypt. Layout conferido no celular.

## Para funcionar em produção
- **Configurar SMTP no Render** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Pode ser o e-mail da própria Hostinger ou uma conta com "senha de app". Sem SMTP, o pedido é aceito, mas o e-mail não sai, e a tela avisa a pessoa para procurar o administrador. Em desenvolvimento, o link aparece no log do servidor.
- Conferir `FRONTEND_URL` (origem do site) e `FRONTEND_BASE_PATH` (padrão `/tecti/2026/gpec05`), usados para montar o link.
- **Dados de teste no banco real:** a conta `teste-senha-agrovia@example.invalid` (credenciais em `backend/.env`, `SENHA_TESTE_*`). A remoção depende da sua autorização.

**Limpeza (autorizada):** a conta de teste da redefinição de senha (id 10, sem vínculos) foi removida numa transação, com backup em `backend/backups/` (sem a senha). O banco voltou a ter só as 5 contas TECNICO originais, e as credenciais de teste saíram do `backend/.env`.
