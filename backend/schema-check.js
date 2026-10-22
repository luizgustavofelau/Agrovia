const REQUIRED_COLUMNS = [
  'RELATORIO_AUTOMATICO.id_usuario_fk', 'RELATORIO_AUTOMATICO.ativo',
  'RELATORIO_AUTOMATICO.frequencia', 'RELATORIO_AUTOMATICO.proximo_envio',
  'RELATORIO_AUTOMATICO.ultimo_envio',
  'USUARIO.id_usuario', 'USUARIO.nome', 'USUARIO.email', 'USUARIO.senha',
  'USUARIO.telefone', 'USUARIO.tipo_usuario',
  'CULTURAS.id_cultura', 'CULTURAS.nome_cultura', 'CULTURAS.descricao_tecnica',
  'CULTURAS.umidade_ideal_min', 'CULTURAS.umidade_ideal_max',
  'FAZENDAS.id_fazenda', 'FAZENDAS.nome_fazenda', 'FAZENDAS.localizacao',
  'FAZENDAS.id_usuario_fk', 'FAZENDAS.id_cultura_fk', 'FAZENDAS.area_ha',
  'FAZENDAS.qtd_talhoes', 'FAZENDAS.observacoes', 'FAZENDAS.deleted_at',
  'DISPOSITIVOS.id_dispositivo', 'DISPOSITIVOS.nome_dispositivo',
  'DISPOSITIVOS.mac_address', 'DISPOSITIVOS.status_conexao',
  'DISPOSITIVOS.id_fazenda_fk', 'DISPOSITIVOS.id_campo',
  'DISPOSITIVOS.deleted_at', 'DISPOSITIVOS.mac_address_ativo',
];

async function inspectSchema(pool) {
  const [columns] = await pool.query(`SELECT TABLE_NAME, COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('USUARIO', 'CULTURAS', 'FAZENDAS', 'DISPOSITIVOS', 'RELATORIO_AUTOMATICO')`);
  const availableColumns = new Set(columns.map((column) => `${column.TABLE_NAME}.${column.COLUMN_NAME}`));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !availableColumns.has(column));
  return { ready: missingColumns.length === 0, missingColumns };
}

module.exports = { inspectSchema };