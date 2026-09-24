ALTER TABLE DISPOSITIVOS
  ADD COLUMN nome_dispositivo VARCHAR(100) NULL AFTER id_dispositivo,
  ADD COLUMN id_campo INT NULL AFTER id_fazenda_fk;