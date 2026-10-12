SET @agrovia_has_nome_dispositivo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND COLUMN_NAME = 'nome_dispositivo'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_nome_dispositivo = 0,
  'ALTER TABLE DISPOSITIVOS ADD COLUMN nome_dispositivo VARCHAR(100) NULL AFTER id_dispositivo',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_id_campo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND COLUMN_NAME = 'id_campo'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_id_campo = 0,
  'ALTER TABLE DISPOSITIVOS ADD COLUMN id_campo INT NULL AFTER id_fazenda_fk',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;