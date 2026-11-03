-- Integração com o ESP32: autenticação do dispositivo, histórico de leituras e comandos de irrigação.
-- Somente acréscimos (colunas, índices e uma tabela nova). Nenhum dado existente é alterado.
-- Atenção: o executor separa instruções por ponto e vírgula, então comentários não podem tê-lo.

-- Hash SHA-256 (hex) da chave secreta do dispositivo. A chave em si nunca é gravada.
SET @agrovia_has_chave_hash = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND COLUMN_NAME = 'chave_hash'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_chave_hash = 0,
  'ALTER TABLE DISPOSITIVOS ADD COLUMN chave_hash CHAR(64) NULL',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

SET @agrovia_has_chave_index = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DISPOSITIVOS'
    AND INDEX_NAME = 'uq_dispositivos_chave_hash'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_chave_index = 0,
  'CREATE UNIQUE INDEX uq_dispositivos_chave_hash ON DISPOSITIVOS (chave_hash)',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

-- Consultas do histórico sempre filtram por dispositivo e ordenam por data.
SET @agrovia_has_historico_index = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'HISTORICO_UMIDADE'
    AND INDEX_NAME = 'idx_historico_dispositivo_data'
);
SET @agrovia_schema_sql = IF(
  @agrovia_has_historico_index = 0,
  'CREATE INDEX idx_historico_dispositivo_data ON HISTORICO_UMIDADE (id_dispositivo_fk, data_hora)',
  'SELECT 1'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;

-- A FK precisa ter o mesmo tamanho e sinal da chave existente de DISPOSITIVOS.
SET @agrovia_device_id_type = (
  SELECT CONCAT(UPPER(DATA_TYPE), IF(LOCATE('unsigned', LOWER(COLUMN_TYPE)) > 0, ' UNSIGNED', ''))
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DISPOSITIVOS' AND COLUMN_NAME = 'id_dispositivo'
    AND DATA_TYPE IN ('tinyint', 'smallint', 'mediumint', 'int', 'bigint')
);
SET @agrovia_user_id_type = (
  SELECT CONCAT(UPPER(DATA_TYPE), IF(LOCATE('unsigned', LOWER(COLUMN_TYPE)) > 0, ' UNSIGNED', ''))
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'USUARIO' AND COLUMN_NAME = 'id_usuario'
    AND DATA_TYPE IN ('tinyint', 'smallint', 'mediumint', 'int', 'bigint')
);
-- Se alguma chave estiver ausente ou não for inteira, PREPARE falha sem executar DDL.
SET @agrovia_schema_sql = CONCAT(
'CREATE TABLE IF NOT EXISTS COMANDOS_IRRIGACAO (
  id_comando INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_dispositivo_fk ', @agrovia_device_id_type, ' NOT NULL,
  id_usuario_fk ', @agrovia_user_id_type, ' NOT NULL,
  acao ENUM(''LIGAR'', ''DESLIGAR'') NOT NULL,
  duracao_segundos SMALLINT UNSIGNED NULL,
  status ENUM(''PENDENTE'', ''ENVIADO'', ''EXECUTADO'', ''FALHOU'', ''EXPIRADO'', ''CANCELADO'') NOT NULL DEFAULT ''PENDENTE'',
  mensagem VARCHAR(255) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  entregue_em DATETIME NULL,
  concluido_em DATETIME NULL,
  PRIMARY KEY (id_comando),
  KEY idx_comandos_dispositivo_status (id_dispositivo_fk, status, expira_em),
  KEY idx_comandos_usuario (id_usuario_fk),
  CONSTRAINT fk_comandos_dispositivo FOREIGN KEY (id_dispositivo_fk)
    REFERENCES DISPOSITIVOS (id_dispositivo) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_comandos_usuario FOREIGN KEY (id_usuario_fk)
    REFERENCES USUARIO (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;
