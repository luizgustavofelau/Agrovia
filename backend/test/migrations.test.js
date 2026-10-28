const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectMigrations } = require('../migrate');

test('migração de base existente seleciona somente 002 em diante, em ordem', () => {
  const files = ['005_relatorios_automaticos.sql', 'README.md', '000_core_schema.sql',
    '004_soft_delete_dispositivos.sql', '001_conta.sql', '003_soft_delete_fazendas.sql',
    '002_fazenda_detalhes.sql'];
  assert.deepEqual(selectMigrations(files, ['--dry-run', '--from=002']), [
    '002_fazenda_detalhes.sql', '003_soft_delete_fazendas.sql',
    '004_soft_delete_dispositivos.sql', '005_relatorios_automaticos.sql',
  ]);
  assert.equal(selectMigrations(files, []).length, 6);
});

test('argumento incorreto não pode iniciar migração por engano', () => {
  for (const args of [['--dryrun'], ['--from=999'], ['--from=../../'], ['--from=002', '--from=002']]) {
    assert.throws(() => selectMigrations(['002_fazenda_detalhes.sql'], args));
  }
});
