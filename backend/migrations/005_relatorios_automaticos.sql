-- A FK deve ter o mesmo tamanho e sinal da chave existente, sem alterar USUARIO.
SET @agrovia_user_id_type = (
  SELECT CONCAT(UPPER(DATA_TYPE), IF(LOCATE('unsigned', LOWER(COLUMN_TYPE)) > 0, ' UNSIGNED', ''))
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'USUARIO' AND COLUMN_NAME = 'id_usuario'
    AND DATA_TYPE IN ('tinyint', 'smallint', 'mediumint', 'int', 'bigint')
);
-- Se a chave estiver ausente ou não for inteira, PREPARE falha sem executar DDL.
SET @agrovia_schema_sql = CONCAT(
'CREATE TABLE IF NOT EXISTS RELATORIO_AUTOMATICO (
  id_usuario_fk ', @agrovia_user_id_type, ' NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 0,
  frequencia ENUM(''diario'', ''semanal'') NOT NULL DEFAULT ''semanal'',
  proximo_envio DATETIME NULL,
  ultimo_envio DATETIME NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario_fk),
  KEY idx_relatorio_automatico_agendamento (ativo, proximo_envio),
  CONSTRAINT fk_relatorio_automatico_usuario FOREIGN KEY (id_usuario_fk)
    REFERENCES USUARIO (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE agrovia_schema_stmt FROM @agrovia_schema_sql;
EXECUTE agrovia_schema_stmt;
DEALLOCATE PREPARE agrovia_schema_stmt;
