// Copie este arquivo para config.h (ignorado pelo Git) e preencha com os dados reais.
// Nunca envie config.h para o repositório: ele contém a senha do Wi-Fi e a chave do dispositivo.
#pragma once

// ── Rede ───────────────────────────────────────────────────────────────
#define WIFI_SSID "nome-da-rede"
#define WIFI_PASS "senha-da-rede"

// ── API Agrovia ────────────────────────────────────────────────────────
// Somente a origem, sem /api e sem barra final. Ex.: https://agrovia-sboe.onrender.com
#define API_ORIGEM "https://agrovia-sboe.onrender.com"
// Chave gerada no painel: Sensores → menu do dispositivo → "Gerar chave do dispositivo".
#define DEVICE_KEY "agv_cole_aqui_a_chave_gerada"

// Certificado raiz da autoridade que assina o HTTPS da API (formato PEM).
// Sem ele a conexão não é verificada e pode ser interceptada.
// Para testes de bancada, ALLOW_INSECURE_TLS 1 aceita qualquer certificado — nunca em campo.
#define ALLOW_INSECURE_TLS 0
static const char ROOT_CA[] PROGMEM = R"PEM(
-----BEGIN CERTIFICATE-----
cole aqui o certificado raiz (ex.: ISRG Root X1 ou GTS Root R1, conforme o provedor)
-----END CERTIFICATE-----
)PEM";

// ── Pinos ──────────────────────────────────────────────────────────────
// Use um pino do ADC1 (32 a 39): o ADC2 não funciona enquanto o Wi-Fi está ligado.
#define PINO_SENSOR 34
// Pino que aciona o relé/driver da válvula ou bomba.
#define PINO_RELE 26
// Muitos módulos de relé ligam com nível LOW. Ajuste conforme o seu módulo.
#define RELE_ATIVO_EM_LOW 1

// ── Calibração do sensor capacitivo ────────────────────────────────────
// Leia o valor bruto com o sensor no ar/solo seco e depois em água/solo saturado.
// O firmware converte linearmente para 0–100 %.
#define LEITURA_SECO 3200
#define LEITURA_MOLHADO 1300

// ── Tempos ─────────────────────────────────────────────────────────────
#define INTERVALO_LEITURA_S 60
// Limite de segurança local: a válvula nunca fica aberta mais que isso por comando,
// mesmo que a API peça mais ou que a internet caia durante a irrigação.
#define IRRIGACAO_MAXIMA_S 3600
