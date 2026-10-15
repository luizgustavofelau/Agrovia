SET @agrovia_has_dispositivo_deleted_at = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND COLUMN_NAME = 'deleted_at'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_dispositivo_deleted_at = 0,
  'ALTER TABLE DISPOSITIVOS ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_mac_ativo = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND COLUMN_NAME = 'mac_address_ativo'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_mac_ativo = 0,
  'ALTER TABLE DISPOSITIVOS ADD COLUMN mac_address_ativo VARCHAR(17) GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN mac_address ELSE NULL END) STORED',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_original_mac_index = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND INDEX_NAME = 'uq_dispositivos_mac'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_original_mac_index > 0,
  'ALTER TABLE DISPOSITIVOS DROP INDEX uq_dispositivos_mac',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_active_mac_index = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND INDEX_NAME = 'uq_dispositivos_mac_ativo'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_active_mac_index = 0,
  'CREATE UNIQUE INDEX uq_dispositivos_mac_ativo ON DISPOSITIVOS (mac_address_ativo)',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_device_deleted_index = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND INDEX_NAME = 'idx_dispositivos_fazenda_deleted'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_device_deleted_index = 0,
  'CREATE INDEX idx_dispositivos_fazenda_deleted ON DISPOSITIVOS (id_fazenda_fk, deleted_at)',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;