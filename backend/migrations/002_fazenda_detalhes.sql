SET @agrovia_has_area_ha = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'FAZENDAS'
    AND COLUMN_NAME = 'area_ha'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_area_ha = 0,
  'ALTER TABLE FAZENDAS ADD COLUMN area_ha DECIMAL(12,2) NULL',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_qtd_talhoes = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'FAZENDAS'
    AND COLUMN_NAME = 'qtd_talhoes'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_qtd_talhoes = 0,
  'ALTER TABLE FAZENDAS ADD COLUMN qtd_talhoes INT UNSIGNED NULL',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_observacoes = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'FAZENDAS'
    AND COLUMN_NAME = 'observacoes'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_observacoes = 0,
  'ALTER TABLE FAZENDAS ADD COLUMN observacoes VARCHAR(300) NULL',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;