SET @agrovia_has_deleted_at = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'FAZENDAS'
    AND COLUMN_NAME = 'deleted_at'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_deleted_at = 0,
  'ALTER TABLE FAZENDAS ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_deleted_index = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'FAZENDAS'
    AND INDEX_NAME = 'idx_fazendas_usuario_deleted'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_deleted_index = 0,
  'CREATE INDEX idx_fazendas_usuario_deleted ON FAZENDAS (id_usuario_fk, deleted_at)',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;