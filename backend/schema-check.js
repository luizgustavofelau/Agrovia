const REQUIRED_COLUMNS = [
  'USUARIO.id_usuario', 'USUARIO.nome', 'USUARIO.email', 'USUARIO.senha',
  'USUARIO.telefone', 'USUARIO.tipo_usuario',
  'CULTURAS.id_cultura', 'CULTURAS.nome_cultura', 'CULTURAS.descricao_tecnica',
  'CULTURAS.umidade_ideal_min', 'CULTURAS.umidade_ideal_max',
  'FAZENDAS.id_fazenda', 'FAZENDAS.nome_fazenda', 'FAZENDAS.localizacao',
  'FAZENDAS.id_usuario_fk', 'FAZENDAS.id_cultura_fk', 'FAZENDAS.area_ha',
  'FAZENDAS.qtd_talhoes', 'FAZENDAS.observacoes',
  'DISPOSITIVOS.id_dispositivo', 'DISPOSITIVOS.nome_dispositivo',
  'DISPOSITIVOS.mac_address', 'DISPOSITIVOS.status_conexao',
  'DISPOSITIVOS.id_fazenda_fk', 'DISPOSITIVOS.id_campo',
];

async function inspectSchema(pool) {
  const [columns] = await pool.query(`SELECT TABLE_NAME, COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('USUARIO', 'CULTURAS', 'FAZENDAS', 'DISPOSITIVOS')`);
  const availableColumns = new Set(columns.map((column) => `${column.TABLE_NAME}.${column.COLUMN_NAME}`));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !availableColumns.has(column));
  return { ready: missingColumns.length === 0, missingColumns };
}

module.exports = { inspectSchema };