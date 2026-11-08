// Firmware de referência — ESP32 + sensor capacitivo de umidade do solo + relé de irrigação.
//
// Fluxo: a cada INTERVALO_LEITURA_S o aparelho mede a umidade e envia para
// POST /api/iot/leituras. A resposta traz os comandos pendentes (LIGAR/DESLIGAR),
// que são executados localmente e confirmados em POST /api/iot/comandos/:id/confirmacao.
//
// Segurança de campo:
// - O relé começa DESLIGADO a cada boot e após qualquer reinício pelo watchdog.
// - O desligamento é por tempo, controlado pelo próprio ESP32: a válvula fecha no prazo
//   mesmo sem internet, e nunca passa de IRRIGACAO_MAXIMA_S.
// - Leituras que falham no envio ficam em memória (até 50) e seguem com o horário real (NTP).
//
// Bibliotecas: núcleo ESP32 para Arduino (2.x ou 3.x) e ArduinoJson 7.
// Placa: "ESP32 Dev Module". Copie config.example.h para config.h antes de compilar.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>
#include <time.h>
#include "config.h"

static const int MAX_BUFFER = 50;
struct Leitura { float umidade; time_t momento; };
Leitura buffer[MAX_BUFFER];
int bufferTotal = 0;

unsigned long proximaLeituraMs = 0;
unsigned long valvulaFechaEmMs = 0;
bool valvulaAberta = false;
// Valor bruto do ADC da última leitura: aparece no Monitor Serial para calibrar LEITURA_SECO/MOLHADO.
float ultimoBruto = 0;

void acionarRele(bool ligar) {
  const bool nivel = RELE_ATIVO_EM_LOW ? !ligar : ligar;
  digitalWrite(PINO_RELE, nivel ? HIGH : LOW);
  valvulaAberta = ligar;
}

void fecharValvula(const char* motivo) {
  if (valvulaAberta) Serial.printf("[VALVULA] Fechada: %s\n", motivo);
  acionarRele(false);
  valvulaFechaEmMs = 0;
}

float lerUmidade() {
  long soma = 0;
  for (int i = 0; i < 16; i++) { soma += analogRead(PINO_SENSOR); delay(5); }
  const float bruto = soma / 16.0f;
  ultimoBruto = bruto;
  float pct = (LEITURA_SECO - bruto) * 100.0f / (LEITURA_SECO - LEITURA_MOLHADO);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

bool conectarWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) { delay(250); esp_task_wdt_reset(); }
  if (WiFi.status() != WL_CONNECTED) return false;
  Serial.printf("[WIFI] Conectado a \"%s\" | IP %s\n", WIFI_SSID, WiFi.localIP().toString().c_str());
  return true;
}

// Chamada HTTPS à API com a chave do dispositivo. Retorna o código HTTP (ou < 0 em falha).
int chamarApi(const char* metodo, const String& caminho, const String& corpo, String& resposta) {
  WiFiClientSecure cliente;
#if ALLOW_INSECURE_TLS
  cliente.setInsecure();
#else
  cliente.setCACert(ROOT_CA);
#endif
  HTTPClient http;
  http.setTimeout(15000);
  // Handshake TLS + resposta podem levar vários segundos (o Render "acorda" em até ~1 min):
  // avisa o watchdog antes e depois para o aparelho não reiniciar no meio da chamada.
  esp_task_wdt_reset();
  if (!http.begin(cliente, String(API_ORIGEM) + caminho)) return -1;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  const int codigo = http.sendRequest(metodo, corpo);
  resposta = codigo > 0 ? http.getString() : "";
  http.end();
  esp_task_wdt_reset();
  return codigo;
}

void confirmarComando(long id, bool sucesso, const char* mensagem) {
  JsonDocument doc;
  doc["status"] = sucesso ? "EXECUTADO" : "FALHOU";
  doc["mensagem"] = mensagem;
  String corpo, resposta;
  serializeJson(doc, corpo);
  const int codigo = chamarApi("POST", "/api/iot/comandos/" + String(id) + "/confirmacao", corpo, resposta);
  Serial.printf("[COMANDO] #%ld confirmado (%d)\n", id, codigo);
}

void executarComandos(JsonArray comandos) {
  for (JsonObject c : comandos) {
    const long id = c["id"] | 0L;
    const String acao = c["acao"] | "";
    if (acao == "LIGAR") {
      long duracao = c["duracaoSegundos"] | 0L;
      if (duracao <= 0) { confirmarComando(id, false, "Duracao invalida"); continue; }
      if (duracao > IRRIGACAO_MAXIMA_S) duracao = IRRIGACAO_MAXIMA_S;
      acionarRele(true);
      valvulaFechaEmMs = millis() + (unsigned long)duracao * 1000UL;
      Serial.printf("[VALVULA] Aberta por %ld s\n", duracao);
      confirmarComando(id, true, "Valvula aberta");
    } else if (acao == "DESLIGAR") {
      fecharValvula("comando DESLIGAR");
      confirmarComando(id, true, "Valvula fechada");
    } else {
      confirmarComando(id, false, "Acao desconhecida");
    }
  }
}

void guardarLeitura(float umidade) {
  if (bufferTotal == MAX_BUFFER) {  // descarta a mais antiga
    memmove(buffer, buffer + 1, sizeof(Leitura) * (MAX_BUFFER - 1));
    bufferTotal--;
  }
  buffer[bufferTotal++] = { umidade, time(nullptr) };
}

void enviarLeituras() {
  JsonDocument doc;
  JsonArray lista = doc["leituras"].to<JsonArray>();
  const bool relogioOk = time(nullptr) > 1700000000;  // NTP sincronizado
  for (int i = 0; i < bufferTotal; i++) {
    JsonObject l = lista.add<JsonObject>();
    l["umidade"] = roundf(buffer[i].umidade * 10) / 10;
    if (relogioOk) l["timestamp"] = (long)buffer[i].momento;
  }
  String corpo, resposta;
  serializeJson(doc, corpo);
  const int codigo = chamarApi("POST", "/api/iot/leituras", corpo, resposta);
  if (codigo == 201) {
    Serial.printf("[API] %d leitura(s) enviada(s) com sucesso\n", bufferTotal);
    bufferTotal = 0;
    JsonDocument r;
    if (!deserializeJson(r, resposta)) executarComandos(r["comandos"].as<JsonArray>());
  } else {
    Serial.printf("[API] Envio falhou (%d); %d leitura(s) guardada(s)\n", codigo, bufferTotal);
    if (codigo == 401) Serial.println("[API] Chave recusada: confira DEVICE_KEY ou gere uma nova chave no painel.");
    else if (codigo < 0) Serial.println("[API] Sem resposta: confira API_ORIGEM, o certificado (ROOT_CA) e a internet. O Render pode levar ~1 min para acordar.");
  }
}

void setup() {
  pinMode(PINO_RELE, OUTPUT);
  acionarRele(false);  // primeiro de tudo: válvula fechada
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(PINO_SENSOR, ADC_11db);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  esp_task_wdt_config_t wdt = { .timeout_ms = 30000, .idle_core_mask = 0, .trigger_panic = true };
  esp_task_wdt_reconfigure(&wdt);
#else
  esp_task_wdt_init(30, true);
#endif
  esp_task_wdt_add(NULL);
  WiFi.mode(WIFI_STA);
  // O MAC é o que se cadastra no painel (Sensores → Adicionar dispositivo).
  Serial.printf("\n[AGROVIA] MAC deste ESP32: %s\n", WiFi.macAddress().c_str());
  Serial.printf("[AGROVIA] API: %s\n", API_ORIGEM);
  if (!conectarWifi()) Serial.println("[WIFI] Falha ao conectar; nova tentativa a cada leitura.");
  configTime(0, 0, "pool.ntp.org", "time.google.com");
}

void loop() {
  esp_task_wdt_reset();

  // O fechamento por tempo roda a cada volta, com ou sem internet.
  if (valvulaAberta && (long)(millis() - valvulaFechaEmMs) >= 0) fecharValvula("tempo concluido");

  if ((long)(millis() - proximaLeituraMs) >= 0) {
    proximaLeituraMs = millis() + INTERVALO_LEITURA_S * 1000UL;
    const float umidade = lerUmidade();
    Serial.printf("[SENSOR] Umidade %.1f %% (valor bruto %.0f)\n", umidade, ultimoBruto);
    guardarLeitura(umidade);
    if (conectarWifi()) enviarLeituras();
    else Serial.println("[WIFI] Sem conexao; leitura guardada.");
  }
  delay(200);
}
