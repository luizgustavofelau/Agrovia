CREATE TABLE IF NOT EXISTS USUARIO (
  id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(191) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(30) NULL,
  tipo_usuario VARCHAR(30) NOT NULL DEFAULT 'AGRICULTOR',
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CULTURAS (
  id_cultura INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_cultura VARCHAR(120) NOT NULL,
  descricao_tecnica VARCHAR(500) NULL,
  umidade_ideal_min DECIMAL(5,2) NULL,
  umidade_ideal_max DECIMAL(5,2) NULL,
  PRIMARY KEY (id_cultura),
  UNIQUE KEY uq_culturas_nome (nome_cultura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS FAZENDAS (
  id_fazenda INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_fazenda VARCHAR(150) NOT NULL,
  localizacao VARCHAR(255) NULL,
  id_usuario_fk INT UNSIGNED NOT NULL,
  id_cultura_fk INT UNSIGNED NULL,
  PRIMARY KEY (id_fazenda),
  KEY idx_fazendas_usuario (id_usuario_fk),
  KEY idx_fazendas_cultura (id_cultura_fk),
  CONSTRAINT fk_fazendas_usuario FOREIGN KEY (id_usuario_fk)
    REFERENCES USUARIO (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_fazendas_cultura FOREIGN KEY (id_cultura_fk)
    REFERENCES CULTURAS (id_cultura) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DISPOSITIVOS (
  id_dispositivo INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mac_address VARCHAR(17) NOT NULL,
  status_conexao ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
  id_fazenda_fk INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_dispositivo),
  UNIQUE KEY uq_dispositivos_mac (mac_address),
  KEY idx_dispositivos_fazenda (id_fazenda_fk),
  CONSTRAINT fk_dispositivos_fazenda FOREIGN KEY (id_fazenda_fk)
    REFERENCES FAZENDAS (id_fazenda) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;