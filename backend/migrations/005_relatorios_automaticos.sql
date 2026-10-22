CREATE TABLE IF NOT EXISTS RELATORIO_AUTOMATICO (
  id_usuario_fk INT UNSIGNED NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 0,
  frequencia ENUM('diario', 'semanal') NOT NULL DEFAULT 'semanal',
  proximo_envio DATETIME NULL,
  ultimo_envio DATETIME NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario_fk),
  KEY idx_relatorio_automatico_agendamento (ativo, proximo_envio),
  CONSTRAINT fk_relatorio_automatico_usuario FOREIGN KEY (id_usuario_fk)
    REFERENCES USUARIO (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
