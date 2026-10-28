# Migrações da base institucional

Revisão de 28/10/2026, baseada somente em leitura de metadados e contagem agregada de duplicados. Nenhuma migration foi aplicada.

## Correções

- `005_relatorios_automaticos.sql` obtém o tipo inteiro e o sinal de `USUARIO.id_usuario` por INFORMATION_SCHEMA. Na base institucional é INT com sinal, enquanto uma base nova criada pelo script 000 usa INT UNSIGNED. A FK acompanha ambos, sem alterar USUARIO ou suas relações existentes. Tipo ausente/não inteiro impede a preparação do DDL.
- `004_soft_delete_dispositivos.sql` cria primeiro a unicidade de mac_address_ativo. Só depois remove índices únicos legados de uma única coluna mac_address, encontrados pelos metadados e com nomes escapados. Reconhece tanto mac_address da instituição quanto uq_dispositivos_mac do script 000. Outros índices e PRIMARY não são removidos.
- `002` e `003` já cobrem as colunas faltantes e mantêm os dados existentes. Nenhuma correção de SQL foi necessária nesses dois arquivos.
- O executor aceita --from=002 e rejeita argumentos incorretos antes de conectar. Em falha, informa arquivo e número da instrução sem expor valores SQL ou credenciais.

## Estrutura observada

MariaDB 11.8.9, tabelas InnoDB. USUARIO.id_usuario é int(11) com sinal. O índice único legado de DISPOSITIVOS é mac_address. RELATORIO_AUTOMATICO ainda não existe. HISTORICO_UMIDADE e os campos de última leitura existentes não serão alterados por estes scripts.

Pendências: FAZENDAS.area_ha, qtd_talhoes, observacoes, deleted_at; DISPOSITIVOS.deleted_at e mac_address_ativo; tabela RELATORIO_AUTOMATICO. Nenhum MAC não nulo duplicado foi encontrado no momento da consulta.

## Aplicação manual após backup e revisão

1. Confirmar o banco apontado por DATABASE_URL e um backup recuperável pelo procedimento institucional. Não publicar credenciais.
2. Fazer a aplicação em janela de manutenção, sem cadastros/alterações concorrentes. DDL não tem rollback transacional: uma falha pode deixar parte das mudanças aplicada. Não colocar o migrador em build/start do Render.
3. A partir de backend, conferir a seleção:

```powershell
npm run db:migrate -- --dry-run --from=002
```

4. Somente depois de backup/revisão e autorização do responsável, aplicar:

```powershell
npm run db:migrate -- --from=002
npm run test-db
```

5. Conferir que o índice único uq_dispositivos_mac_ativo existe sobre mac_address_ativo, que não permanece um índice único de apenas mac_address e que a FK de RELATORIO_AUTOMATICO referencia USUARIO.id_usuario. O test-db verifica colunas, não substitui a inspeção de índices/constraints.
6. Confirmar /api/health no Render com database=connected e schema=ready. A migração não corrige por si só o timeout da conexão Render → MySQL.
7. Verificar hashes das contas e testar login/CRUD com dados de teste autorizados. Não há dados pessoais ou seeds nestes scripts.

Os scripts consultam metadados antes de criar colunas/índices/tabela, permitindo repetição em estados compatíveis. Uma estrutura preexistente incompatível sob o mesmo nome exige revisão manual, não é corrigida automaticamente. Não executar duas instâncias do migrador ao mesmo tempo.

## Validação realizada

- Seis testes backend passaram, incluindo seleção parcial e rejeição de argumentos incorretos.
- Dry-run desde 002: quatro arquivos, 55 instruções. Não executa SQL nem valida sintaxe no servidor.
- SQL 005 submetido a SET de variáveis de sessão, PREPARE e DEALLOCATE no servidor real, sem EXECUTE. Tipo calculado: INT. Isso valida preparação, não prova que a execução DDL terminará com sucesso.
- Seleção de índice legado confirmada por consulta de metadados; contagem de duplicados igual a zero, sem exportação de registros.
- Teste de aplicação/repetição em banco isolado não realizado: Docker instalado, mas daemon indisponível. Nenhuma base foi criada para testes.

Referências: [compatibilidade de tipos em FKs MariaDB](https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/foreign-keys), [PREPARE](https://mariadb.com/docs/server/reference/sql-statements/prepared-statements/prepare-statement).
